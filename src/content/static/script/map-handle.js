// constants

const MIN_MARKER_ZOOM_LEVEL = 14;
const BAD_RATING_THRESHOLD = 1.25;
const GOOD_RATING_THRESHOLD = 2.75;

const MAP_NAVBAR = document.getElementById("map-navbar");
const MAP_DROP = document.getElementById("map-drop");

// a few utilities

async function make_marker(redir_to, rating) {
    let marker = document.createElement("div");
    marker.className = "marker";

    let inner = document.createElement("img");
    inner.className = "icon full";

    if (rating < BAD_RATING_THRESHOLD) {
        inner.src = "/src/icon/pin-negative.svg";
    } else if (rating > GOOD_RATING_THRESHOLD) {
        inner.src = "/src/icon/pin-positive.svg";
    } else {
        inner.src = "/src/icon/pin-neutral.svg";
    }

    marker.append(inner);

    let button = document.createElement("button");
    marker.append(button)

    button.addEventListener("click", () => {
        window.location.href = redir_to.replaceAll(":Z;", map.getZoom().toString());
    })

    return marker;
}

// map init

const map = new maplibregl.Map({
    container: 'map', // container id
    style: '/src/map/style.json', // style URL - would be hilarious if i hosted this with the cat index
    center: [.292608, 50.770389], // GOD DAMN THE SUN
    zoom: 10, // starting zoom - idk what unit this is
    style: {
    version: 8,
    sources: {
        'osm-raster': {
            type: 'raster',
            tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256
        }
    },
    layers: [
        {
            id: 'osm-raster-layer',
            type: 'raster',
            source: 'osm-raster',
            paint: {}
        }
    ]
  }
});

// chunk streaming

let active_locs = {}; // key: uid, value: marker
let drop_mode = false; // true = dropping a pin

async function update_markers() {
    if (map.getZoom() < MIN_MARKER_ZOOM_LEVEL || drop_mode) {
        for (const [i,v] of Object.entries(active_locs)) {
            v.remove();
        }
        active_locs = {};
        return;
    }

    let bounds = map.getBounds();
    let coords = map.getCenter();
    let locations = await get_chunk_locations(coords.lng, coords.lat); // first useful api call WOOOOOOOOOOOOOOOOOOOOOOOOOOOO

    let sw = bounds.getSouthWest();
    let ne = bounds.getNorthEast();

    if (!locations) { // chunk doesn't exist, nothing to do
        for (const [i,v] of Object.entries(active_locs)) {
            v.remove();
        }
        active_locs = {};
        return;
    }

    let handled_uids = {};
    for (let i=0; i<locations.length; i++) {
        const v = locations[i];

        if (active_locs[v.uid]) {
            handled_uids[v.uid] = true;
            continue;
        }

        if (v.position.lon < sw.lng ||
            v.position.lon > ne.lng ||
            v.position.lat < sw.lat ||
            v.position.lat > ne.lat
        ) {
            continue;
        }

        handled_uids[v.uid] = true;
        let marker = new maplibregl.Marker(
            {
                element: await make_marker(
                    `/loc?sm=map&sl=${v.position.lat}&so=${v.position.lon}&sz=:Z;&id=${v.uid}`,
                    v.rating
                )
            }
        )
            .setLngLat({
                "lng": v.position.lon,
                "lat": v.position.lat
            })
            .addTo(map)
        active_locs[v.uid] = marker;
    }

    let active = 0;
    for (const [i,v] of Object.entries(active_locs)) {
        if (!handled_uids[i]) {
            v.remove();
            active_locs[i] = undefined; // i sure hope this doesn't cause any errors in the loop!
        } else {
            active++;
        }
    }
}

map.on("moveend", update_markers)

// additional controls

document.getElementById("ctl-zoom-in").addEventListener("click", () => {
    map.zoomIn();
})
document.getElementById("ctl-zoom-out").addEventListener("click", () => {
    map.zoomOut();
})

// resume session

let loc_search = new URLSearchParams(window.location.search);

let parse_safe = function(s, def) {
    let res = parseFloat(s);
    if (Number.isNaN(res)) {
        return def;
    }
    return res;
}

if (loc_search.get("lat") != null && loc_search.get("lon") != null) {
    let params = {
        "center": [
            parse_safe(loc_search.get("lon"), 0),
            parse_safe(loc_search.get("lat"), 0)
        ]
    }
    if (loc_search.get("zoom") != null) {
        params["zoom"] = parse_safe(loc_search.get("zoom"), 10);
    }

    map.jumpTo(params);
}

// pin droppage

document.getElementById("ctl-drop-pin").addEventListener("click", () => {
    MAP_NAVBAR.style.display = "none";
    MAP_DROP.style.display = "block";
    drop_mode = true;
    for (const [i,v] of Object.entries(active_locs)) {
        v.remove();
    }
    active_locs = {};
})
document.getElementById("map-drop-submit").addEventListener("click", () => {
    let center = map.getCenter();
    window.location.href = `/drop?lat=${center.lat}&lon=${center.lng}&sz=${map.getZoom()}`;
})
document.getElementById("map-drop-cancel").addEventListener("click", () => {
    drop_mode = false;
    MAP_NAVBAR.style.display = "block";
    MAP_DROP.style.display = "none";
    update_markers();
})
