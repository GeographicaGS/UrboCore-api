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
* General function to upsert metadata information at general level or for an specific scope.

--------------------------------------------------------------------------------
HOW TO USE:
PgSQL:
SELECT urbo_upsertmetadata(json);

json Example:
{
  "schools.institute.position": {
      "var_name" : "Posición del instituto"
    },
  "irrigation.humiditysensor": {
      "table_name": "irrigation_humiditysensor",
      "mandatory" : true
    },
  "dumps": {
      "config": { "carto": { "account": "cedus-admin" } },
      "nodata": false
    }
}
Call Example:
SELECT urbo_upsertmetadata('{"schools.institute.position":{"var_name":"Posición del instituto"},"irrigation.humiditysensor":{"table_name":"irrigation_humiditysensor","mandatory":true},"dumps":{"config":{"carto":{"account":"cedus-admin"}},"nodata":false}}');
more examples at the end of the script.

----------------------------------------
Category complete json definition

{
  "category_name": -- example: "dumps"
  {
    "id_scopes_in": array of strings, -- if not defined it is applied generally and for all the existing scopes.
    "id_scopes_out": array of strings,
    "id_category": character varying(255), -- NOT NULL
    "category_name": character varying(255),
    "nodata": boolean, -- DEFAULT false
    "config": jsonb -- DEFAULT ''{}''::jsonb
  }
}

----------------------------------------
Entity complete json definition

{
  "category_name.entity_name": -- example: "irrigation.humiditysensor"
  {
    "id_scopes_in": array of strings, -- if not defined it is applied generally and for all the existing scopes.
    "id_scopes_out": array of strings,
    "id_entity": character varying(255), -- NOT NULL
    "entity_name": character varying(255),
    "id_category": character varying(255),
    "table_name": character varying(255),
    "mandatory": boolean, -- DEFAULT false
    "editable": boolean -- DEFAULT false
  }
}

----------------------------------------
Variable complete json definition

{
  "category_name.entity_name.variable_name": -- example: "schools.institute.position"
  {
    "id_scopes_in": array of strings, -- if not defined it is applied generally and for all the existing scopes.
    "id_scopes_out": array of strings,
    "id_variable": character varying(255), -- NOT NULL
    "id_entity": character varying(255), -- NOT NULL
    "entity_field": character varying(255), -- NOT NULL
    "var_name": character varying(255),
    "var_units": character varying(255),
    "var_thresholds": double precision[],
    "var_agg": character varying[],
    "var_reverse": boolean,
    "config": jsonb,
    "table_name": character varying(255),
    "type": character varying(255), -- DEFAULT ''catalogue''::character varying
    "mandatory": boolean, -- DEFAULT false
    "editable": boolean -- DEFAULT false
  }
}
--------------------------------------------------------------------------------
*/

DROP FUNCTION IF EXISTS urbo_upsertmetadata(jsonb);
CREATE OR REPLACE FUNCTION urbo_upsertmetadata(
    json_configs jsonb DEFAULT '{}'::jsonb
  )
RETURNS void
AS $$
  DECLARE
    _key_json text;
  BEGIN
    -- Iterate
    FOR _key_json IN SELECT * FROM json_object_keys(json_configs::json)
    LOOP
      -- Check regex
      IF (_key_json ~* '^(.*?)\.(.*?)\.(.*?)$') THEN
        PERFORM _urbo_upsertmetadata('variables', _key_json, json_configs->_key_json);
      ELSIF (_key_json ~* '^(.*?)\.(.*?)$') THEN
        -- PERFORM _urbo_upsertmetadata('entities'::text, _key_json::text, json_configs::jsonb->_key_json);
      ELSE
        -- PERFORM _urbo_upsertmetadata('categories'::text, _key_json::text, json_configs::jsonb->_key_json);
      END IF;
    END LOOP;
  END;
$$ LANGUAGE plpgsql;



