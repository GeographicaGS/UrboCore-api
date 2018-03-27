## Frames

### GET /:scope/frames

Returns all frames for a scope.

Path's params:
	- `scope` (mandatory).

Example Request URL
```text
/aljarafe/frames
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
      "type": FALSE,
      "vertical": NULL
   }
]
```

### POST /:scope/frames/filter

Return all frames for a scope, and a certain type and vertical.

Path's params:
  - `scope` (mandatory).

Payload
```json
{
  "type": boolean (mandatory),
  "vertical": string (optional, mandatory if type set to TRUE)
}
```

Example Request URL
```text
/aljarafe/frames/filter
```

Example Payload 1
```json
{
  "type": TRUE,
  "vertical": "environment"
}
```

Example Payload 2
```json
{
  "type": FALSE
}
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
      "type": FALSE,
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
  "type": FALSE,
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
 "type": boolean
 "vertical": string (optional, mandatory if type is set to TRUE)
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
 "type": FALSE,
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
 "type": boolean,
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
 "type": FALSE,
 "vertical": NULL
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