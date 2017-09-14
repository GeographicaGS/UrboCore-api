## Users

### GET /users

It returns the list of users.

Sample response:

```json
[{
  id: 1,
  name: "John",
  surname : "Smith",
  email: "admin@domain.gs",
  superadmin: false,
  scopes : ["s1","s2","s3"]
  }]
```

Notes:
- Only superadmin can call this method

### POST /users

It creates a new user
```json
{
  name: "John",
  surname: "Smith",
  email: "admin@domain.gs",
  password: "test1234",
  superadmin : false,
  scopes : ["s1","s2","s3"]
}
```

If error it returns a error status code and a message:
```json
[
  {
    "param": "email",
    "msg": "required"
  }
]
```

if ok it returns the user id:
```json
{
  id: 1
}
```

Notes:
- Only superadmin can call this method

### GET /users/:id

It returns the info of an user:
```json
{
  id: 1,
  name: "John",
  surname: "Smith",
  email: "admin@domain.gs",
  superadmin: false,
  scopes : ["s1","s2","s3"]
}
```

Notes:
- Only superadmin can get info of other users.
- A non-superadmin user can only get the info of himself.

### PUT /users/:id

It updates the user info
```json
{
  name: "John",
  surname: "Smith",
  email: "admin@domain.gs",
  superadmin: false,
  scopes : ["s1","s2","s3"],
  old_password: "test1234",
  password: "awesomepassword"
}
```

Notes:
- Only admin can change other users data.
- password: if the user who launches the request is not an admin user, he needs to supply the old_password.

### DELETE /users/:id
It deletes an user.

Sample response
```json
{
  status : "ok"
}
```

Notes:
- Only superadmin can use this method.
