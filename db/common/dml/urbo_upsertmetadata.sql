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
SELECT urbo_upsertmetadata('{"schools.institute.position":{"var_name":"Posición del instituto"},"irrigation.humiditysensor":{"table_name":"irrigation_humiditysensor","mandatory":true},"dumps":{"config":{"carto":{"account":"cedus-admin"}},"nodata":false}}'::json);

----------------------------------------
Category complete json definition

{
  "category_name": -- example: "dumps"
  {
    "id_scopes": array of strings, -- if not defined it is applied generally and for all the existing scopes.
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
    "id_scopes": array of strings, -- if not defined it is applied generally and for all the existing scopes.
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
    "id_scopes": array of strings, -- if not defined it is applied generally and for all the existing scopes.
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




DROP FUNCTION IF EXISTS _urbo_checkmetadata_scope(jsonb);
CREATE OR REPLACE FUNCTION _urbo_checkmetadata_scope(
  json_config jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
AS $$
  DECLARE
    _scopes jsonb DEFAULT '{}'::jsonb;
  BEGIN
    -- check scope of application
    IF (SELECT json_config->'id_scopes') IS NOT NULL THEN
      RAISE NOTICE 'scopes defined';
      _scopes := json_config->'id_scopes';
      RAISE NOTICE '_scopes %', _scopes;
    ELSE
      EXECUTE format('SELECT array_to_json(ARRAY(SELECT id_scope FROM metadata.scopes))') into _scopes;
      RAISE NOTICE '_scopes %', _scopes;
    END IF;
    RETURN _scopes;
  END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_upsertmetadata(json);

CREATE OR REPLACE FUNCTION urbo_upsertmetadata(
  _json_defs json DEFAULT '{}'::json
DROP FUNCTION IF EXISTS _urbo_clean_config(jsonb);
CREATE OR REPLACE FUNCTION _urbo_clean_config(
  json_config jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
AS $$
  BEGIN
    IF (SELECT json_config->'id_scopes') IS NOT NULL THEN
    	json_config := json_config - 'id_scopes';
   		RAISE NOTICE 'json_config %', json_config;
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
    _column_check text;
  BEGIN
    -- Update if exists
    RAISE NOTICE '% exists!', metadata_level;
    -- Update metadata -- iterate json configuration
    FOR _key_json, _value_json IN SELECT * FROM json_each_text(json_config::json)
    LOOP
      -- check if config exists and it is correct
      RAISE NOTICE '%', format('SELECT column_name FROM information_schema.columns WHERE table_name=''%I'' and column_name= ''%L''', metadata_level, _key_json);
      EXECUTE format('SELECT column_name FROM information_schema.columns WHERE table_name=''%I'' and column_name= %L', metadata_level, _key_json) into _column_check;
      IF _column_check IS NOT NULL THEN
        EXECUTE format('UPDATE metadata.%I SET %I = %L WHERE id_variable = %L', metadata_level, _key_json, _value_json, id_value);
        RAISE NOTICE 'column updated';
      ELSE
        RAISE NOTICE 'column ''%'' not exists, can''t be updated', _key_json;
      END IF;
    END LOOP;
  END;
$$ LANGUAGE plpgsql;




select urbo_upsertmetadata();
