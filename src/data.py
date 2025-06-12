#!/usr/local/bin/python3.13

import db
import util
import typing

# constants

POSITION_PRECISION = 2 ** 32 # fixed point lol
POSITION_LENGTH = 12 # this is in bytes
CHUNK_DENSITY = 2 # chunks per degree

# utility

async def write_str(s:str, to:typing.BinaryIO):
    raw = bytes(s, "utf8")
    to.write(len(raw).to_bytes(4, "little", signed=False))
    to.write(raw)

async def read_str(f:typing.BinaryIO) -> str:
    return str(f.read(int.from_bytes(f.read(4), "little", signed=False)), "utf8")


# saved/db types

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
    def __init__(self, name:str, desc:str, lat:float, lon:float, reviews:list[MapReview]):
        self.name = name
        self.desc = desc
        self.position = (lat,lon)
        self.reviews = reviews

    async def serialize(self, f):
        await write_str(self.name, f)
        await write_str(self.desc, f)
        f.write(int(self.position[0] * POSITION_PRECISION).to_bytes(POSITION_LENGTH, "little", signed=True))
        f.write(int(self.position[1] * POSITION_PRECISION).to_bytes(POSITION_LENGTH, "little", signed=True))
        f.write(len(self.reviews).to_bytes(4, "little", signed=False))
        for i in self.reviews:
            await i.serialize(f)
    
    @classmethod
    async def deserialize(self, f):
        name = await read_str(f)
        desc = await read_str(f)
        lat = int.from_bytes(f.read(POSITION_LENGTH), "little", signed=True) / POSITION_PRECISION
        lon = int.from_bytes(f.read(POSITION_LENGTH), "little", signed=True) / POSITION_PRECISION
        reviews = []
        for i in range(int.from_bytes(f.read(4), "little", signed=False)):
            reviews.append(await MapReview.deserialize(f))
        return self(name, desc, lat, lon, reviews)
    
    async def to_dict(self) -> dict:
        return {
            "name": self.name,
            "desc": self.desc,
            "position": {
                "lat": self.position[0],
                "lon": self.position[1]
            },
            "reviews": [await i.to_dict() for i in self.reviews]
        }

class MapChunk(db.SupportsDatabase):
    def __init__(self, locations:list[MapLocation]):
        self.locations = locations

    async def serialize(self, f):
        f.write(len(self.locations).to_bytes(4, "little", signed=False))
        for i in self.locations:
            await i.serialize(f)
    
    @classmethod
    async def deserialize(self, f):
        locations = []
        for i in range(int.from_bytes(f.read(4), "little", signed=False)):
            locations.append(await MapLocation.deserialize(f))
        return self(locations)
    
    @classmethod
    async def default(self):
        return self([])

# map handler

async def get_chunk_id(lat:float, lon:float) -> str:
    return f"{int(lat * CHUNK_DENSITY)}-{int(lon * CHUNK_DENSITY)}"

async def get_locations_in_chunk(lat:float, lon:float) -> list[MapLocation]:
    chunk = await db.get(f"locations-{await get_chunk_id(lat, lon)}", MapChunk)
    return chunk.locations
