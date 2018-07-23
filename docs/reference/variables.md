## Variables

### GET /:scope/variables/:id

:id is the variable id.

It returns an aggregate value of a variable

Params:

- agg: (mandatory): aggregation function. It must be max, min, avg or sum. It can be an array.
- start (mandatory): date start. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- bbox (optional) : [lx,ly,ux,uy]

Response 1:
```
{
  value: 1
}
```
Response 2:
```
{
  "value": {
    "avg": 24.599189759944835,
    "sum": 2853875,
  }
}
```


### POST /:scope/variables/:id/now

:id is the variable id.

It returns an aggregate value of a variable for the current situation.

Payload 1:
```
{
  "agg": "SUM",
  "filters": {
    "bbox": [lx,ly,ux,uy],
    "condition": {"OR": {"column1__in": [], {"AND": {"column2__gte": 10, "column2__lte": 30}}}}
  }
}
```
Response 1:
```
{
  "value": 51
}
```

Payload 2:
```
{
  "agg": ["avg", "sum"],
  "filters": {
    "bbox": [lx,ly,ux,uy],
    "condition": {"OR": {"column1__in": [], {"AND": {"column2__gte": 10, "column2__lte": 30}}}}
  }
}
```
Response 2:
```
{
  "value": {
    "avg": 24.599189759944835,
    "sum": 2853875,
  }
}
```

### POST /:scope/variables/:id/historic

:id is the variable id.

It returns an aggregate value of a variable.

Payload 1:
```
{
  "agg": SUM,
  "time": {
    "start": "YYYY-MM-DDTHH:MM:SSZ",
    "finish": "YYYY-MM-DDTHH:MM:SSZ"
  },
  "filters": {
    "bbox": [lx,ly,ux,uy],
    "condition": {"OR": {"column1__in": [], {"AND": {"column2__gte": 10, "column2__lte": 30}}}}
  }
}
```
Response 1:
```json
{
  "value": 19
}
```

Payload 2:
```
{
  "agg": ["avg", "sum"],
  "time": {
    "start": "YYYY-MM-DDTHH:MM:SSZ",
    "finish": "YYYY-MM-DDTHH:MM:SSZ"
  },
  "filters": {
    "bbox": [lx,ly,ux,uy],
    "condition": {"OR": {"column1__in": [], {"AND": {"column2__gte": 10, "column2__lte": 30}}}}
  }
}
```
Response 2:
```
{
  "value": {
    "avg": 24.599189759944835,
    "sum": 2853875,
  }
}
```

### POST /:scope/variables/timeserie

It returns a time serie of a variable (or a set of variables).

- agg: (mandatory): array of all aggregation functions (one function per variable defined in vars). It must be max, min, avg or sum.
- vars (mandatory): array of all variables ids.
- start (mandatory): date start. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- step (optional): time resolution. Values: 1h, 2h, 4h, 1d (default: 1d)
- bbox (optional) : [lx,ly,ux,uy]
- findTimes  : true | false. Default to false. If set to true and max or min aggregator are used, it returns the list of "TimeInstant" where the max or min appears.

Payload:
```json
{
  "agg": ["SUM","AVG","AVG","MIN"],
  "vars": ["varible_id_1","varible_id_2","varible_id_3","varible_id_3"],
  "time": {
    "start": "YYYY-MM-DDTHH:MM:SSZ",
    "finish": "YYYY-MM-DDTHH:MM:SSZ",
    "step": "1d"
  },
  "findTimes" : true,
  "filters": {
    "bbox": [-5.11170,37.24000,-5.10818,37.24303]
  }
}
```

Response:
```json
[{
    "time": "YYYY-MM-DD HH:MM",
    "data": {
      "<varible_id_1>": 218,
      "<varible_id_2>": 104,
      "<varible_id_3>": [
          {
            "agg": "AVG",
            "value": 34.2
          },
          {
            "agg": "MIN",
            "value": 0.56,
            "times" : ["YYYY-MM-DDTHH:MM:SSZ","YYYY-MM-DDTHH:MM:SSZ","YYYY-MM-DDTHH:MM:SSZ"]
          }
        ]
    }
}]
```
**Sample request**
```
POST /osuna/variables/timeserie
```