DROP FUNCTION IF EXISTS _urbo_upsertmetadata(text, text, jsonb);
CREATE OR REPLACE FUNCTION _urbo_upsertmetadata(
  metadata_level text DEFAULT '',
  id_value text DEFAULT '',
  json_config jsonb DEFAULT '{}'::jsonb
)
RETURNS void
AS $$
  DECLARE
    _metadata_levels json DEFAULT '{"categories":"id_category","entities":"id_entity","variables":"id_variable"}'::jsonb;
    _limit_scopes boolean DEFAULT 'true';
    _scopes jsonb;
    _scope text;
    _metadata_exists text;

  BEGIN
    -- check scope and clean config
    _limit_scopes := (SELECT (json_config::jsonb ? 'id_scopes_in'));
    _scopes := (SELECT _urbo_checkmetadata_scopes(json_config));
    json_config := (SELECT _urbo_clean_config(json_config));

    IF _limit_scopes THEN

      -- apply changes only for specific scopes
      FOR _scope IN SELECT * FROM json_array_elements(_scopes::json)
      LOOP

        raise notice 'applying changes to scope %', _scope;

        -- Update metadata or Create metadata
        EXECUTE format('SELECT count(*) FROM metadata.%1s_scopes WHERE %2s = ''%3s''', metadata_level, _metadata_levels->metadata_level, id_value) into _metadata_exists;
        IF _metadata_exists IS NOT NULL AND _metadata_exists = '1' THEN
          PERFORM _urbo_updatemetadata(_scope, metadata_level, id_value, json_config);
        ELSE
          PERFORM _urbo_createmetadata(_scope, metadata_level, id_value, json_config);
        END IF;

      END LOOP;

    ELSE

        -- apply changes for general definition and scopes
        EXECUTE format('SELECT count(*) FROM metadata.%I WHERE ''%I'' = ''%3s''', metadata_level, _metadata_levels->metadata_level, id_value) into _metadata_exists;
        IF _metadata_exists IS NOT NULL AND _metadata_exists = '1' THEN
          PERFORM _urbo_updatemetadata(NULL, metadata_level, id_value, json_config);
        ELSE
          PERFORM _urbo_createmetadata(NULL, metadata_level, id_value, json_config);
        END IF;

        FOR _scope IN SELECT * FROM json_array_elements(_scopes::json)
        LOOP

          raise notice 'applying changes to scope %', _scope;

          EXECUTE format('SELECT count(*) FROM metadata.%1s_scopes WHERE ''%I'' = ''%3s''', metadata_level, _metadata_levels->metadata_level, id_value) into _metadata_exists;
          IF _metadata_exists IS NOT NULL AND _metadata_exists = '1' THEN
            -- PERFORM _urbo_updatemetadata(_scope, metadata_level, id_value, json_config);
          ELSE
            PERFORM _urbo_createmetadata(_scope, metadata_level, id_value, json_config);
          END IF;

        END LOOP;

    END IF;

    EXCEPTION
    WHEN others THEN
        RAISE INFO 'Error Name: %',SQLERRM;
        RAISE INFO 'Error State: %', SQLSTATE;

  END;
$$ LANGUAGE plpgsql;



