--
-- Copyright 2017 Telefónica Digital España S.L.
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
/*
* Function to get user tables on CARTO
*/

CREATE OR REPLACE FUNCTION urbo_get_user_tables(theuser text)
  RETURNS SETOF name
  AS $$
  SELECT c.relname
  FROM pg_class c 
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' 
  AND c.relname NOT IN ('cdb_tablemetadata', 'spatial_ref_sys')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'topology', 'cartodb')
  AND n.nspname = theuser
  $$ LANGUAGE 'sql';
