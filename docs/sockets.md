# Sockets

## Connection URLs

* Local: `ws://localhost:3001`
* DEV: `ws://urbo-backend-dev.geographica.gs/api/`
* PRO: `wss://urbo-backend.geographica.gs/api/`


## Process

1. Connect to the WebSocket server.
2. [Configure](#configuration-messages) your connection:
    1. Send the authentication data.
    2. Send the namespaces you want to subscribe. You can send this in the authentication message.
3. The server responds with a [status message](#status-messages) and closing the socket if there's no authentication data or it's not valid.
4. The server will send [content messages](#content-messages) with new data on the namespaces you are subscribed.
5. You can reconfigure your subscriptions or close your socket whenever you want.


## Configuration messages

This type of message is sent by the clients to the server and will trigger a [status message](#status-messages) response. Its fields are:

* `auth`:
    * Type: `string`.
    * Value: the client's authentication token.
    * Mandatory: Only in the first message after the connection, ignored on the rest.
* `subscribe`:
    * Type: `[string]`.
    * Value: The names of the namespaces you want to subscribe.
    * Mandatory: False.
* `unsubscribe`:
    * Type: `[string]`.
    * Value: The names of the namespaces you want to unsubscribe.
    * Mandatory: False.

Example 1:
```json
{
  "auth": "00Sd11u2EuFe21vOS3FF"
}
```

Example 2:
```json
{
  "auth": "00Sd11u2EuFe21vOS3FF",
  "subscribe": [
    "scope1.category1.entity1",
    "scope1.category2.entity1"
  ]
}
```

Example 3:
```json
{
  "subscribe": [
    "scope2.category1.entity1"
  ],
  "unsubscribe": [
    "scope1.category1.entity1",
    "scope1.category2.entity1"
  ]
}
```

Example 4:
```json
{
  "subscribe": [
    "scope2.category2.entity1"
  ]
}
```

Example 5:
```json
{
  "unsubscribe": [
    "scope2.category1.entity1",
    "scope2.category2.entity1"
  ]
}
```


## Status messages

This type of message is sent by the server after a client's [configuration message](#configuration-messages), even if it's empty. Its fields are:

* `type`:
    * Type: `string`.
    * Value: `status`.
* `logged`:
    * Type: `boolean`.
    * Value: It indicates if the user is could sign in.
* `subscriptions`:
    * Type: `[string]`.
    * Value: The name of the namespaces the user is subscribed.

Example 1:
```json
{
  "type": "status",
  "logged": false
}
```

Example 2:
```json
{
  "type": "status",
  "logged": true,
  "subscriptions": []
}
```

Example 3:
```json
{
  "type": "status",
  "logged": true,
  "subscriptions": [
    "scope1.category1.entity1",
    "scope1.category2.entity1"
  ]
}
```

## Content messages

This type of message is sent by the server within a namespace with new data. Its fields are:

* `type`:
    * Type: `string`.
    * Value: `content`.
* `namespace`:
    * Type: `string`.
    * Value: The namespace name.
* `data`:
    * Type: `object`.
    * Value: New data from the namespace.

Example:
```json
{
  "type": "content",
  "namespace": "scope1.category1.entity1",
  "data": {
    ...
  }
}
```
