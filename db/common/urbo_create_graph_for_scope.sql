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
DROP FUNCTION IF EXISTS urbo_create_graph_for_scope(text, text);
CREATE OR REPLACE FUNCTION urbo_create_graph_for_scope(id_scope text, id_category text)
  RETURNS numeric AS
  $$
  DECLARE
    _rootid numeric;
    _scopeid numeric;
    _categoryid numeric;
    _entityid numeric;
    _q text;
    _qent text;
    _qvar text;
    _insertvars text;
    _rq text;
    _r record;
    _ra record;
    _rvar record;
  BEGIN


    _q := format('SELECT id FROM public.users_graph where name=''root''');
    EXECUTE _q INTO _r;
    if _r IS NULL THEN
      RETURN NULL;
    END IF;
    _rootid := _r.id;

    -- FIRST INSERT scope

    _q := format('SELECT id FROM public.users_graph where name=''%s''', id_scope);
    EXECUTE _q INTO _r;
    -- raise notice '%', _r;
    IF _r is NULL THEN
      _q := format('
        WITH insertion as (
          INSERT INTO public.users_graph (name, parent, read_users, write_users)
          VALUES (''%s'', %s, array[]::bigint[],array[]::bigint[]) RETURNING id
        )
        SELECT id FROM insertion',
        id_scope, _rootid);
      -- raise notice '%', _q;
      EXECUTE _q into _r;
      -- raise notice '%', _r;
    END IF;
    _scopeid := _r.id;


    -- THEN INSERT category IF EXISTS

    _q := format('SELECT id_category FROM metadata.categories_scopes
      WHERE id_scope=''%s'' AND id_category=''%s''', id_scope, id_category);
    -- RAISE NOTICE '%', _q;
    EXECUTE _q INTO _r;
    IF _r IS NULL THEN
      RETURN NULL;
    END IF;

    _q := format('
      WITH insertion as (
        INSERT INTO public.users_graph (name, parent, read_users, write_users)
        VALUES (''%s'', %s, array[]::bigint[],array[]::bigint[]) RETURNING id
      )
      SELECT id FROM insertion',
      id_category, _scopeid);
    EXECUTE _q INTO _r;

    _categoryid := _r.id;

    -- SEARCH ENTITIES FOR CATEGORY

    _q := format('
      SELECT
        DISTINCT id_entity
      FROM metadata.entities_scopes
      WHERE id_scope=''%s''
      AND id_category =''%s''',
      id_scope, id_category);
    FOR _r IN EXECUTE _q LOOP

      -- raise notice '%', _r;
      _qent := format('
      WITH insertion as (
        INSERT INTO public.users_graph (name, parent, read_users, write_users)
        VALUES (''%s'', %s, array[]::bigint[],array[]::bigint[]) RETURNING id
      )
      SELECT id FROM insertion',
      _r.id_entity, _categoryid);
      -- RAISE NOTICE '%', _qent;
      EXECUTE _qent INTO _rq;
      -- RAISE NOTICE '%', _rq;

      _entityid = _rq;
      -- RAISE NOTICE '%', _entityid;

      -- SEARCH VARIABLES FOR ENTITY
      _qvar := format('
        SELECT
          DISTINCT id_variable
        FROM metadata.variables_scopes
        WHERE id_scope=''%s''
        AND id_entity=''%s''',
        id_scope, _r.id_entity);

      FOR _rvar IN EXECUTE _qvar LOOP
        _insertvars = format('
          INSERT INTO public.users_graph (name, parent, read_users, write_users)
          VALUES (''%s'', %s, array[]::bigint[],array[]::bigint[])',
        _rvar.id_variable, _entityid);

        -- raise notice '%', _insertvars;
        EXECUTE _insertvars;

      END LOOP;

    END LOOP;

    RETURN _categoryid;

  END;
  $$ LANGUAGE plpgsql;

-- SELECT urbo_create_graph_for_scope('distrito_telefonica', 'lighting');