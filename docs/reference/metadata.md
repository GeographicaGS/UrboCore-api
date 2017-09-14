## Metadata

### GET /metadata
Returns the metadata catalog of the application.

Response
```json

[{
  "id": "id_category",
  "name": "Name category",
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
        "config": {}
      }
    ]
  }]
}]
```
