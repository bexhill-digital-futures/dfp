// constants

const MIN_MARKER_ZOOM_LEVEL = 12;

// a few utilities

async function make_marker() {
    let marker = document.createElement("div");
    marker.className = "marker";

    let inner = document.createElement("img");
    inner.className = "icon full";
    inner.src = "/src/icon/placeholder.png";
    marker.append(inner);

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

map.on("moveend", async () => {
    if (map.getZoom() < MIN_MARKER_ZOOM_LEVEL) {
        for (const [i,v] of Object.entries(active_locs)) {
            v.remove();
        }
        active_locs = {};
        return;
    }

    let bounds = map.getBounds();
    let coords = map.getCenter();
    let locations = await get_chunk_locations(coords.lng, coords.lat); // first useful api cool WOOOOOOOOOOOOOOOOOOOOOOOOOOOO

    let sw = bounds.getSouthWest();
    let ne = bounds.getNorthEast();

    if (!locations) { // chunk doesn't exist, nothing to do
        for (const [i,v] of Object.entries(active_locs)) {
            v.remove();
        }
        active_locs = {};
        return;
    }

    console.log(`bounds: ${sw.lng}, ${sw.lat} to ${ne.lng}, ${ne.lat}`);

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
        let marker = new maplibregl.Marker({element: await make_marker()})
            .setLngLat({
                "lng": v.position.lon,
                "lat": v.position.lat
            })
            .setPopup(new maplibregl.Popup({offset: 25}).setText(v.name))
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
})
