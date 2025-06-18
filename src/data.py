#!/usr/local/bin/python3.13

import db
import time
import util
import typing
from hashlib import md5

# constants

POSITION_PRECISION = 2 ** 32 # fixed point lol
POSITION_LENGTH = 12 # this is in bytes
CHUNK_DENSITY = 1 / 360 # chunks per degree

RATING_KEYS = [ # 0 = negative, 1 = neutral, 2 = positive
    "steps", # 0 = only steps, 2 = step-free
    "floor", # 0 = rough floor (inc. potholes), 2 = smooth
    "elevator", # 0 = no elevators, 2 = elevators
    "ramp", # 0 = none but needed, 2 = ramps or not required
]

# utility

async def write_str(s:str, to:typing.BinaryIO):
    raw = bytes(s, "utf8")
    to.write(len(raw).to_bytes(4, "little", signed=False))
    to.write(raw)

async def read_str(f:typing.BinaryIO) -> str:
    return str(f.read(int.from_bytes(f.read(4), "little", signed=False)), "utf8")

async def generate_uid(seed:int|None=None) -> str:
    if seed is None:
        seed = time.time_ns()
    return md5(seed.to_bytes(16, "little", signed=True)).hexdigest()

# saved/db types - chicken joe

class MapReview(db.SupportsDatabase):
    def __init__(self, sender_name:str, sender_pfp_key:str, ratings:typing.Dict[str,int]):
        self.sender_name = sender_name
        self.sender_pfp_key = sender_pfp_key
        self.ratings = ratings
    
    async def serialize(self, f):
        await write_str(self.sender_name, f)
        await write_str(self.sender_pfp_key, f)
        f.write(len(self.ratings.keys()).to_bytes(2, "little", signed=False))
        for key in self.ratings:
            await write_str(key, f)
            f.write(self.ratings[key].to_bytes(1, "little", signed=False))
    
    @classmethod
    async def deserialize(self, f):
        name = await read_str(f)
        pfp_key = await read_str(f)
        ratings = {}
        for i in range(int.from_bytes(f.read(2), "little", signed=False)):
            key = await read_str(f)
            value = int.from_bytes(f.read(1), "little", signed=False)
            ratings[key] = value
        return self(name, pfp_key, ratings)

    async def to_dict(self) -> dict:
        return {
            "sender": {
                "name": self.sender_name,
                "pfp": self.sender_pfp_key
            },
            "ratings": self.ratings
        }

class MapLocation(db.SupportsDatabase):
    def __init__(self, uid:str, name:str, desc:str, lat:float, lon:float, reviews:list[MapReview]):
        self.uid = uid
        self.name = name
        self.desc = desc
        self.position = (lat,lon)
        self.reviews = reviews

    async def serialize(self, f):
        await write_str(self.uid, f)
        await write_str(self.name, f)
        await write_str(self.desc, f)
        f.write(int(self.position[0] * POSITION_PRECISION).to_bytes(POSITION_LENGTH, "little", signed=True))
        f.write(int(self.position[1] * POSITION_PRECISION).to_bytes(POSITION_LENGTH, "little", signed=True))
        f.write(len(self.reviews).to_bytes(4, "little", signed=False))
        for i in self.reviews:
            await i.serialize(f)
    
    @classmethod
    async def deserialize(self, f):
        uid = await read_str(f)
        name = await read_str(f)
        desc = await read_str(f)
        lat = int.from_bytes(f.read(POSITION_LENGTH), "little", signed=True) / POSITION_PRECISION
        lon = int.from_bytes(f.read(POSITION_LENGTH), "little", signed=True) / POSITION_PRECISION
        reviews = []
        for i in range(int.from_bytes(f.read(4), "little", signed=False)):
            reviews.append(await MapReview.deserialize(f))
        return self(uid, name, desc, lat, lon, reviews)
    
    async def to_dict(self, dump_reviews:bool=True) -> dict:
        res = {
            "uid": self.uid,
            "name": self.name,
            "desc": self.desc,
            "position": {
                "lat": self.position[0],
                "lon": self.position[1]
            }
        }
        if dump_reviews is True:
            res["reviews"] = [await i.to_dict() for i in self.reviews]
            res["ratings"] = await self.get_ratings()
        return res

    async def get_ratings(self) -> typing.Dict[str,int]: # 0 through 4 for no. stars - 1
        totals = {}
        for i in RATING_KEYS:
            totals[i] = [0,0]
        for i in self.reviews:
            for key in RATING_KEYS:
                if key in i.ratings:
                    if i.ratings[key] != 1:
                        totals[key][0] += i.ratings[key] * 2
                        totals[key][1] += 1
        
        results = {}
        for i in totals:
            results[i] = int(totals[i][0] / totals[i][1])

        return results

class MapChunk(db.SupportsDatabase):
    def __init__(self, locations:typing.Dict[str,MapLocation]):
        self.locations = locations

    async def serialize(self, f):
        f.write(len(self.locations).to_bytes(4, "little", signed=False))
        for i in self.locations:
            await i.serialize(f)
    
    @classmethod
    async def deserialize(self, f):
        locations = {}
        for i in range(int.from_bytes(f.read(4), "little", signed=False)):
            loc = await MapLocation.deserialize(f)
            locations[loc.uid] = loc
        return self(locations)
    
    @classmethod
    async def default(self):
        return self({})

# map handler

async def get_chunk_id(lon:float, lat:float) -> str:
    return f"{int(lon * CHUNK_DENSITY)}-{int(lat * CHUNK_DENSITY)}"

async def get_locations_in_chunk(lon:float, lat:float) -> list[MapLocation]:
    chunk = await db.get(f"locations-{await get_chunk_id(lon, lat)}", MapChunk)
    return chunk.locations

async def set_location(loc:MapLocation):
    key = f"locations-{await get_chunk_id(*loc.position)}"
    chunk = await db.get(key, MapChunk)
    chunk.locations[loc.uid] = loc
    await db.set(key, chunk)
