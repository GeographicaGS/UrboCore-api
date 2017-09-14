## Scopes

### GET /scopes
Returns scopes list.

Params:
- multi (optional): true|false. If missing returns all scopes, multi and non multi.

Sample response:
```json
[
  {
    "id": "id_0",
    "name" : "Name_0",
    "multi": false,
    "categories": ["c0"]
  },
  {
    "id": "id_1",
    "name" : "Name_1",
    "multi": true,
    "categories": ["c1"],
    "n_cities": 2
  }
]
```

### GET /scopes/:scope_id

Sample response non multi scope
```json
{
  "id": "id",
  "name": "Name",
  "location": [37.237364, -5.103308],
  "zoom": 15,
  "multi":false,
  "parent_id": "parent",
  "categories": ["vertical"]
}
```
Sample response multi scope
```json
{
  "id": "id",
  "name": "Name",
  "multi":true,
  "childs": [{
    "id": "sub_id_0",
    "name": "Sub_name_0",
    "location": [37.237364, -5.103308],
    "zoom": 15,
    "categories": ["vertical_0"]
  },
  {
    "id": "sub_id_1",
    "name": "Sub_name_0",
    "location": [37.237364, -5.103308],
    "zoom": 15,
    "categories": ["vertical_1"]
  }]
}
```

### GET /scopes/:id_scope/metadata
It returns the scope's metadata

Response
```json
[{
  "id": "id_category",
  "name": "Name category",
  "nodata": false,
  "entities": [{
    "id": "<id_entity>",
    "name" : "Entity name",
    "id_category": "id_category",
    "table": "DB Table",
    "variables" : [
      {
        "id": "<id_variable>",
        "id_entity": "id_entity",
        "name": "<var_name>",
        "units": "<var_units>",
        "var_thresholds": [],
        "var_agg": ["SUM","MAX","MIN","AVG"],
        "reverse": false,
        "column": "Table column",
        "config": {}
      }
    ]
  }]
}]
```
