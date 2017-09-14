#Database

## Create Urbo database
```
docker create -v /data --name urbo_pgdata debian /bin/true
dcp up postgis
```

[Import database](#import-database)

## Recreate Urbo database

```
dcp stop
dcp rm -f
docker rm -v urbo_pgdata
docker create -v /data --name urbo_pgdata debian /bin/true
dcp up postgis
```

[Import database](#import-database)

## Import database
Download dump:
```
aws s3 cp s3://geographica-team/proyectos/urbo/databases/urbo.sprint-10.sql.tar.gz .
tar xvzf urbo.sprint-10.sql.tar.gz
```

Import dump:
```
docker exec -i urbo_postgis_1 psql -U postgres < urbo.sql
```
Note it doesn't work with (because -i is not available at docker-compose):
```
dcp exec -i postgis psql -U postgres < urbo.sql
```


## Database migrations

Create a new migration
```
dcp exec api npm run createmigration -- <migration_name>
```

Apply migrations
```
dcp exec api npm run migrate
```

