## the_geom filter

This filter makes possible to limit the results inside a determined area.

`the_geom` object supports the following parameters:

- `&&`: a bbox, it must be an array of four decimal numbers. Uses the *&&* operation.
- `ST_Intersects`: can be a string represeting a geometry or a GeoJSON. Makes use of the *ST_Intersects* operation. Keep in mind that if you specify the geomtry the *::geometry* operator will be used, so wraping your string between single quotes is recommended.
- `id`: an id or various ids e.g. "25, 30". Filters with an *IN (ids)* operation.

The filter is not limited to just one parameter, you can specify various parameters and the areas
defined will be intersected, but only one of each kind is admited.

Example request body, remember that only one parameter of each type is allowed, but for this example we have included two *ST_Intersects*:
```
{
    "filters": {
        "the_geom": {
            "&&": [321.328125, 81.0932138526084, -284.765625000000069, -54.1624339680678],
            "ST_Intersects": {
                "type": "Feature",
                "geometry": {
                }
                ...
            },
            "ST_Intersects": "'LINESTRING(-122.33 47.606, 0.0 51.5)'",
            "id": "25, 30"
        }
    }
}
```