### POST /:scope/variables/:id_variable/devices_group_timeserie

It returns a time serie of a variable grouped by devices.
If requested (at groupagg), it also provides the aggregation of all devices.

Payload:
```json
{
  "agg": "AVG",
  "time": {
    "start": "YYYY-MM-DDTHH:MM:SSZ",
    "finish": "YYYY-MM-DDTHH:MM:SSZ",
    "step": "1d"
  },
  "filters": {
    "bbox": [-5.11170,37.24000,-5.10818,37.24303]
  }
}
```

- agg: aggregation function.
- start (mandatory): date start. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- groupagg(optional): true|false. Default to false. Show a line for each time which represents the aggregation of all devices.
- step (optional): time resolution. Values: 1h, 2h, 4h, 1d (default: 1d)
- bbox (optional) : [lx,ly,ux,uy]

Response:
```json
[{
    "time": "YYYY-MM-DD HH:MM",
    "data": {
      "<device_id_1>": "value",
      "<device_id_2>": "value",
      "avg" : "value"
    }
}]
```
### GET /:scope/variables/timeserie

It returns a time serie of a variable (or a set of variables).

Params:

- agg: (mandatory): separated comma array of all aggregation functions (one function per variable defined in vars). It must be max, min, avg or sum.
- vars (mandatory): separated comma array of all variables ids.
- start (mandatory): date start. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- step (optional): time resolution. Values: 1h, 2h, 4h, 1d (default: 1d)
- bbox (optional) : [lx,ly,ux,uy]

Response:
```json
[{
    "time": "YYYY-MM-DD HH:MM",
    "data": {
      "<varible_id_1>": 218,
      "<varible_id_2>": 104,
      "<varible_id_3>": [
          {
            "agg": "AVG",
            "value": 34.2
          },
          {
            "agg": "MIN",
            "value": 0.56
          }
        ]
    }
}]
```
**Sample request**
```
GET /osuna/variables/timeserie?start=2016-09-05T00:00&finish=2016-09-12T00:00&step=4h&vars=wt_soilhumidity,wt_soilhumidity,wm_waterconsumption,mt_pluvio,wm_battery,wt_battery&agg=AVG,MIN,AVG,SUM,SUM,AVG
```

### GET /:scope/variables/:id_variable/devices_group_timeserie

It returns a time serie of a variable grouped by devices.
If requested (at groupagg), it also provides the aggregation of all devices.

Params:

- id_variable (mandatory): variable id.
- agg: aggregation function.
- start (mandatory): date start. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- groupagg(optional): true|false. Default to false. Show a line for each time which represents the aggregation of all devices.
- step (optional): time resolution. Values: 1h, 2h, 4h, 1d (default: 1d)
- bbox (optional) : [lx,ly,ux,uy]

Response:
```json
[{
    "time": "YYYY-MM-DD HH:MM",
    "data": {
      "<device_id_1>": "value",
      "<device_id_2>": "value",
      "avg" : "value"
    }
}]
```

### POST /:scope/variables/:id/histogram/continuous/now
@TODO

Payload:
```
{
  totals: true,
  ranges: [
    { '>=':0, '<':80},
    { '>=':80, '<=': 90 },
    { '>': 90 }
  ],
  filters: {..}
}
```

Response (totals: true):
```
[{
  total: 10,
  value: 5
 },
 {
   total: 20,
   value: 15
 },
 {
   total: 30,
   value: 20
 }]
```

Response (totals: false):
```
[{
  value: 5
 },
 {
   value: 15
 },
 {
   value: 20
 }]
```
### POST /:scope/variables/:id/histogram/discrete/now
Returns the number of elements existing in each desired category.

