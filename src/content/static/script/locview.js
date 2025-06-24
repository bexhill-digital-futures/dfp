const LOC_TITLE = document.getElementById("loc-title");
const LOC_DESC = document.getElementById("loc-desc");
const LOC_RATINGS = document.getElementById("loc-ratings");
const LOC_REVIEWS = document.getElementById("loc-reviews");
const LOC_ADDREVIEW = document.getElementById("loc-review-add");
const LOC_ADDREVIEW_AFTER = document.getElementById("loc-review-after");
const LOC_ADDREVIEW_RATINGS = document.getElementById("loc-review-ratings");

const RATING_KEYS = {
    "steps": {
        "name": "Stairs/Steps",
        "positive": "This location offers step-free access.",
        "neutral": "This location might offer step-free access.",
        "negative": "This location does not offer step-free access.",
        "positive_img": "/src/icon/ramp.svg",
        "neutral_img": "/src/icon/ferris-wheel.png",
        "negative_img": "/src/icon/stair.svg"
    },
    "floor": {
        "name": "Floor Quality",
        "positive": "This location has a smooth and safe floor.",
        "neutral": "This location has a decent quality floor.",
        "negative": "This location has a rough floor and may pose a trip hazard.",
        "positive_img": "/src/icon/ramp.svg",
        "neutral_img": "/src/icon/ferris-wheel.png",
        "negative_img": "/src/icon/stair.svg"
    },
    "elevator": {
        "name": "Elevators",
        "positive": "This location offers elevators.",
        "neutral": "This location may offer elevators if needed.",
        "negative": "This location needs elevators but does not offer them.",
        "positive_img": "/src/icon/ramp.svg",
        "neutral_img": "/src/icon/ferris-wheel.png",
        "negative_img": "/src/icon/stair.svg"
    },
    "ramp": {
        "name": "Ramps",
        "positive": "This location has ramps for access.",
        "neutral": "This location may have ramps if needed.",
        "negative": "This location does not have ramps.",
        "positive_img": "/src/icon/ramp.svg",
        "neutral_img": "/src/icon/ferris-wheel.png",
        "negative_img": "/src/icon/stair.svg"
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

    let note_icon = document.createElement("img");
    let note_inner = document.createElement("span");

    if (stars_before < RATING_NEGATIVE_THRESHOLD) {
        after.classList.add("negative");
        note_inner.innerText = RATING_KEYS[label].negative;
        note_icon.src = RATING_KEYS[label].negative_img;
    } else if (stars_before > RATING_POSITIVE_THRESHOLD) {
        after.classList.add("positive");
        note_inner.innerText = RATING_KEYS[label].positive;
        note_icon.src = RATING_KEYS[label].positive_img;
    } else {
        after.classList.add("neutral");
        note_inner.innerText = RATING_KEYS[label].neutral;
        note_icon.src = RATING_KEYS[label].neutral_img;
    }

    after.append(note_icon);
    after.append(note_inner);

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
    pfp.src = `/pfp?id=${sender.pfp}`;

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

        // let's load all the reviews at once! wcgr
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

// WAAAAAAAAAAAAAAAAAAAAAAAAAAA

async function set_icon(elem, id) {
    let icon = document.createElement("span");
    icon.className = `icon full ${id}`;
    elem.append(icon);
}

async function give_me_a_triple_toggle_please() {
    // well u did say please
    // i'm sure theres absolutely nothing in native html or js that could possibly help us

    let parent = document.createElement("div");
    parent.className = "triple-toggle";

    let btn_negative = document.createElement("button");
    let btn_neutral = document.createElement("button");
    let btn_positive = document.createElement("button");
    btn_negative.className = "negative no-bg";
    btn_neutral.className = "neutral";
    btn_positive.className = "positive no-bg";

    set_icon(btn_negative, "negative");
    set_icon(btn_neutral, "neutral");
    set_icon(btn_positive, "positive");

    let result = {
        state: 1, // neutral by default
        change_listeners: [],
        elem: parent,
        elem_negative: btn_negative,
        elem_neutral: btn_neutral,
        elem_positive: btn_positive
    }

    result.on_changed = (callback) => {
        result.change_listeners.push(callback);
    }

    result.change_listeners.push(async () => {
        btn_negative.className = result.state === 0 ? "negative" : "negative no-bg";
        btn_neutral.className = result.state === 1 ? "neutral" : "neutral no-bg";
        btn_positive.className = result.state === 2 ? "positive" : "positive no-bg";
    })

    btn_negative.addEventListener("click", () => {
        result.state = 0;
        result.change_listeners.forEach((v) => {
            v();
        });
    })
    btn_neutral.addEventListener("click", () => {
        result.state = 1;
        result.change_listeners.forEach((v) => {
            v();
        });
    })
    btn_positive.addEventListener("click", () => {
        result.state = 2;
        result.change_listeners.forEach((v) => {
            v();
        });
    })

    parent.append(btn_negative);
    parent.append(btn_neutral);
    parent.append(btn_positive);

    return result;
}

// load rating inputs for fUGUHQ[0GH[3QGI0Q34H]]

let rating_elems = {};

async function load_rating_inputs(params) {
    for (const [i,v] of Object.entries(RATING_KEYS)) {
        let parent = document.createElement("div");

        let main = document.createElement("div");
        main.className = "rating";

        let label = document.createElement("p");
        label.innerText = v.name;
        main.append(label);

        let toggle = await give_me_a_triple_toggle_please();
        main.append(toggle.elem);

        parent.append(main);

        let after = document.createElement("div");
        after.className = "note neutral";
        after.innerText = v.neutral;
        parent.append(after);

        toggle.on_changed(async () => {
            switch (toggle.state) {
                case 0:
                    after.innerText = v.negative;
                    after.className = "note negative";
                    break;
                case 1:
                    after.innerText = v.neutral;
                    after.className = "note neutral";
                    break;
                case 2:
                    after.innerText = v.positive;
                    after.className = "note positive";
                    break;
                default:
                    after.innerText = "you broke it.";
                    after.className = "note negative";
                    break;
            }
        })

        rating_elems[i] = toggle;
        LOC_ADDREVIEW_RATINGS.append(parent);
    }
}
load_rating_inputs();

// FINALLY,  review adding

document.getElementById("loc-review-post").addEventListener("click", async () => {
    let ratings = {}
    for (const [i,v] of Object.entries(rating_elems)) {
        ratings[i] = v.state;
    }
    let res = await fetch(
        `/review?lat=${loc_search.get("sl")}&lon=${loc_search.get("so")}&uid=${loc_search.get("id")}`,
        {
            method: "POST",
            body: JSON.stringify({
                "ratings": ratings,
                "message": LOC_ADDREVIEW.value
            })
        }
    )
    if (res.status === 200) {
        window.location.href = window.location.href;
    }
    // cba to do error handling
})
