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
* Function to drop all tables for a category in a given schema.
*
*/

--------------------------------------------------------------------------------
-- HOW TO USE:
-- PgSQL: 
    -- SELECT urbo_droptables_from_category('calvia', 'lighting');
-- Carto: 
    -- SELECT urbo_droptables_from_category('carto-account', 'lighting', 'calvia', TRUE)
--------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS urbo_droptables_from_category(text, text, text, boolean);

CREATE OR REPLACE FUNCTION urbo_droptables_from_category(
  schemaname text,
  category text,
  id_scope text DEFAULT NULL, --only use if iscarto=TRUE
  iscarto boolean DEFAULT FALSE
  )
  RETURNS setof text AS
  $$
  DECLARE
    _tb text;
    _tb_prefix text;
  BEGIN
    IF iscarto IS TRUE then
      _tb_prefix = format('%s_%s_',id_scope,category);
    ELSE
      _tb_prefix = format('%s_',category);
    END IF;

    FOR _tb IN EXECUTE format('SELECT table_name
          FROM   information_schema.tables
          WHERE  table_schema = %L
          AND    table_name LIKE ''%s%%'' ',
          schemaname, _tb_prefix)
      LOOP
        EXECUTE format('DROP TABLE %I.%s CASCADE',
          schemaname, _tb);

        RETURN NEXT _tb;

      END LOOP;

  END;
  $$ LANGUAGE plpgsql;
