#!/usr/local/bin/python3.13

import io
import util
import typing
from sqlitedict import SqliteDict

# sqlitedict is easier than directly handling the db

DATABASE = SqliteDict(f"{util.DATA_PATH}/data.db", "dfp", autocommit=True, encode=lambda x : x, decode=lambda x : x)

# base class for serialization/deserialization

class SupportsDatabase:
    def __init__(self):
        pass

    async def serialize(self, f:typing.BinaryIO):
        pass
    
    @classmethod
    async def deserialize(self, f:typing.BinaryIO) -> typing.Self:
        pass

# additional

T_SupportsDatabase = typing.TypeVar("T_SupportsDatabase", bound=SupportsDatabase)

# utils for get/set

async def get(key:str, cast_to:type[T_SupportsDatabase]) -> T_SupportsDatabase:
    temp = io.BytesIO(DATABASE[key])
    return await cast_to.deserialize(temp)

async def set(key:str, value:T_SupportsDatabase):
    temp = io.BytesIO()
    await value.serialize(temp)
    DATABASE[key] = temp.getvalue()
