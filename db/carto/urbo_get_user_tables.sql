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
