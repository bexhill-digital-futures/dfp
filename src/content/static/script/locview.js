const LOC_TITLE = document.getElementById("loc-title");
const LOC_DESC = document.getElementById("loc-desc");
const LOC_RATINGS = document.getElementById("loc-ratings");
const LOC_REVIEWS = document.getElementById("loc-reviews");
const LOC_ADDREVIEW = document.getElementById("loc-review-add");
const LOC_ADDREVIEW_AFTER = document.getElementById("loc-review-after");

const RATING_KEYS = {
    "steps": {
        "name": "Stairs/Steps",
        "positive": "This location offers step-free access.",
        "neutral": "This location might offer step-free access.",
        "negative": "This location does not offer step-free access."
    },
    "floor": {
        "name": "Floor Quality",
        "positive": "This location has a smooth and safe floor.",
        "neutral": "This location has a decent quality floor.",
        "negative": "This location has a rough floor and may pose a trip hazard."
    },
    "elevator": {
        "name": "Elevators",
        "positive": "This location offers elevators.",
        "neutral": "This location may offer elevators if needed.",
        "negative": "This location needs elevators but does not offer them."
    },
    "ramp": {
        "name": "Ramps",
        "positive": "This location has ramps for access.",
        "neutral": "This location may have ramps if needed.",
        "negative": "This location does not have ramps."
    }
}
const RATING_NEGATIVE_THRESHOLD = 1.25;
const RATING_POSITIVE_THRESHOLD = 2.75;

async function generate_star(point) {
    let res = document.createElement("span");
    res.classList.add("icon");

    if (point > .8) {
        res.classList.add("star-full");
    } else if (point < .2) {
        res.classList.add("star-empty");
    } else {
        res.classList.add("star-half");
    }

    return res;
}

async function generate_rating(label, stars) {
    let parent = document.createElement("div");

    let main = document.createElement("div");
    main.className = "rating";

    let lbl = document.createElement("p");
    lbl.innerText = RATING_KEYS[label].name;

    let star_grid = document.createElement("div");
    star_grid.className = "stars";

    star_grid.append(await generate_star(1));
    let stars_before = stars;
    for (let i=0; i<4; i++) {
        let point = Math.min(stars, 1);
        stars--;
        star_grid.append(await generate_star(point));
    }

    main.append(lbl);
    main.append(star_grid);

    let after = document.createElement("div");
    after.className = "note";

    if (stars_before < RATING_NEGATIVE_THRESHOLD) {
        after.classList.add("negative");
        after.innerText = RATING_KEYS[label].negative;
    } else if (stars_before > RATING_POSITIVE_THRESHOLD) {
        after.classList.add("positive");
        after.innerText = RATING_KEYS[label].positive;
    } else {
        after.classList.add("neutral");
        after.innerText = RATING_KEYS[label].neutral;
    }

    parent.append(main);
    parent.append(after);

    return parent;
}

async function generate_review(from) {
    let sender = from.sender;
    let ratings = from.ratings;

    let parent = document.createElement("div");
    parent.className = "review";

    let pfp = document.createElement("img");
    pfp.src = "/src/icon/placeholder.png"; // TODO: profile pic (probably kats)

    let inner = document.createElement("div");

    let uname = document.createElement("p");
    uname.className = "sender";
    uname.innerText = sender.name;

    let content = document.createElement("p");
    content.className = "message";
    content.innerText = from.message;

    inner.append(uname);
    inner.append(content);
    
    parent.append(pfp);
    parent.append(inner);

    return parent;
}

async function load(lon, lat, uid) {
    let loc = await get_location(lon, lat, uid);
    if (loc) {
        LOC_TITLE.innerText = loc.name;
        LOC_DESC.innerText = loc.desc;
        
        for (const [i,v] of Object.entries(loc.ratings)) {
            if (i === "_overall") {
                continue;
            }
            LOC_RATINGS.append(await generate_rating(i, v));
        }

        // let's load all the reviews at once!
        for (let i=0; i<loc.reviews.length; i++) {
            LOC_REVIEWS.append(await generate_review(loc.reviews[i]));
        }
    } else {
        LOC_TITLE.innerText = "Not Found";
        LOC_DESC.innerText = "The location you're trying to find doesn't exist!";
    }
}

// commence

let loc_search = new URLSearchParams(window.location.search);
load(parseFloat(loc_search.get("so")), parseFloat(loc_search.get("sl")), loc_search.get("id"));

// and the de-commencification

document.getElementById("loc-return").addEventListener("click", () => {
    switch (loc_search.get("sm")) {
        case "map":
            window.location.href = `/?lat=${loc_search.get("sl")}&lon=${loc_search.get("so")}&zoom=${loc_search.get("sz")}`;
            break;
        case "list":
            window.location.href = "/list";
            break;
        default:
            window.location.href = "/";
            break;
    }
})

// aaand review adding

LOC_ADDREVIEW_AFTER.style.display = LOC_ADDREVIEW.value.length > 0 ? "block" : "none";
LOC_ADDREVIEW.addEventListener("keyup", () => {
    LOC_ADDREVIEW_AFTER.style.display = LOC_ADDREVIEW.value.length > 0 ? "block" : "none";
})
