## Indicators

### GET /:scope/:category/indicators/periods

Returns an indicator data for a date (month).
"id" is the indicator number. Format is integer (From 0 to 25).

**Sample request**
```
GET /scope/vertical/indicators/periods
```
Response:
```json
{
  "value": [
    "201608",
    "201609"
  ]
}
```

### POST /:scope/:category/indicators

Returns the indicators list for a date (month).

Params:

* `time.start`: Mandatory. Its important parts are the year and the month.
* `language`: Optional. Default: `es`. Availables: `es` and `en`.
* `format`: Optional. If its value is `csv` it will return a CSV file.

**Sample request**
```
POST /scope/vertical/indicators
```
Request:
```json
{
  "time": {
    "start": "2016-09-12T22:10:56Z"
  },
  "language": "es",
  "format": "csv"
}
```
Response:
```json
[
  {
    "id_entity": "IP0",
    "name": "Indicador General",
    "value": 99.56,
    "penalty_bonus": 0.002372,
    "periodicity": "mensual"
  },
  {
   "id_entity": "IP1",
   "name": "Indicador Subgeneral",
   "value": 100,
   "penalty_bonus": 0.0003381,
   "periodicity": "mensual"
  }
]
```

### POST /:scope/:category/indicators/:id

Returns an indicator data for a date (month).
`id` is the indicator number. Format is integer (From 0 to 25).

Params:

* `time.start`: Mandatory. Its important parts are the year and the month.
* `langauge`: Optional. Default: `es`. Availables: `es` and `en`.

**Sample request**
```
POST /scope/vertical/indicators/0
```
Request:
```json
{
  "time": {
    "start": "2016-09-12T22:10:56Z"
  },
  "language": "es"
}
```
Response:
```json
{
  "id_entity": "IP0",
  "name": "Indicador General",
  "value": 99.56,
  "penalty_bonus": 0.002372,
  "periodicity": "mensual"
}
```

### POST /:scope/:category/indicators/last

Returns the last general (`id = 0`) indicator data for a date.

Params:

* `time.start`: Mandatory. Its important parts are the year and the month.
* `langauge`: Optional. Default: `es`. Availables: `es` and `en`.

**Sample request**
```
POST /scope/vertical/indicators/last
```
Request:
```json
{
  "time": {
    "start": "2016-11-12T22:10:56Z"
  },
  "language": "es"
}
```
Response:
```json
{
  "id_entity": "IP0",
  "name": "Indicador General",
  "value": 99.56,
  "penalty_bonus": 0.002372,
  "periodicity": "mensual",
  "period": "201609"
}
```
