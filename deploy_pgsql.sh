#!/bin/bash

cd "$(dirname "$0")"

docker exec -i urbo_pgsql psql -d urbo -U postgres -f /usr/src/api/db/bootstrap.sql
ls -1a telefonica/*/api/db/bootstrap.sql | xargs -i echo "/usr/src/api/{}" | xargs -n 1 docker exec -i urbo_pgsql  psql -d urbo -U postgres -f
ls -1a aquagis/*/api/db/bootstrap.sql | xargs -i echo "/usr/src/api/{}" | xargs -n 1 docker exec -i urbo_pgsql  psql -d urbo -U postgres -f

