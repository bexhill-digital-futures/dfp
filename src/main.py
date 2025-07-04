#!/usr/local/bin/python3.13

import os
import data
import time
import util
import random
import asyncio
import requests
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
    if util.cfg.get("make_garbage", False) is False:
        return

    await util.alog("info", "Generating garbage data")
    await util.alog("warn", "Garbage generation may take a while")

    for i in range(100):
        o = (random.random() * .02) + .292608
        l = (random.random() * .02) + 50.770389

        reviews = []
        for _ in range(6):
            reviews.append(data.MapReview(
                await util.generate_cool_name(),
                str(random.randint(0, 1000)),
                {
                    "steps": random.randint(0, 2),
                    "floor": random.randint(0, 2),
                    "elevator": random.randint(0, 2),
                    "ramp": random.randint(0, 2),
                },
                await util.generate_cool_name()
            ))

        await data.set_location(data.MapLocation(
            await data.generate_uid(),
            f"a very nice location at {o}, {l}",
            f"read the title, disable garbage generation",
            l,
            o,
            reviews
        ), False)
    await util.alog("info", f"Committing generation")
    data.db.DATABASE.commit()

    await util.alog("ok", "Garbage generation complete!")

# client pages

@app.route("/") # home
async def page_home():
    return await render_template("index.html")

@app.route("/loc", methods=["GET"])
async def page_location():
    res = Response(await render_template("location.html"), 200, mimetype="text/html")
    return res

@app.route("/drop", methods=["GET"])
async def page_drop():
    return await render_template("drop.html")

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

# favicon ig

@app.route("/favicon.ico", methods=["GET"])
async def favicon():
    return await send_file(f"{util.STATIC_BASE}icon/favicon.ico")

# map chunk route

@app.route("/map/<float:lat>/<float:lon>", methods=["GET"])
async def map_getchunk(lat:float, lon:float):
    locations = await data.get_locations_in_chunk(lon, lat)
    return [await locations[i].to_dict(False) for i in locations]

# location controls

@app.route("/loc", methods=["POST"])
async def map_newloc():
    ctn = await request.get_json(True)
    loc = data.MapLocation(
        await data.generate_uid(),
        ctn["name"],
        ctn["desc"],
        ctn["lat"],
        ctn["lon"],
        []
    )
    await data.set_location(loc)
    return loc.uid

@app.route("/loc/<float:lat>/<float:lon>/<string:uid>", methods=["GET"])
async def map_getloc(lat:float, lon:float, uid:str):
    candidates = await data.get_locations_in_chunk(lon, lat)
    for i in candidates:
        if candidates[i].uid == uid:
            return await candidates[i].to_dict()
    return "Not Found", 404

# review controls

@app.route("/review", methods=["POST"])
async def map_review():
    lon = request.args.get("lon", 0, float)
    lat = request.args.get("lat", 0, float)
    uid = request.args.get("uid")
    content = await request.get_json(True)
    
    candidates = await data.get_locations_in_chunk(lon, lat)
    loc: data.MapLocation = None
    for i in candidates:
        if candidates[i].uid == uid:
            loc = candidates[i]
    
    if loc is None:
        return "Not Found", 404
    
    ratings = content["ratings"]
    for key in data.RATING_KEYS:
        if key in ratings:
            if ratings[key] != 0 and ratings[key] != 1 and ratings[key] != 2:
                return "Bad Request", 400
        else:
            return "Bad Request", 400
    for key in ratings:
        if not key in data.RATING_KEYS:
            return "Bad Request", 400

    loc.reviews.append(data.MapReview(
        await util.generate_cool_name(),
        str(random.randint(0, 1000)),
        ratings,
        content["message"]
    ))
    await data.set_location(loc)

    return "ok"

# pfp server

@app.route("/pfp", methods=["GET"])
async def pfp():
    key = f"pfp-{request.args.get('id', 'null')}"
    result = None

    if key in data.db.DATABASE:
        result = data.db.DATABASE[key]
    else:
        # when in doubt, hand off to a different service
        temp = requests.get(f"https://cats.billbot.win/give/me/a/cat?q={time.time_ns()}")
        result = temp.content
        data.db.DATABASE[key] = result
    
    res = Response(result, 200, mimetype="image/png")
    return res

# launch

if __name__ == "__main__":
    cfg = Config()
    cfg.bind = [f"127.0.0.1:{util.cfg.get('server', {}).get('port', 80)}"]

    if util.cfg.get("make_garbage", False) is True:
        cfg.startup_timeout = 86400

    asyncio.run(serve(app, cfg))