- `ranges` (mandatory): Can be "all" or an array of strings with the categories values.
- `totals` (optional, true or false): Calculate the total number of existing elements, without any filtering by category.
- `subVariable` (optional): Another variable id if we desire to add a new subcategory.
- `subRanges` (mandatory if subVariable is specified): An array of strings with the subcateogries values.

If "all" is specified in `ranges` sub-filtering won't be applied. `subRanges` does not admit the "all" shortcut.

Payload: Auto-guessing categories
```
{
  ranges: 'all'
  filters: {..}
}
```

Payload:Fixed categories
```
{
  ranges: ['cat1','cat2','cat3'],
  filters: {..}
}
```

Response:
```
[{
    category: 'cat1',
    value: 10,
    total: 15
},
{
    category: 'cat2',
    value: 20,
    total: 25
},
{
    category: 'cat3',
    value: 30,
    total: 35
}]
```

Payload: Fixed categories and subcategories
```json
{
	"ranges": ["ok","offline"],
	"subVariable": "lighting.streetlight.powerstate",
	"subRanges": ["On", "Off"]
}
```

Response:
```json
[
    {
        "category": "ok",
        "subCategory": "On",
        "value": "1",
        "total": 0
    },
    {
        "category": "ok",
        "subCategory": "Off",
        "value": "1",
        "total": 0
    },
    {
        "category": "offline",
        "subCategory": "On",
        "value": "2",
        "total": 0
    },
    {
        "category": "offline",
        "subCategory": "Off",
        "value": "1",
        "total": 0
    }
]
```

### POST /:scope/variables/:id/histogram/timeserie/continuous

Payload:
```
{
  time: {
    start: 'YYYY-MM-DDTHH:MM:SSZ',
    finish: 'YYYY-MM-DDTHH:MM:SSZ',
    step: '<in seconds>'
  },
  totals: false,
  ranges: [
    { '>=':0, '<':80},
    { '>=':80, '<=': 90 },
    { '>': 90 }
  ],
  filters: {..},
  time_column: 'day'  // Optional, default: 'TimeInstant'
}
```
Response:
```
[
  {
    "time": "2016-09-07T15:00:00.000Z",
    "data": [
      {
        "value": 0,
        "total": 0
      },
      {
        "value": 0,
        "total": 0
      },
      {
        "value": "8",
        "total": "8"
      }
    ]
  }
]
```

### GET /:scope/variables/:id/outers

:id is the variable id.

It returns the outers of an aggregation. It's used to build dynamic choropleth legends.

Params:

- agg (mandatory): aggregation function. It must be max, min, avg or sum.
- start (mandatory): date start. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.

Response:
```
{
  min: 10
  max: 100
}
```

### POST /:scope/variables/dailyagg

It returns the dailyagg

- agg: (mandatory): array of all aggregation functions (one function per variable defined in vars). It must be max, min, avg or sum.
- vars (mandatory): array of all variables ids.
- start (mandatory): date start. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DD HH:MM'. Date time is UTC.
- step (optional): time resolution. Values: 1h, 2h, 4h, 1d (default: 1d)
- bbox (optional) : [lx,ly,ux,uy]
- findTimes  : true | false. Default to false. If set to true and max or min aggregator are used, it returns the list of "TimeInstant" where the max or min appears.

Payload:
```json
{
  "agg": ["SUM","MAX","AVG","MIN"],
  "vars": ["varible_id_1","varible_id_2","varible_id_3","varible_id_3"],
  "time": {
    "start": "YYYY-MM-DDTHH:MM:SSZ",
    "finish": "YYYY-MM-DDTHH:MM:SSZ",
    "step": "1d"
  },
  "findTimes" : true,
  "filters": {
    "bbox": [-5.11170,37.24000,-5.10818,37.24303]
  }
}
```

