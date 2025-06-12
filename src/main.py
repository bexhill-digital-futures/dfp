#!/usr/local/bin/python3.13

import os
import data
import util
import random
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

# generate a load of garbage data

@app.before_serving
async def generate_garbage():
    # 360 * 360 * 100... that's 12.96 million test points
    # sounds good to me

    if util.cfg.get("make_garbage", False) is False:
        return

    await util.alog("info", "Generating garbage data")
    await util.alog("warn", "Garbage generation may take a while because it is iterating over each axis 360 times and generating 100 locations for each chunk...")

    for x in range(180 * 2):
        lat = x / 2
        for y in range(180 * 2):
            lon = y / 2
            locations = []
            for i in range(100):
                l = (random.random() * .5) + lat
                o = (random.random() * .5) + lon

                locations.append(data.MapLocation(
                    f"cool location at {l}, {o}",
                    "\n".join([
                        f"just a cool location at {l}, {o}",
                        "this was generated automatically for testing",
                        "to disable, set `make_garbage` in `cfg.yaml` to `false`",
                        "THIS IS WHY IT TOOK SO LONG TO START THE SERVER"
                    ]),
                    l,
                    o,
                    []
                ))
            await data.db.set(f"locations-{await data.get_chunk_id(l, o)}", data.MapChunk(locations))

    await util.alog("ok", "Garbage generation complete!")

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

# map chunk route

@app.route("/map/<float:lat>/<float:lon>", methods=["GET"])
async def map_getchunk(lat:float, lon:float):
    locations = await data.get_locations_in_chunk(lat, lon)
    return [await i.to_dict() for i in locations]

# launch

if __name__ == "__main__":
    cfg = Config()
    cfg.bind = [f"127.0.0.1:{util.cfg.get('server', {}).get('port', 80)}"]

    asyncio.run(serve(app, cfg))
