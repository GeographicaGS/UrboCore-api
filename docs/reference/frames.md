## Frames

### GET /:scope/frames

Returns all frames for a scope.

Path's params:
	- `scope` (mandatory).
  - `type` (optional).
  - `vertical` (optional).

Example Request URL
```text
/aljarafe/frames?type=cityanalytics
```

Example Response
```json
[
   {
      "id":"1",
      "url":"https://xxxx/xxxx/embed",
      "title":"Traffic intensity, Air Quality in Trento",
      "description":"Traffic intensity and Air Quality  datasets integrated in a single map ",
      "source":"CARTO",
      "datatype":"now",
      "type": "cityanalytics",
      "vertical": NULL
   }
]
```

### GET /:scope/frames/:id

Returns a frame for a vertical, identified by `id`.

Path's params:
	- `scope` (mandatory).
	- `id` (mandatory).

Example Request URL
```text
/aljarafe/frames/4
```

Example Response
```json
{
  "id":"4",
  "url":"https://xxxx/xxxx/embed",
  "title":"Traffic intensity, Air Quality in Trento",
  "description":"Traffic intensity and Air Quality  datasets integrated in a single map ",
  "source":"CARTO",
  "datatype":"now",
  "type": "cityanalytics",
  "vertical": NULL
}
```

### POST /:scope/frames/

Creates a frame for a vertical. Authenticated user must have permissions in order to perform this operation.

Path's params:
	- `scope` (mandatory).

Payload
```json
{
 "title": string,
 "url": string,
 "description": string,
 "source": string,
 "datatype": string ("historic"/"now"),
 "type": string ("cityanalytics"/"scope"/"vertical"),
 "vertical": string (optional, mandatory if type is set to 'vertical')
}
```

Example Request URL
```text
/aljarafe/frames
```

Example payload
```json
{
 "title": "Título de frame",
 "url": "http://xxx/xxx",
 "description": "Descripción de frame",
 "source": "CARTO",
 "datatype": "now",
 "type": "cityanalytics",
 "vertical": NULL
}
```

### PUT /:scope/frames/:id

Updates a frame for a vertical. Authenticated user must have permissions in order to perform this operation.

Path's params:
	- `scope` (mandatory).
	- `id` (mandatory).

Payload
```json
{
 "title": string,
 "url": string,
 "description": string,
 "source": string,
 "datatype": string ("historic"/"now"),
 "type": string ("cityanalytics"/"scope"/"vertical"),
 "vertical": string (optional, mandatory if type is set to TRUE)
}
```

Example Request URL
```text
/aljarafe/frames/1
```

Example payload
```json
{
 "title": "Título de frame",
 "url": "http://xxx/xxx",
 "description": "Descripción de frame",
 "source": "CARTO",
 "datatype": "now",
 "type": "vertical",
 "vertical": "environment"
}
```

### DELETE /:scope/frames/:id

Deletes a frame for a vertical. Authenticated user must have permissions in order to perform this operation.

Path's params:
	- `scope` (mandatory).
	- `id` (mandatory).

Example Request URL
```text
/aljarafe/frames/1
```