# UrboCore API
URBO's API. This project is the backend application of URBO solution for smart cities.

Status **master** branch: [![Build Status](http://jenkins.geographica.gs/buildStatus/icon?job=urbocore-api/master)](https://jenkins.geographica.gs/job/urbocore-api/job/master/)

Status **dev** branch: [![Build Status](http://jenkins.geographica.gs/buildStatus/icon?job=urbocore-api/dev)](https://jenkins.geographica.gs/job/urbocore-api/job/dev/)

## Introduction
This is the code repository for URBO Core API, the backend application for the URBO project.

This repository provides the base code for the web API and needs to be complemented with pluggable verticals.


## Requirements
* NodeJS version 6.x or greater.
* Docker version 17.06 or greater.
* We recommend using GNU/Linux as server, but is not mandatory.

## Notes for developers
The development configurations for the different containers required by the API are defined in the *docker-compose.dev.yml* file. In order to use these configs you will have to append to your docker-compose commands two `-f` flags. For example:
```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```
This leads to more difficult to read commands, our recommendation is to create an alias in your shell, we call it `dcp`:
```
alias dcp="docker-compose -f docker-compose.yml -f docker-compose.dev.yml"
```
With this alias you can issue commands faster, the previous example ends up like this:
```
dcp up -d
```
Remember that you can still use other docker-compose commands with this shortcut: `dcp build`, `dcp down` ...


## Install and run
In order to run this application you will need to install UrboCore API along with some pluggable verticals. Check [API development mode](#api-development-mode) if you wish to debug the API.

### Setting up UrboCore API
1. Clone this repository
2. Set up the database as is explained in the [Setting up the database](#setting-up-the-database) section.
3. Create the config file on `config.yml` taking `config.sample.yml` as template and fill it.
4. Install needed verticals as is explained in the [Managing pluggable verticals](#managing-pluggable-verticals) section.
5. Run server using docker-compose.
```
docker-compose up api
# Or
dcp up -d api  # Debug with Node inspector
```

### Setting up the database
The `postgis` service defined in the docker-compose files will mount by default a volume to the `db` directory in the repository. This directory contains the base functions and scripts necessary for Urbo to work properly. Follow these steps:
1. Create a Docker volume named `urbo-db-data`. This volume will store all data related to the Postgres container. You do not have to worry if your db container gets destroyed as long as this volume stays intact.
```
docker volume create urbo-db-data
```
2. (Optional) Change the default values existing in `db/init/bootstrap.sql` and `db/bootstrap.sql`. At startup a database and a new PostgreSQL user for the API will be created, the created user will be granted full access to the new database. The process will end with the creation of the superuser for logging in the application. You can change the following parameters:
   - `owner`: The urbo database's owner. This is the name of the PostgreSQL user that will have full access to the database created.
   - `password`: The password to for the PostgreSQL user.
   - `dbname`: The name for the new database.
   - `admin_email`: The login email for the admin user.
   - `admin_password`: The password for the admin user.

3. Start the database:
```
docker-compose up -d postgis
# Or
dcp up -d postgis  # Maps port 5435 on your host to the 5432 in the container
```

### Managing pluggable verticals
The process of installing a vertical consists in copying the necessary resources (routes, models, etc.) into the *verticals* folder inside the container. Both production and development configurations can be modified in order to declare a docker volume and mount the resources.
The *install-vertical* tool is handy if you wish to copy those resources from a directory containing different verticals. Take into account that you will need to install Node.js and the necessary dependencies in your host with npm.

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

You can think of other approaches, such as copying the resources manually (look for the *api* directory inside each vertical) into one directory and mounting that. Keep in mind that you need to preserve the `index.js` file!

### API development mode
The *docker-compose.dev.yml* file creates containers with an alternative configuration for the Postgres and the API:
- Postgres:
    - Publishes to your host the default PostgreSQL port in 5435. Useful for local connections with psql or PgAdmin.
- API:
    - Starts the Node server with the Inspector mode. This mode allows you to debug the API with your favourite IDE, text editor or Chromium-based web browser. The debug port (9229) will be bridged to your host, so you can debug as if you had all the dependencies installed in your machine. The API will start with a breakpoint at the startup, you will need to connect to the debug process in order to continue with the execution.
    - Publishes the Urbo API container listening port in your host's 3005 port. Send HTTP requests to the API in http://localhost:3005

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