DROP FUNCTION IF EXISTS _urbo_checkmetadata_scopes(jsonb);
CREATE OR REPLACE FUNCTION _urbo_checkmetadata_scopes(
    json_config jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
AS $$
  DECLARE
    _scopes jsonb DEFAULT '{}'::jsonb;
    _scope_out text;
  BEGIN
    -- check scopes of application
    IF (SELECT json_config->'id_scopes_in') IS NOT NULL THEN
      _scopes := json_config->'id_scopes_in';
    ELSE
      EXECUTE format('SELECT array_to_json(ARRAY(SELECT id_scope FROM metadata.scopes))') into _scopes;
    END IF;
    RETURN _scopes;
  END;
$$ LANGUAGE plpgsql;



DROP FUNCTION IF EXISTS _urbo_clean_config(jsonb);
CREATE OR REPLACE FUNCTION _urbo_clean_config(
  json_config jsonb
)
RETURNS jsonb
AS $$
  BEGIN
    IF (SELECT json_config->'id_scopes_in') IS NOT NULL THEN
      json_config := json_config - 'id_scopes_in';
    END IF;
    IF (SELECT json_config->'id_scopes_out') IS NOT NULL THEN
      json_config := json_config - 'id_scopes_out';
    END IF;
    RETURN json_config;
  END;
$$ LANGUAGE plpgsql;



DROP FUNCTION IF EXISTS _urbo_updatemetadata(text,text,text,jsonb);
CREATE OR REPLACE FUNCTION _urbo_updatemetadata(
  scope text DEFAULT '',
  metadata_level text DEFAULT '',
  id_value text DEFAULT '',
  json_config jsonb DEFAULT '{}'::jsonb
)
RETURNS void
AS $$
  DECLARE
    _key_json text;
    _value_json text;
    _column_exists text;
    _metadata_levels json DEFAULT '{"categories":"id_category","entities":"id_entity","variables":"id_variable"}'::jsonb;

  BEGIN
    FOR _key_json, _value_json IN SELECT * FROM json_each_text(json_config::json)
    LOOP

      -- check if config exists and it is correct
      EXECUTE format('SELECT column_name FROM information_schema.columns WHERE table_name=''%I'' and column_name= %L', metadata_level, _key_json) into _column_exists;
      IF _column_exists IS NOT NULL THEN
        IF scope IS NOT NULL THEN
          EXECUTE format('UPDATE metadata.%I_scopes SET %I = %L WHERE %s = %L AND id_scope = %L', metadata_level, _key_json, _value_json, _metadata_levels->metadata_level, id_value, scope);
        ELSE
          EXECUTE format('UPDATE metadata.%I SET %I = %L WHERE %I = %L', metadata_level, _key_json, _value_json, _metadata_levels->metadata_level, id_value);
        END IF;
      END IF;

    END LOOP;

    EXCEPTION
    WHEN others THEN
        RAISE INFO 'Error Name: %',SQLERRM;
        RAISE INFO 'Error State: %', SQLSTATE;
  END;
$$ LANGUAGE plpgsql;



DROP FUNCTION IF EXISTS _urbo_createmetadata(text,text,text,jsonb);
CREATE OR REPLACE FUNCTION _urbo_createmetadata(
  scope text DEFAULT NULL,
  metadata_level text DEFAULT '',
  id_value text DEFAULT '',
  json_config jsonb DEFAULT '{}'::jsonb
)
RETURNS void
AS $$
  DECLARE
    _parent_id text;
    _parent_id_exists integer DEFAULT 0;
    _metadata_levels json DEFAULT '{"categories":"id_category","entities":"id_entity","variables":"id_variable"}'::jsonb;
    _general_metadata_exists integer DEFAULT 0;

  BEGIN


    IF metadata_level = 'variables' THEN
      -- first check if entity asociated exists and extend config
      _parent_id := (SELECT TRIM(leading '"' from (SELECT substring(id_value, '^((.*?)\.(.*?))\.'))));
      _parent_id_exists := (SELECT count(*) FROM metadata.entities WHERE id_entity = TRIM(BOTH '"' FROM _parent_id));

      EXECUTE format('SELECT ''{"id_variable": %I}''::jsonb || %L', id_value, json_config) into json_config;
      EXECUTE format('SELECT ''{"id_entity": %I}''::jsonb || %L', _parent_id, json_config) into json_config;
      IF scope IS NOT NULL THEN
        EXECUTE format('SELECT ''{"id_scope": %s}''::jsonb || %L', scope, json_config) into json_config;
      END IF;

    ELSIF metadata_level = 'entities' THEN
      -- first check if category asociated exists and extend config
      _parent_id := (SELECT TRIM(leading '"' from (SELECT substring(id_value, '^((.*?))\.'))));
      _parent_id_exists := (SELECT count(*) FROM metadata.categories WHERE id_category = TRIM(BOTH '"' FROM _parent_id));
      EXECUTE format('SELECT ''{"id_entity": %I}''::jsonb || %L', id_value, json_config) into json_config;
      IF scope IS NOT NULL THEN
        EXECUTE format('SELECT ''{"id_scope": %s}''::jsonb || %L', scope, json_config) into json_config;
      END IF;

    ELSE
      RAISE NOTICE 'category cannot be created. Please define a complete vertical instead! :)';
      RETURN;

    END IF;

    IF _parent_id_exists THEN

      -- execute insertion
      IF scope IS NOT NULL THEN
        EXECUTE format('INSERT INTO metadata.%I_scopes SELECT * FROM json_populate_record(null::metadata.%I_scopes, %L)', metadata_level, metadata_level, json_config);
      ELSE
        EXECUTE format('INSERT INTO metadata.%I SELECT * FROM json_populate_record(null::metadata.%I, %L)', metadata_level, metadata_level, json_config);
      END IF;

    ELSE

      IF scope IS NOT NULL THEN
        RAISE NOTICE 'parent % doesn''t exist for %, escaping variable creation', _parent_id, scope;
      ELSE
        RAISE NOTICE 'parent % doesn''t exist, escaping variable creation', _parent_id;
      END IF;

    END IF;

    EXCEPTION
    WHEN others THEN
        RAISE INFO 'Error Name: %',SQLERRM;
        RAISE INFO 'Error State: %', SQLSTATE;

  END;
$$ LANGUAGE plpgsql;



DROP FUNCTION IF EXISTS _urbo_updateusergraph(text, text);
CREATE OR REPLACE FUNCTION _urbo_updateusergraph(
  id_scope_name text DEFAULT '',
  cat_name text DEFAULT ''
)
RETURNS void
AS $$
  DECLARE
    _read_users bigint[];
    _id_up integer;
  BEGIN
    IF id_scope_name is not NULL THEN
      _read_users := (
        SELECT
          read_users
        FROM users_graph ug
        INNER JOIN metadata.scopes ms ON ms.id_scope = ug.name
        WHERE name = id_scope_name
      );

      _id_up := (
        WITH RECURSIVE children_graph AS (
          SELECT
            id, name, parent
          FROM users_graph
          WHERE
            name = id_scope_name
          UNION
          SELECT
            ug.id, ug.name, ug.parent
          FROM users_graph ug
          INNER JOIN children_graph pg ON pg.id = ug.parent
        )
        SELECT
          id
        FROM children_graph pg
        WHERE name = cat_name
      );

      UPDATE public.users_graph set read_users=_read_users WHERE id=_id_up;

    ELSE
      RAISE NOTICE 'nothing to update';

    END IF;
  END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------
-- EXAMPLES:
--
-- Upsert variable
select urbo_upsertmetadata('{"schools.institute.positions":{"var_name":"Posición del instituto (nueva)"}}');
-- Upsert entity
-- select urbo_upsertmetadata('{"irrigation.humiditysensor":{"table_name":"irrigation_humiditysensor_new","mandatory":false}}');
-- Upsert category
-- select urbo_upsertmetadata('{"dumps":{"config":{"carto":{"account":"cedus-admin"}},"nodata":true}}');
-- All together
-- select urbo_upsertmetadata('{"schools.institute.positions":{"var_name":"Posición del instituto (nueva)"},"irrigation.humiditysensor":{"table_name":"irrigation_humiditysensor_new","mandatory":false},"dumps":{"config":{"carto":{"account":"cedus-admin"}},"nodata":true}}');
-- intermediate wrapper
-- select _urbo_upsertmetadata('variables', 'schools.institute.position', '{"id_scopes":["torino","madrid"],"var_names":"Posición del instituto TEXT1", "mandatory": "false"}');

-- update metadata
-- select _urbo_updatemetadata(NULL, 'variables', 'schools.institute.position', '{"var_name":"Posición del instituto TEXT2", "mandatory": "false"}');
-- select _urbo_updatemetadata('madrid', 'entities', 'irrigation.humiditysensors', '{"table_name":"irrigation_humiditysensor","mandatory":true}');
-- select _urbo_updatemetadata('madrid', 'categories', 'schools', '{"nodata":true}');

-- create metadata
-- select _urbo_createmetadata(NULL, 'variables', 'schools.institute.positionsss', '{"var_names":"Posición del instituto TEXT1", "mandatory": "false"}');
-- select _urbo_createmetadata(NULL, 'entities', 'irrigation.humiditysensortest2', '{"table_name":"irrigation_humiditysensor","mandatory":true}');
-- select _urbo_createmetadata('madrid', 'categories', 'irrigations', '{"config":{"carto":{"account":"cedus-admin"}},"nodata":false}');

-- utils metadata
-- select _urbo_checkmetadata_scopes('{"id_scopes_in":["torino","madrid"],"var_names":"Posición del instituto TEXT1", "mandatory": "false"}');
-- select _urbo_clean_config('{"id_scopes":["torino","madrid"],"var_names":"Posición del instituto TEXT1", "mandatory": "false"}');
-- select _urbo_updateusergraph('madrid', 'dumps.container.category');
--
-- ---------------------------------------------------------
