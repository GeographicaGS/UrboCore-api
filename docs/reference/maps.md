## Maps

### GET /:scope/maps/:entity

It returns all entities of a type as GeoJSON `FeatureCollection`.

Query string's params:
  - lastdataHoursInterval (optional): A time interval for looking into the variables tables and getting the last values in historic data. Default: 1.

Path's params:
  - scope (mandatory)
  - entity (mandatory)

Example request URL:
```text
/aljarafe/maps/aq_cons.sector
```

Example response:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -6.05800766117674,
          37.353173399743
        ]
      },
      "properties": {
        "id_entity": "sector_id:16_industrial",
        "TimeInstant": "2018-01-23T23:55:00.000Z",
        "flow": 255.673644341031
      }
    }
  ]
}
```

### POST /:scope/maps/:entity/now

**Note**: Like `/:scope/maps/:entity/now`, but with a POST body.
It returns all entities of a type as GeoJSON `FeatureCollection`.

Path's params:
  - scope (mandatory)
  - entity (mandatory)

Body's params:
  - filters.condition (mandatory, can be empty): Urbo's filter conditions
  - filters.the_geom (optional): Geometry filter. Find more information on how to use this filter [here](../geom_filter.md).
  - filters.bbox (optional, **DEPRECATED, use the_geom filter instead**)

Example request URL:
```text
/aljarafe/maps/aq_cons.sector/now
```

Example body:
```json
{
  "filters": {
    "the_geom": {
      "&&": [321.328125, 81.0932138526084, -284.765625000000069, -54.1624339680678]
    },
    "condition": {
      "AND": {
        "property_0__in": ["value_a"],
        "property_1__in": ["value_b", "value_c", "value_c"]
      }
    }
}
```

Example response:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -6.05800766117674,
          37.353173399743
        ]
      },
      "properties": {
        "id_entity": "sector_id:16_industrial",
        "TimeInstant": "2018-01-23T23:55:00.000Z",
        "flow": 255.673644341031
      }
    }
  ]
}
```

### POST /:scope/maps/:entity/historic

It returns all entities of a type as GeoJSON `FeatureCollection` with an aggregated value of a variable during a time range.

Path's params:
  - scope (mandatory)
  - entity (mandatory)

Body's params:
  - agg (mandatory): The aggregate function to apply
  - var: (mandatory): The variable to aggregate
  - time.start (mandatory)
  - time.finish (mandatory)
  - filters.condition (mandatory, can be empty): Urbo's filter conditions
  - filters.bbox (optional)

Example request URL:
```text
/aljarafe/maps/aq_cons.sector/historic
```

Example body:
```json
{
  "agg": "SUM",
  "var": "aq_cons.sector.consumption",
  "time": {
  	"start": "2018-01-16T00:00:00Z",
  	"finish": "2018-01-20T23:59:59Z"
  },
  "filters":
    "bbox": [321.328125, 81.0932138526084, -284.765625000000069, -54.1624339680678],
    "condition": {
      "AND": {
        "property_0__in": ["value_a"],
        "property_1__in": ["value_b", "value_c", "value_c"]
      }
    }
}
```

Example response:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -6.05800766117674,
          37.353173399743
        ]
      },
      "properties": {
        "id_entity": "sector_id:16_industrial",
        "TimeInstant": "2018-01-23T23:55:00.000Z",
        "flow": 255.673644341031,
        "aq_cons.sector.consumption": 42.7002512456547
      }
    }
  ]
}
```
