#!/usr/local/bin/python3.13

import os
import sys
import time
import yaml
import random
import typing
import asyncio

# constants

DATA_PATH = os.path.abspath(os.environ.get("DFP_DATA", "data"))
WORKING_DIR = os.path.abspath(
    os.environ.get("DFP_WORKING", os.path.dirname(sys.argv[0]))
)
STATIC_BASE = f"{WORKING_DIR}/content/static/"
LOG_TEMPLATES = {
    "dbg":   "\033[90m@T\033[0m  \033[95m\033[1mDEBUG\033[0m\t @M",
    "ok":    "\033[90m@T\033[0m  \033[92m\033[1mOK   \033[0m\t @M",
    "info":  "\033[90m@T\033[0m  \033[94m\033[1mINFO \033[0m\t @M",
    "warn":  "\033[90m@T\033[0m  \033[93m\033[1mWARN \033[0m\t @M",
    "err":   "\033[90m@T\033[0m  \033[91m\033[1mERROR\033[0m\t @M"
}

JUST_CHARS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
              "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
              "u", "v", "w", "x", "y", "z", "A", "B", "C", "D",
              "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
              "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
              "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7",
              "8", "9", "_"]

# some classes/types

LogLevel = typing.Literal[
    "dbg",
    "ok",
    "info",
    "warn",
    "err"
]

# logging

def log(level:LogLevel, *args):
    timestamp = time.strftime("%H:%M:%S %Y/%m/%d")
    template = LOG_TEMPLATES[level]
    print(template.replace("@T", timestamp).replace("@M", ' '.join(args)))

async def alog(level:LogLevel, *args):
    await asyncio.to_thread(log, level, *args)

# this

async def generate_cool_name() -> str:
    return "".join(random.sample(JUST_CHARS, 16))

# config

cfg: typing.Dict[str,any] = {}

with open(f"{DATA_PATH}/cfg.yaml", "r") as f:
    cfg = yaml.safe_load(f.read())
