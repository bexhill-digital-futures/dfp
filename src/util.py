#!/usr/bin/python3.13

import os
import sys
import time
import yaml
import typing
import asyncio

# constants

DATA_PATH = os.environ.get("DFP_DATA", "data")
WORKING_DIR = os.environ.get("DFP_WORKING", os.path.dirname(sys.argv[0]))
LOG_TEMPLATES = {
    "dbg":   "\033[90m@T\033[0m  \033[96m\033[1mDEBUG\033[0m\t @M",
    "ok":    "\033[90m@T\033[0m  \033[96m\033[1mOK   \033[0m\t @M",
    "info":  "\033[90m@T\033[0m  \033[96m\033[1mINFO \033[0m\t @M",
    "warn":  "\033[90m@T\033[0m  \033[96m\033[1mWARN \033[0m\t @M",
    "err":   "\033[90m@T\033[0m  \033[96m\033[1mERROR\033[0m\t @M"
}

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
    timestamp = time.strftime("%H:%M:%S %YYYY/%m/%d")
    template = LOG_TEMPLATES[level]
    print(template.replace("@T", timestamp).replace("@M", ' '.join(args)))

async def alog(level:LogLevel, *args):
    await asyncio.to_thread(log(level, *args))

# config

cfg = {}

with open(f"{DATA_PATH}/cfg.yaml", "r") as f:
    cfg = yaml.safe_load(f.read())
