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

--------------------------------------------------------------------------------
-- HOW TO USE:
--  SELECT urbo_metadata('urbo_admin');
--------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS urbo_metadata(text, boolean);

CREATE OR REPLACE FUNCTION urbo_metadata(
  t_owner text,
  isdebug boolean DEFAULT FALSE
  )
  RETURNS void AS
  $$
  DECLARE
    _ddl_qry text;
    _t_count integer;
  BEGIN
    SELECT COUNT(*) INTO _t_count FROM information_schema.schemata WHERE schema_name = 'metadata';
    IF isdebug IS TRUE then
        RAISE NOTICE '%', _ddl_qry;
    END IF;

    IF _t_count = 0 IS TRUE THEN
      _ddl_qry = format('
      CREATE SCHEMA metadata;

      ALTER SCHEMA metadata OWNER TO %1$s;

      CREATE TABLE metadata.categories (
          id_category character varying(255) NOT NULL,
          category_name character varying(255),
          nodata boolean DEFAULT false,
          config jsonb DEFAULT ''{}''::jsonb
      );

      ALTER TABLE metadata.categories OWNER TO %1$s;

      CREATE TABLE metadata.categories_scopes (
          id_scope character varying(255) NOT NULL,
          id_category character varying(255) NOT NULL,
          category_name character varying(255),
          nodata boolean DEFAULT false,
          config jsonb DEFAULT ''{}''::jsonb
      );

      ALTER TABLE metadata.categories_scopes OWNER TO %1$s;

      CREATE TABLE metadata.entities (
          id_entity character varying(255) NOT NULL,
          entity_name character varying(255),
          id_category character varying(255),
          table_name character varying(255),
          mandatory boolean DEFAULT false,
          editable boolean DEFAULT false
      );

      ALTER TABLE metadata.entities OWNER TO %1$s;

      CREATE TABLE metadata.entities_scopes (
          id_scope character varying(255) NOT NULL,
          id_entity character varying(255) NOT NULL,
          entity_name character varying(255),
          id_category character varying(255),
          table_name character varying(255),
          mandatory boolean DEFAULT false,
          editable boolean DEFAULT false
      );

      ALTER TABLE metadata.entities_scopes OWNER TO %1$s;

      CREATE TABLE metadata.scope_widgets_tokens (
          id_scope character varying(255) NOT NULL,
          id_widget character varying(255) NOT NULL,
          publish_name character varying(255) NOT NULL,
          token text NOT NULL,
          payload jsonb,
          id integer NOT NULL,
          description text,
          created_at timestamp without time zone DEFAULT timezone(''utc''::text, now())
      );

      ALTER TABLE metadata.scope_widgets_tokens OWNER TO %1$s;

      CREATE SEQUENCE metadata.scope_widgets_tokens_id_seq
          START WITH 1
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;


      ALTER TABLE metadata.scope_widgets_tokens_id_seq OWNER TO %1$s;

      ALTER SEQUENCE metadata.scope_widgets_tokens_id_seq OWNED BY metadata.scope_widgets_tokens.id;

      CREATE TABLE metadata.scopes (
          id_scope character varying(255) NOT NULL,
          scope_name character varying(255),
          geom public.geometry(Point,4326),
          zoom smallint,
          dbschema character varying(255),
          parent_id_scope character varying(255) DEFAULT NULL::character varying,
          status smallint DEFAULT 0,
          timezone character varying(255),
          config jsonb
      );

      ALTER TABLE metadata.scopes OWNER TO %1$s;

      CREATE TABLE metadata.variables (
          id_variable character varying(255) NOT NULL,
          id_entity character varying(255),
          entity_field character varying(255),
          var_name character varying(255),
          var_units character varying(255),
          var_thresholds double precision[],
          var_agg character varying[],
          var_reverse boolean,
          config jsonb,
          table_name character varying(255),
          type character varying(255) DEFAULT ''catalogue''::character varying,
          mandatory boolean DEFAULT false,
          editable boolean DEFAULT false
      );


      ALTER TABLE metadata.variables OWNER TO %1$s;

      CREATE TABLE metadata.variables_scopes (
          id_scope character varying(255) NOT NULL,
          id_variable character varying(255) NOT NULL,
          id_entity character varying(255) NOT NULL,
          entity_field character varying(255),
          var_name character varying(255),
          var_units character varying(255),
          var_thresholds double precision[],
          var_agg character varying[],
          var_reverse boolean,
          config jsonb,
          table_name character varying(255),
          type character varying(255) DEFAULT ''catalogue''::character varying,
          mandatory boolean DEFAULT false,
          editable boolean DEFAULT false
      );

      ALTER TABLE metadata.variables_scopes OWNER TO %1$s;

      ALTER TABLE ONLY metadata.scope_widgets_tokens ALTER COLUMN id SET DEFAULT nextval(''scope_widgets_tokens_id_seq''::regclass);

      ALTER TABLE ONLY metadata.categories
          ADD CONSTRAINT categories_pkey PRIMARY KEY (id_category);

      ALTER TABLE ONLY metadata.categories_scopes
          ADD CONSTRAINT categories_scopes_pkey PRIMARY KEY (id_scope, id_category);

      ALTER TABLE ONLY metadata.entities
          ADD CONSTRAINT entities_pkey PRIMARY KEY (id_entity);

      ALTER TABLE ONLY metadata.entities_scopes
          ADD CONSTRAINT entities_scopes_pkey PRIMARY KEY (id_scope, id_entity);

      ALTER TABLE ONLY metadata.scope_widgets_tokens
          ADD CONSTRAINT scope_widgets_tokens_id_scope_id_widget_publish_name_token_key UNIQUE (id_scope, id_widget, publish_name, token);

      ALTER TABLE ONLY metadata.scope_widgets_tokens
          ADD CONSTRAINT scope_widgets_tokens_pkey PRIMARY KEY (id);

      ALTER TABLE ONLY metadata.scopes
          ADD CONSTRAINT scopes_dbschema_key UNIQUE (dbschema);

      ALTER TABLE ONLY metadata.scopes
          ADD CONSTRAINT scopes_pkey PRIMARY KEY (id_scope);

      ALTER TABLE ONLY metadata.variables
          ADD CONSTRAINT variables_pkey PRIMARY KEY (id_variable);

      ALTER TABLE ONLY metadata.variables_scopes
          ADD CONSTRAINT variables_scopes_pkey PRIMARY KEY (id_scope, id_entity, id_variable);

      CREATE INDEX idx_scope_geom ON metadata.scopes USING gist (geom);

      ALTER TABLE ONLY metadata.categories_scopes
          ADD CONSTRAINT categories_scopes_id_category_fkey FOREIGN KEY (id_category) REFERENCES metadata.categories(id_category);

      ALTER TABLE ONLY metadata.categories_scopes
          ADD CONSTRAINT categories_scopes_id_scope_fkey FOREIGN KEY (id_scope) REFERENCES metadata.scopes(id_scope) ON UPDATE CASCADE ON DELETE CASCADE;

      ALTER TABLE ONLY metadata.entities
          ADD CONSTRAINT entities_id_category_fkey FOREIGN KEY (id_category) REFERENCES metadata.categories(id_category);

      ALTER TABLE ONLY metadata.entities_scopes
          ADD CONSTRAINT entities_scopes_id_category_fkey FOREIGN KEY (id_category) REFERENCES metadata.categories(id_category);

      ALTER TABLE ONLY metadata.entities_scopes
          ADD CONSTRAINT entities_scopes_id_entity_fkey FOREIGN KEY (id_entity) REFERENCES metadata.entities(id_entity);

      ALTER TABLE ONLY metadata.entities_scopes
          ADD CONSTRAINT entities_scopes_id_scope_fkey FOREIGN KEY (id_scope) REFERENCES metadata.scopes(id_scope) ON UPDATE CASCADE ON DELETE CASCADE;

      ALTER TABLE ONLY metadata.variables
          ADD CONSTRAINT variables_id_entity_fkey FOREIGN KEY (id_entity) REFERENCES metadata.entities(id_entity);

      ALTER TABLE ONLY metadata.variables_scopes
          ADD CONSTRAINT variables_scopes_id_entity_fkey FOREIGN KEY (id_entity) REFERENCES metadata.entities(id_entity);

      ALTER TABLE ONLY metadata.variables_scopes
          ADD CONSTRAINT variables_scopes_id_scope_fkey FOREIGN KEY (id_scope) REFERENCES metadata.scopes(id_scope) ON UPDATE CASCADE ON DELETE CASCADE;

      ALTER TABLE ONLY metadata.variables_scopes
          ADD CONSTRAINT variables_scopes_id_variable_fkey FOREIGN KEY (id_variable) REFERENCES metadata.variables(id_variable);
      ',
      t_owner);
      EXECUTE _ddl_qry;
    ELSE
      RAISE NOTICE 'metadata schema already exists';
    END IF;
  END;
  $$ LANGUAGE plpgsql;
