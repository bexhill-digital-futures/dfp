// mapapi.js
// just simplify the api calls i guess

async function get_chunk_locations(lon, lat) {
    // get the list of locations in that chunk

    let res = await fetch(`/map/${lat}/${lon}`, {"method": "GET"});
    if (res.status >= 200 && res.status < 300) {
        return await res.json();
    }
    throw new Error(`Failed to fetch map chunk: HTTP ${res.status}`);
}

async function get_location(lon, lat, uid) {
    // get the location with the given uid within the chunk where the lon/lat lie

    
}