Response:
```json
[{
    "time": "<seconds from 00:00 UTC>",
    "data": {
      "<varible_id_1>": 33,
      "<varible_id_2>": {
        "value" : 35,
        "times" : ["YYYY-MM-DD","YYYY-MM-DD","YYYY-MM-DD"]
      },
      "<varible_id_3>": [
          {
            "agg": "AVG",
            "value": 34.2
          },
          {
            "agg": "MIN",
            "value": 0.56,
            "times" : ["YYYY-MM-DDTHH:MM:SSZ","YYYY-MM-DDTHH:MM:SSZ","YYYY-MM-DDTHH:MM:SSZ"]
          }
        ]
    }
}]
```

### POST /:scope/variables/ranking/now

It returns the current values of the requested variables ranked by a variable.

- vars: (mandatory): array of all variables ids.
- var_order (mandatory): variable id for ordering.
- order (optional): 'asc' or 'desc', default 'desc'.
- limit (optional): an intenger for limiting the query result, default without limit.
- filters.bbox (optional, **DEPRECATED, use the_geom filter instead**): [lx,ly,ux,uy]
- filters.the_geom (optional): Geometry filter. Find more information on how to use this filter [here](../geom_filter.md).

Payload:
```json
{
  "vars": [
    "parking.offstreet.name",
    "parking.offstreet.availablespotnumber",
    "parking.offstreet.category"
  ],
  "var_order": "parking.offstreet.availablespotnumber",
  "order": "desc",
  "limit": 5,
  "filters": {
    "the_geom": {
      "&&": [lx, ly, ux, uy]
    }
  }
}
```

Response:
```json
[
  {
    "availablespotnumber": 266,
    "category": [
      "public"
    ],
    "name": "Polígono Industrial Alcobendas - Parking 03"
  },
  {
    "availablespotnumber": 218,
    "category": [
      "forCustomers"
    ],
    "name": "Las Tablas - Parking 03"
  },
  {
    "availablespotnumber": 166,
    "category": [
      "forCustomers"
    ],
    "name": "Las Tablas - Parking 01"
  },
  {
    "availablespotnumber": 122,
    "category": [
      "forCustomers"
    ],
    "name": "Las Tablas - Parking 02"
  },
  {
    "availablespotnumber": 116,
    "category": [
      "public"
    ],
    "name": "Parque Empresarial Moraleja - Parking 02"
  }
]
```

### POST /:scope/variables/ranking/historic

It returns the historic values of the requested variables ranked by a variable.

- time.start: (mandatory): start of date range.
- time.finish: (mandatory): end of date range.
- vars: (mandatory): array of all variables ids.
- agg: (mandatory): array of aggregations per variable. Available aggregations: ["SUM", "AVG", "MIN", "MAX", "NOAGG"]
- var_order (mandatory): variable id for ordering.
- order (optional): 'asc' or 'desc', default 'desc'.
- limit (optional): an intenger for limiting the query result, default without limit.
- bbox (optional): [lx,ly,ux,uy]

Payload:
```json
{
  "agg": [string],
  "time": {
    "start": "YYYY-MM-DDTHH:MM:SSZ",
    "finish": "YYYY-MM-DDTHH:MM:SSZ"
  },
  "vars": [string],
  "var_order": "string",
  "order": "ASC/DESC",
  "limit": integer,
  "filters": {
    "bbox": [lx, ly, ux, uy]
  }
}
```

Response:
```json
[
  {
    "id_entity": "string",
    "variable1": value,
    "variable2": value,
    ...
  },
  {
    "id_entity": "string",
    "variable1": value,
    "variable2": value,
    ...
  },
  ...
]
```

Example payload:
```json
{
  "agg": ["sum", "avg"],
  "vars": [

    "indoor_air.quality.tvoc",
    "indoor_air.quality.co2"
  ],
  "var_order": "indoor_air.quality.tvoc",
  "order": "desc",
  "limit": 5,
  "filters": {
  },
  "time":{
    "start": "2000-01-01 01:00",
    "finish": "2020-01-01 01:00"
  }
}
```

