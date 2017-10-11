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


DROP FUNCTION IF EXISTS urbo_size_table_row(varchar, varchar, boolean);
CREATE OR REPLACE FUNCTION urbo_size_table_row(id_scope varchar, table_name varchar, iscarto boolean DEFAULT FALSE)
  RETURNS numeric AS
  $$
  DECLARE
    _t varchar;
    _n numeric;
    _total numeric;
  BEGIN
    _t = urbo_get_table_name(id_scope,table_name,iscarto);
    EXECUTE format('select count(*) from %s',_t) into _n;
    IF _n = 0 THEN
      RETURN _n;
    END IF;
    EXECUTE format('select pg_total_relation_size(%L)',_t) into _total;
    RETURN _total / _n;
  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_size_scope(varchar, varchar,boolean ,boolean);
CREATE OR REPLACE FUNCTION urbo_size_scope(id_scope varchar,vertical varchar, iscarto boolean DEFAULT FALSE,vacuum boolean default false)
  RETURNS setof json AS
  $$
  DECLARE
    _r RECORD;
    _t varchar;
    _q varchar;
  BEGIN
    _q = format('SELECT table_name from information_schema.tables WHERE table_schema=%L AND table_name like ''%s_%s'' ORDER BY table_name',id_scope,vertical,'%');
    FOR _t IN EXECUTE _q LOOP
      RETURN NEXT json_build_object(_t, urbo_size_table_row(id_scope,_t)::integer);
    END LOOP;
    RETURN;
  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_size_scope_pretty(text, text, text, boolean);
CREATE OR REPLACE FUNCTION urbo_size_scope_pretty(
  schemaname text,
  category text,
  id_scope text DEFAULT NULL,
  iscarto boolean DEFAULT FALSE
  )
  RETURNS setof json AS
  $$
  DECLARE
    _tb text;
    _tb_prefix text;
  BEGIN
    IF iscarto IS TRUE then
      _tb_prefix = format('%s_%s',id_scope,category);
    ELSE
      _tb_prefix = format('%s',category);
    END IF;

    FOR _tb IN EXECUTE format('SELECT table_name
          FROM   information_schema.tables
          WHERE  table_schema = %L
          AND    table_name LIKE ''%s%%'' ',
          schemaname, _tb_prefix)
      LOOP
        RETURN NEXT json_build_object(
          'tot_sz',pg_size_pretty(pg_total_relation_size(format('%I.%s',schemaname, _tb))),
          'tab_szr',pg_size_pretty(pg_relation_size(format('%I.%s',schemaname, _tb))),
          'table',_tb
        );

      END LOOP;

  END;
  $$ LANGUAGE plpgsql;

--select urbo_size_rows('distrito_telefonica','parking_parkinggroup');
--select urbo_size_scope('distrito_telefonica','parking');
--select urbo_size_scope_pretty('distrito_telefonica','parking');
