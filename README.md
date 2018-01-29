# UrboCore API
URBO's API. This project is the backend application of URBO solution for smart cities.

Status **master** branch: [![Build Status](http://jenkins.geographica.gs/buildStatus/icon?job=urbocore-api/master)](http://jenkins.geographica.gs/job/urbocore-api/job/master/)

Status **dev** branch: [![Build Status](http://jenkins.geographica.gs/buildStatus/icon?job=urbocore-api/dev)](http://jenkins.geographica.gs/job/urbocore-api/job/dev/)

## Introduction
This is the code repository for URBO Core API, the backend application for the URBO project.

This repository provides the base code for the web API and needs to be complemented with pluggable verticals.


## Requirements
* NodeJS version 6.x or greater.
* Docker version 17.06 or greater.
* We recommend using GNU/Linux as server, but is not mandatory.


## Install and run
In order to run this application you will need to install UrboCore API along with some pluggable verticals.

### Installing UrboCore API
1. Clone this repository
2. Create the config file on `config.yml` taking `config.sample.yml` as template and fill it.
3. Create the database environment file on `db-config.env` taking `db-config.sample.env` as template and fill it.
4. Set up the database as is explained in the [Setting up the database](#setting-up-the-database) section.
5. Install node dependencies with npm (or using `yarn` if you prefer).
```
npm install
```
6. Install needed verticals as is explained in the [Managing pluggable verticals](#managing-pluggable-verticals) section.
7. Run server using docker-compose. It will be built in case it does not exist yet.
```
docker-compose up api
```


### Setting up the database
First, create the data container:
```
docker create --name urbo_pgdata -v /data debian /bin/true
```
Start the database:
```
docker-compose up -d postgis
```
Create the database for API and execute the start scripts:
```
docker-compose exec -T postgis psql -U postgres -f /usr/src/db/all.sql
```

### Managing pluggable verticals

#### Install verticals
To install or update a vertical you just need to execute:
```
npm run-script install-vertical -- <vertical-source-path> <vertical-name>
```

Remember to restart the server in order to apply this changes.

#### Delete verticals
The same way you can install a new vertical you can delete it too executing:
```
npm run-script delete-vertical -- <vertical-name>
```

Remember to restart the server in order to apply this changes.

## Testing
To run the tests, just execute:
```
docker-compose run api npm run-script test
```

## API Documentation

The API documentation is available at https://geographicags.github.io/UrboCore-api/.

### Build documentation

To update and upload the API documentation:
1. Install mkdocs:
```
pip install mkdocs
```
2. Build and upload
```
rm -R site
mkdocs gh-deploy --clean
```

3. In case you only want to build the documentation:
```
mkdocs build
```

## License

UrboCore API is licensed under Affero General Public License (GPL) version 3.
