// constants

const IN_NAME = document.getElementById("in-name");
const IN_DESC = document.getElementById("in-desc");
const ERROR_TEXT = document.getElementById("error-text");

// back

async function back() {
    switch (loc_search.get("sm")) {
        case "map":
            window.location.href = `/?lat=${loc_search.get("lat")}&lon=${loc_search.get("lon")}&zoom=${loc_search.get("sz")}`;
            break;
        case "list":
            window.location.href = "/list";
            break;
        default:
            window.location.href = "/";
            break;
    }
}

document.getElementById("loc-return").addEventListener("click", back);
document.getElementById("cancel").addEventListener("click", back);

// the data

let loc_search = new URLSearchParams(window.location.search);

let parse_safe = function(s, def) {
    let res = parseFloat(s);
    if (Number.isNaN(res)) {
        return def;
    }
    return res;
}

let lat = parse_safe(loc_search.get("lat"));
let lon = parse_safe(loc_search.get("lon"));

if (lat == null || lon == null) {
    back();
}

// submit

let allow_submit = true;

document.getElementById("submit").addEventListener("click", async () => {
    if (!allow_submit) {
        return;
    }
    
    if (IN_NAME.value.length < 1) {
        ERROR_TEXT.innerText = "Please enter a name first!";
        return;
    }
    if (IN_DESC.value.length < 1) {
        ERROR_TEXT.innerText = "Please enter a description first!";
        return;
    }
    
    allow_submit = false;
    try {
        let res = await fetch(
            "/loc",
            {
                method: "POST",
                body: JSON.stringify({
                    "name": IN_NAME.value,
                    "desc": IN_DESC.value,
                    "lat": lat,
                    "lon": lon
                })
            }
        )
        if (res.status === 200) {
            window.location.href = `/loc?sm=map&sl=${lat}&so=${lon}&sz=${loc_search.get("sz")}&id=${await res.text()}`;
        } else {
            ERROR_TEXT.innerText = `Catastrophic Failure! (HTTP ${res.status})`;
        }
    } catch (err) {
        ERROR_TEXT.innerText = err.message;
    }
    allow_submit = true;
})
