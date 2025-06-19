#!/usr/local/bin/python3.13

import io
import util
import typing
import asyncio
from sqlitedict import SqliteDict

# sqlitedict is easier than directly handling the db

DATABASE = SqliteDict(
    util.cfg.get("database_path", f"{util.DATA_PATH}/data.db"),
    "dfp",
    encode=lambda x : x, decode=lambda x : x
)

# base class for serialization/deserialization

class SupportsDatabase:
    def __init__(self):
        pass

    async def serialize(self, f:typing.BinaryIO):
        pass
    
    @classmethod
    async def deserialize(self, f:typing.BinaryIO) -> typing.Self:
        pass

    @classmethod
    async def default(self) -> typing.Self|None:
        pass

# additional

T_SupportsDatabase = typing.TypeVar("T_SupportsDatabase", bound=SupportsDatabase)

# utils for get/set

async def get(key:str, cast_to:type[T_SupportsDatabase]) -> T_SupportsDatabase:
    if not (key in DATABASE):
        res = await cast_to.default()
        if res is None:
            raise KeyError(key)
        return res

    temp = io.BytesIO(DATABASE[key])
    return await cast_to.deserialize(temp)

async def set(key:str, value:T_SupportsDatabase, commit:bool=True):
    temp = io.BytesIO()
    await value.serialize(temp)
    DATABASE[key] = temp.getvalue()
    if commit is True:
        await asyncio.to_thread(DATABASE.commit)
