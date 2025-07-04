// mapapi.js
// just simplify the api calls i guess

async function get_chunk_locations(lon, lat) {
    // get the list of locations in that chunk

    let res = await fetch(`/map/${lat}/${lon}`, {"method": "GET"});
    if (res.status >= 200 && res.status < 300) { // mission accomplished
        return await res.json();
    } else if (res.status == 404) { // no error, just that the chunk doesn't exist
        return;
    }

    // well...
    throw new Error(`Failed to fetch map chunk: HTTP ${res.status}`);
}

async function get_location(lon, lat, uid) {
    // get the location with the given uid within the chunk where the lon/lat lie

    let res = await fetch(`/loc/${lat}/${lon}/${uid}`, {"method": "GET"});
    if (res.status >= 200 && res.status < 300) { // success WOOOOOOOOOOOOOOOOOOOOOOO
        return await res.json();
    } else if (res.status == 404) { // dam
        return;
    }

    // makaron =(
    throw new Error(`Failed to fetch location: HTTP ${res.status}`);
}
