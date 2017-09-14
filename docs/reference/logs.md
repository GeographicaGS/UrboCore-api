## Logs

### POST /logs/pageviews
This service stores information (url, user_ip, time) each time a user loads a page.

Payload:
```json
{
  "url" : "/es/scope/vertical/dashboard/current",
}
```

Response
```
HTTP status code 201 Created
```
```json
{
  "url" : "/es/scope/vertical/dashboard/current",
}
```

**Sample request**
```
POST /logs/pageviews
```

### GET /logs/pageviews
This service returns total views of each page visited for all users.

Params:
- start (mandatory): date start. Format is 'YYYY-MM-DDTHH:MM:SSZ'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DDTHH:MM:SSZ'. Date time is UTC.

Response
```json
[{
"url" : "/es/scope/vertical/dashboard/current",
"pageviews": 125
},
{
"url" : "/es/scope/vertical/dashboard/filling",
"pageviews": 102
}]
```
**Sample request**
```
GET /logs/pageviews?start=2016-09-26T00:00:00Z&finish=2016-10-10T23:59:59Z
```


### GET /logs/pageviews/user/:id_user
This service returns total views of each page visited for a user.

Params:
- start (mandatory): date start. Format is 'YYYY-MM-DDTHH:MM:SSZ'. Date time is UTC.
- finish (mandatory): date finish. Format is 'YYYY-MM-DDTHH:MM:SSZ'. Date time is UTC.

Response
```json
[{
"url" : "/es/scope/vertical/dashboard/current",
"pageviews": 54
},
{
"url" : "/es/scope/vertical/dashboard/filling",
"pageviews": 54
}]
```
**Sample request**
```
GET /logs/pageviews/user/1?start=2016-09-26T00:00:00Z&finish=2016-10-10T23:59:59Z
```

### GET /logs/user/:id_user/lastlogin
This service returns the lastlogin timeinstant of a given user

Response
```json
{
  "lastlogin": "2016-12-03T12:09:26.786Z"
}
```
**Sample request**
```
GET /logs/user/1/lastlogin
```
