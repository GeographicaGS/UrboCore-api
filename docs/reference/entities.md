## Entities

### GET /:scope/entities/:id/elements

It returns all the elements for a specific entity.

Response:
```json
[
  {
    "id": "vertical.category.variable:es1",
    "name" : "Name"
  },
  {
    "id": "vertical.category.variable:es2",
    "name" : "Name"
  }
]
```

### GET /:scope/entities/search

It does a search inside all map elements (devices map: last data map).

Params:
- entities (mandatory): entities to search. It's a comma separated. string
- term (mandatory): it contains the search term.
- limit (optional): number of results. Default is 20.

Request sample
```
GET localhost:3001/scope/entities/search?term=searchterm&entities=vertical.category.variable_0,vertical.category.variable_1,vertical.category.variable_2,vertical.category.variable_3&limit=10
```

Response:
```json
[{
  "type": "placement",
  "name": "Título emplazamiento 1",
  "element_id":  "<placement_id>",
  "bbox" : [lx,ly,ux,uy]
},
{
  "type": "device",
  "name": "Título dispositivo 1",
  "element_id":  "<device_id>",
  "bbox" : [lx,ly,ux,uy]
}]
```

### POST /:scope/entities/search/extended

Extends the functionalities of `/entities/search`

Params:
- entities (mandatory): entities to search. It's an object using the entities names as keys and the following attributes as values:
  - select (mandatory): fields to retrieve. Array
  - suffix (optional): suffix to append to the entity associated table_name. String
  - filters (mandatory): the same functionalities used in other endpoints. Object

Request sample
```json
{
    "entities": {
        "fire_detection.fireforestobserved": {
            "select": [
                "id_entity",
                "hasfirealert"
            ],
            "suffix": "_lastdata",
            "filters": {
                "condition": {
                    "OR": {
                        "id_entity__icontains": "Node9",
                        "hasfirealert__eq": 1
                    }
                }
            }
        },
        "fire_detection.weatherobserved": {
            "select": [
                "id_entity",
                "battery"
            ],
            "suffix": "_lastdata",
            "filters": {
                "condition": {
                    "AND": {
                        "id_entity__icontains": "3A"
                    }
                }
            }
        }
    }
}
```

Response:
```json
{
    "fire_detection.fireforestobserved": [
        {
            "id_entity": "fireForestObserved:Node9",
            "hasfirealert": 0
        },
        {
            "id_entity": "fireForestObserved:Simul1",
            "hasfirealert": 1
        },
        {
            "id_entity": "fireForestObserved:Simul2",
            "hasfirealert": 1
        }
    ],
    "fire_detection.weatherobserved": [
        {
            "id_entity": "weatherObserved:Node3A",
            "battery": 78.647
        }
    ]
}
```

### GET /:scope/entities/map/counters

It returns the number of elements by entities. If bbox param is specified the 'filter' value is the number of elements inside the viewport.

Params:
* entities (mandatory): comma separated array of id entities.
* bbox (optional): bbox to filter data.
* start (optional): Start of range filter.
* finish (optional): End of range filter.

**Sample request**
```
GET /scope/entities/map/counters?entities=vertical.category.variable&bbox=-180,-90,-150,30&start=2000-01-01T00:00&finish=2020-01-01T00:00
```

Response:
```json
[
  {
    "id": "vertical.category.variable",
    "filter": 2320,
    "all": 8515
  }
]
```
