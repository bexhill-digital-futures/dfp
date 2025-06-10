#!/usr/local/bin/python3.13

import os
import util
import asyncio
from hypercorn.asyncio import serve
from hypercorn.config import Config
from quart import Quart, request, Response, render_template, send_file

# init app

app = Quart(__name__, template_folder=f"{util.WORKING_DIR}/content/templates")

# logging

@app.after_request
async def request_logger(res:Response):
    await util.alog(
        "ok" if res.status_code in range(200, 299) else "err",
        f"\033[90m\033[1m{request.headers.get('CF-Connecting-IP', request.remote_addr)}\033[0m  "
            + f"\033[1m{request.method} {request.path}\033[0m  "
            + f"\033[1m{'\033[92m' if res.status_code in range(200, 299) else '\033[91m'}{res.status_code}\033[0m"
    )
    return res

# client pages

@app.route("/") # home
async def page_home():
    return await render_template("index.html")

@app.route("/src/<path:target>", methods=["GET"])
async def src_path(target:str):
    full = os.path.abspath(f"{util.STATIC_BASE}{target}")
    if full != f"{util.STATIC_BASE}{target}":
        # abs path is not the same as actual path, possible traversal attack
        return "Not Found", 404
    if full[:len(util.STATIC_BASE)] != util.STATIC_BASE:
        # abs path is NOT in the right dir
        return "Not Found", 404
    if os.path.exists(full):
        if os.path.isdir(full):
            return "Is A Directory", 400
        return await send_file(full)
    return "Not Found", 404

# launch

if __name__ == "__main__":
    cfg = Config()
    cfg.bind = [f"127.0.0.1:{util.cfg.get('server', {}).get('port', 80)}"]

    asyncio.run(serve(app, cfg))
