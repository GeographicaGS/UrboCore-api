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

### GET /:scope/entities/map/counters

It returns the number of elements by entities. If bbox param is specified the 'filter' value is the number of elements inside the viewport.

Params:
- entities (mandatory): comma separated array of id entities.
- bbox (optional): bbox to filter data.

**Sample request**
```
GET /scope/entities/map/counters?entities=vertical.category.variable&bbox=-180,-90,-150,30
```

Response:
```json
[
  {
    "id": "vertical.category.variable",
    "filter": 0,
    "all": 8515
  }
]
```
