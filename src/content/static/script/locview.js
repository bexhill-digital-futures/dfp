const LOC_TITLE = document.getElementById("loc-title");
const LOC_DESC = document.getElementById("loc-desc");
const LOC_RATINGS = document.getElementById("loc-ratings");

async function load(lon, lat, uid) {
    let loc = await get_location(lon, lat, uid);
    if (loc) {
        LOC_TITLE.innerText = loc.name;
        LOC_DESC.innerText = loc.desc;
        // TODO: render ratings
    } else {
        LOC_TITLE.innerText = "Not Found";
        LOC_DESC.innerText = "The location you're trying to find doesn't exist!";
    }
}

// commence

let loc_search = new URLSearchParams(window.location.search);
load(parseFloat(loc_search.get("so")), parseFloat(loc_search.get("sl")), loc_search.get("id"));
