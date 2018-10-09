--
-- Copyright 2018 Telefónica Digital España S.L.
--
-- This file is part of UrboCore API.
--
-- UrboCore API is free software: you can redistribute it and/or
-- modify it under the terms of the GNU Affero General Public License as
-- published by the Free Software Foundation, either version 3 of the
-- License, or (at your option) any later version.
--
-- UrboCore API is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
-- General Public License for more details.
--
-- You should have received a copy of the GNU Affero General Public License
-- along with UrboCore API. If not, see http://www.gnu.org/licenses/.
--
-- For those usages not covered by this license please contact with
-- iot_support at tid dot es
--

-- Set the following parameters according to your needs
---------------------------------------

-- Database config
\set dbname urbo
\set password urbo
\set owner urbo_admin

-- API login for the superuser
\set admin_email 'admin@geographica.gs'
\set admin_pwd 'admin'

---------------------------------------

-- Database initialization
CREATE USER :owner WITH PASSWORD :'password';
CREATE DATABASE :dbname WITH OWNER :owner;

-- Connection to new database as admin
\c :dbname

-- Adding necessary pgsql extensions
CREATE EXTENSION postgis;
CREATE EXTENSION intarray;

-- Set up base schemas and tables
\ir ddl/urbo_init_public.sql
\ir ddl/urbo_init_metadata.sql
\ir ddl/urbo_init_logs.sql

-- Create superuser users in DB and API
\ir dml/urbo_init_admin.sql
