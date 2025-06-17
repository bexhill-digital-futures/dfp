# The Documentation
## The Server

### Web Pages

| Endpoint | Description |
|---------:|:------------------------------|
| `/` | Homepage and map view. |

### API

#### `GET /map/[float latitude]/[float longitude]`
Return the locations within one chunk, not including reviews.  
`float latitude` - The latitude that lies in the chunk.  
`float longitude` - The longitude.  

Returns a list of `MapLocation` objects as JSON, excluding reviews:  
```json
[
    ...
    {
        "uid": "location identifier",
        "name": "location name",
        "desc": "location description",
        "position": {
            "lat": 0.0,
            "lon": 0.0
        }
    },
    ...
]
```

#### `POST /loc`
Create a new location with the given data.  
Accepts a JSON payload with the following schema:  
```json
{
    "name": "location name",
    "desc": "location description",
    "lat": 0.0,
    "lon": 0.0
}
```

Returns the location ID of the resulting location.

#### `GET /loc/[float latitude]/[float longitude]/[string uid]`
Return the location with the given UID within the chunk that the latitude and longitude lie in.  
`float latitude/longitude` - The coordinates near the location.  
`string uid` - The location identifier given to the location, accessible in the response of `GET /map/latitude/longitude`.  

Returns a `MapLocation` as JSON:  
```json
{
    "uid": "location identifier",
    "name": "location name",
    "desc": "location description",
    "position": {
        "lat": 0.0,
        "lon": 0.0
    },
    "reviews": [
        ...
        {
            "sender": {
                "name": "sender name",
                "pfp": "sender profile image key"
            },
            "ratings": {
                [string]: 0 | 1 | 2
            }
        },
        ...
    ]
}
```

### Misc

| Endpoint | Description |
|---------:|:------------------------------|
| `/src/[path target]` | Return a file from inside `/src/content/static`. If the URL contains hazardous characters (e.g. `..`) it will be rejected. |
