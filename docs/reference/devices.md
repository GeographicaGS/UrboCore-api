## Devices

### GET /:scope/devices/map
Returns the device widget map (general view).
Params:
- entities (mandatory): comma separated of entities ids.


Response:
```json
[{
    "device_id":"vertical.category.variable:es1",
    "location":{"lat":37.235251,"lng":-5.094984}
}]
```

### GET /:scope/devices/mapentities
Returns the device map.
Params:
- entities (mandatory): comma separated of entities ids.
- geojson (optional): boolean (default = false)
- geojson_collection (optional): boolean (default = false)


Response:
```json
WITHOUT GEOJSON
[{
    "device_id":"vertical.category.variable:es1",
    "entity_id":"vertical.category.variable",
    "location":{"lat":37.235251,"lng":-5.094984},
    "timeinstant":"2016-06-15T17:38:48.063",
    "lastdata":[{"var":"<id_var>","value":""}]
}]

WITH GEOJSON
[{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [
        -5.103975,
        37.233236
      ]
    },
    "properties": {
      "device_id": "vertical.category.variable:8m1",
      "timeinstant": "2016-06-21T07:56:36.618",
      "entity_id": "vertical.category.variable",
      "lastdata": [{"var":"<id_var>","value":""}]
    }
  }]

WITH GEOJSON COLLECTION
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -5.103975,
          37.233236
        ]
      },
      "properties": {
        "device_id": "vertical.category.variable:8m1",
        "timeinstant": "2016-06-21T07:56:36.618",
        "entity_id": "vertical.category.variable",
        "lastdata": [
          {
            "var": "<id_var>",
            "value":""
          }
        ]
      }
    }
  ]
}
```

### POST /:scope/devices/map/counters

Request: same as POST /:scope/devices/map.

It uses POST because of complexity of the params.

Filters param is optional, if it's omitted data is returned without filtering.

Request:
```json
{
 "entities": ["vertical.category.variable_0","vertical.category.variable_1","vertical.category.variable_2"],
 "filters": {
   "vertical.category.variable_0": {
     "ev_type" : ["type1","type2"],
     "ev_state" : ["status","status2"]
   },
   "vertical.category.variable_1": {
     "wt_soilhumidity" : ["status","status2"]
   },
   "bbox": [lx,ly,ux,uy]
 }
}
```

Response:
```json
{
  "vertical.category.variable": {
    "total": "<total_elements>",
    "total_filter": "<total_elements_withfilter>",
  }
}
```

## GET /:scope/devices/:id_entity/:id_device/lastdata
It returns the lastdata of a device

Params:
- id_entity (mandatory)
- id_device (mandatory)

Sample request:
```json
GET /scope/devices/vertical.category.variable/vertical.category.variable:es1/devinfo
```

Sample response:
```json
{
  "id": "vertical.category.variable:es1",
  "location": {
    "lat": 37.235251,
    "lng": -5.094984
  },
  "timeinstant": "2016-07-13T19:31:46.696Z",
  "entity_id": "catergory",
  "lastdata": [
    {
      "var_value": "O",
      "var_id": "variable"
    },
    {
      "var_value": 4,
      "var_id": "variable"
    }
  ]
}
```

## POST /:scope/devices/:id_entity/:id_device/raw

Raw measurements of a device for a given time frame.

It returns a time serie of a variable (or a set of variables).

- vars (mandatory): array of all variables ids.
- start (mandatory): date start. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- bbox (optional) : [lx,ly,ux,uy]


Payload:
```json
{
  "vars": ["varible_id_1","varible_id_2","varible_id_3"],
  "time": {
    "start": "YYYY-MM-DDTHH:MM:SSZ",
    "finish": "YYYY-MM-DDTHH:MM:SSZ"
  },
  "filters": {
    "bbox": [-5.11170,37.24000,-5.10818,37.24303]
  }
}
```