Example response:
```json
[
    {
        "id_entity": "device:TEST_001",
        "co2": 230,
        "tvoc": 3.2
    },
    {
        "id_entity": "device:TEST_002",
        "co2": 123,
        "tvoc": 3
    }
]
```

### POST /:scope/variables/:id/weekserie

Payload:
```json
{
  "agg": "AVG",
  "time": {
    "start": "YYYY-MM-DDTHH:MM:SSZ",
    "finish": "YYYY-MM-DDTHH:MM:SSZ"
  },
  "filters": {
    "bbox": [lx, ly, ux, uy]
  }
}
```
Response:
```json
[
  {
    "day": "Monday",
    "data": [<data at 00:00UTC>, ..., <data at 23:00UTC>]
  },
  {
    "day": "Tuesday",
    "data": [<data at 00:00UTC>, ..., <data at 23:00UTC>]
  },
  {
    "day": "Wednesday",
    "data": [<data at 00:00UTC>, ..., <data at 23:00UTC>]
  }
]
```


### POST /:scope/variables/:id/histogram/discrete/grouped

It counts the rows of a table grouped by a column.

Payload 1:
```json
{
  "time": {
    "start": "2000-01-01T00:00:00Z",
    "finish": "2999-01-01T00:00:00Z"
  },
  "filters": {
    "bbox": [321.328125, 81.0932138526084, -284.765625000000069, -54.1624339680678],
    "order": "asc",  // Optional, default DESC
    "limit": 10,  // Optional, default without limit
    "perc": false,  // Optional, default false
    "condition": {
      "AND": {
        "user_country__in": ["Croatia"],
        "week_day__in": ["5", "6", "7"]
      }
    }
  }
}
```

Response 1:
```json
[
  {
    "category": "Split-Dalmatia",
    "total": 4
  },
  {
    "category": "Zagreb",
    "total": 2
  }
]
```

Payload 2:
```json
{
  "time": {
    "start": "2000-01-01T00:00:00Z",
    "finish": "2999-01-01T00:00:00Z"
  },
  "filters": {
    "bbox": [321.328125, 81.0932138526084, -284.765625000000069, -54.1624339680678],
    "order": "desc",  // Optional, default DESC
    "limit": 2,  // Optional, default without limit
    "perc": true,  // Optional, default false
    "condition": {
      "AND": {
        "user_country__in": ["Spain"],
        "week_day__in": ["5", "6", "7"]
      }
    }
  }
}
```

Response 2:
```json
[
  {
    "category": "Madrid",
    "total": 80.3197908286404
  },
  {
    "category": "Granada",
    "total": 19.680209171359614
  }
]
```


### POST /:scope/variables/:id/unique

It returns the unique values of a variable. Also, you can filter it by another column with the `filters` key in the payload.

Payload:
```json
{
  "time": {
    "start": "2000-01-01T00:00:00Z",
    "finish": "2999-01-01T00:00:00Z"
  },
  "filters": {
    "bbox": [321.328125, 81.0932138526084, -284.765625000000069, -54.1624339680678],
    "condition": {
      "AND": {
        "user_country__in": ["Croatia"],
        "week_day__in": ["5", "6", "7"]
      }
    }
  }
}
```

Response:
```json
[
  {
    "value": "Split-Dalmatia"
  },
  {
    "value": "Zagreb"
  }
]
```


### POST /:scope/variables/:id/bounding_box

It returns the returns bounding box of a variable. Also, you can filter it by another column with the `filters` key in the payload.

Payload:
```json
{
  "time": {
    "start": "2000-01-01T00:00:00Z",
    "finish": "2999-01-01T00:00:00Z"
  },
  "filters": {
    "condition": {
      "AND": {
        "user_country__in": ["Spain"],
        "week_day__in": ["5", "6", "7"]
      }
    }
  }
}
```

Response:
```json
{
  "value": [
    -16.26,
    28.463,
    12.402,
    47.86
  ]
}
```

Response (when there is no data for calculating the bounding box):
```json
{
  "value": null
}
```
