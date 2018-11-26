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

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: metadata; Type: SCHEMA; Schema: -; Owner: urbo_admin
--

CREATE SCHEMA metadata;


ALTER SCHEMA metadata OWNER TO :owner;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: categories; Type: TABLE; Schema: metadata; Owner: urbo_admin
--

CREATE TABLE metadata.categories (
    id_category character varying(255) NOT NULL,
    category_name character varying(255),
    nodata boolean DEFAULT false,
    config jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE metadata.categories OWNER TO :owner;

--
-- Name: categories_scopes; Type: TABLE; Schema: metadata; Owner: urbo_admin
--

CREATE TABLE metadata.categories_scopes (
    id_scope character varying(255) NOT NULL,
    id_category character varying(255) NOT NULL,
    category_name character varying(255),
    nodata boolean DEFAULT false,
    config jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE metadata.categories_scopes OWNER TO :owner;

--
-- Name: entities; Type: TABLE; Schema: metadata; Owner: urbo_admin
--

CREATE TABLE metadata.entities (
    id_entity character varying(255) NOT NULL,
    entity_name character varying(255),
    id_category character varying(255),
    table_name character varying(255),
    mandatory boolean DEFAULT false,
    editable boolean DEFAULT false
);


ALTER TABLE metadata.entities OWNER TO :owner;

--
-- Name: entities_scopes; Type: TABLE; Schema: metadata; Owner: urbo_admin
--

CREATE TABLE metadata.entities_scopes (
    id_scope character varying(255) NOT NULL,
    id_entity character varying(255) NOT NULL,
    entity_name character varying(255),
    id_category character varying(255),
    table_name character varying(255),
    mandatory boolean DEFAULT false,
    editable boolean DEFAULT false
);


ALTER TABLE metadata.entities_scopes OWNER TO :owner;

--
-- Name: scope_widgets_tokens; Type: TABLE; Schema: metadata; Owner: urbo_admin
--

CREATE TABLE metadata.scope_widgets_tokens (
    id_scope character varying(255) NOT NULL,
    id_widget character varying(255) NOT NULL,
    publish_name character varying(255) NOT NULL,
    token text NOT NULL,
    payload jsonb,
    id integer NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE metadata.scope_widgets_tokens OWNER TO :owner;

--
-- Name: scope_widgets_tokens_id_seq; Type: SEQUENCE; Schema: metadata; Owner: urbo_admin
--

CREATE SEQUENCE metadata.scope_widgets_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE metadata.scope_widgets_tokens_id_seq OWNER TO :owner;

--
-- Name: scope_widgets_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: metadata; Owner: urbo_admin
--

ALTER SEQUENCE metadata.scope_widgets_tokens_id_seq OWNED BY metadata.scope_widgets_tokens.id;


--
-- Name: scopes; Type: TABLE; Schema: metadata; Owner: urbo_admin
--

CREATE TABLE metadata.scopes (
    id_scope character varying(255) NOT NULL,
    scope_name character varying(255),
    geom public.geometry(Point,4326),
    zoom smallint,
    dbschema character varying(255),
    parent_id_scope character varying(255) DEFAULT NULL::character varying,
    status smallint DEFAULT 0,
    timezone character varying(255),
    user_scope_password character varying(255),
    config jsonb
);


ALTER TABLE metadata.scopes OWNER TO :owner;

--
-- Name: variables; Type: TABLE; Schema: metadata; Owner: urbo_admin
--

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
    type character varying(255) DEFAULT 'catalogue'::character varying,
    mandatory boolean DEFAULT false,
    editable boolean DEFAULT false
);


ALTER TABLE metadata.variables OWNER TO :owner;

--
-- Name: variables_scopes; Type: TABLE; Schema: metadata; Owner: urbo_admin
--

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
    type character varying(255) DEFAULT 'catalogue'::character varying,
    mandatory boolean DEFAULT false,
    editable boolean DEFAULT false
);


ALTER TABLE metadata.variables_scopes OWNER TO :owner;

--
-- Name: scope_widgets_tokens id; Type: DEFAULT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.scope_widgets_tokens ALTER COLUMN id SET DEFAULT nextval('metadata.scope_widgets_tokens_id_seq'::regclass);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id_category);


--
-- Name: categories_scopes categories_scopes_pkey; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.categories_scopes
    ADD CONSTRAINT categories_scopes_pkey PRIMARY KEY (id_scope, id_category);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id_entity);


--
-- Name: entities_scopes entities_scopes_pkey; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.entities_scopes
    ADD CONSTRAINT entities_scopes_pkey PRIMARY KEY (id_scope, id_entity);


--
-- Name: scope_widgets_tokens scope_widgets_tokens_id_scope_id_widget_publish_name_token_key; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.scope_widgets_tokens
    ADD CONSTRAINT scope_widgets_tokens_id_scope_id_widget_publish_name_token_key UNIQUE (id_scope, id_widget, publish_name, token);


--
-- Name: scope_widgets_tokens scope_widgets_tokens_pkey; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.scope_widgets_tokens
    ADD CONSTRAINT scope_widgets_tokens_pkey PRIMARY KEY (id);


--
-- Name: scopes scopes_dbschema_key; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.scopes
    ADD CONSTRAINT scopes_dbschema_key UNIQUE (dbschema);


--
-- Name: scopes scopes_pkey; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.scopes
    ADD CONSTRAINT scopes_pkey PRIMARY KEY (id_scope);


--
-- Name: variables variables_pkey; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.variables
    ADD CONSTRAINT variables_pkey PRIMARY KEY (id_variable);


--
-- Name: variables_scopes variables_scopes_pkey; Type: CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.variables_scopes
    ADD CONSTRAINT variables_scopes_pkey PRIMARY KEY (id_scope, id_entity, id_variable);


--
-- Name: idx_scope_geom; Type: INDEX; Schema: metadata; Owner: urbo_admin
--

CREATE INDEX idx_scope_geom ON metadata.scopes USING gist (geom);


--
-- Name: categories_scopes categories_scopes_id_category_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.categories_scopes
    ADD CONSTRAINT categories_scopes_id_category_fkey FOREIGN KEY (id_category) REFERENCES metadata.categories(id_category);


--
-- Name: categories_scopes categories_scopes_id_scope_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.categories_scopes
    ADD CONSTRAINT categories_scopes_id_scope_fkey FOREIGN KEY (id_scope) REFERENCES metadata.scopes(id_scope) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: entities entities_id_category_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.entities
    ADD CONSTRAINT entities_id_category_fkey FOREIGN KEY (id_category) REFERENCES metadata.categories(id_category);


--
-- Name: entities_scopes entities_scopes_id_category_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.entities_scopes
    ADD CONSTRAINT entities_scopes_id_category_fkey FOREIGN KEY (id_category) REFERENCES metadata.categories(id_category);


--
-- Name: entities_scopes entities_scopes_id_entity_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.entities_scopes
    ADD CONSTRAINT entities_scopes_id_entity_fkey FOREIGN KEY (id_entity) REFERENCES metadata.entities(id_entity);


--
-- Name: entities_scopes entities_scopes_id_scope_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.entities_scopes
    ADD CONSTRAINT entities_scopes_id_scope_fkey FOREIGN KEY (id_scope) REFERENCES metadata.scopes(id_scope) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: variables variables_id_entity_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.variables
    ADD CONSTRAINT variables_id_entity_fkey FOREIGN KEY (id_entity) REFERENCES metadata.entities(id_entity);


--
-- Name: variables_scopes variables_scopes_id_entity_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.variables_scopes
    ADD CONSTRAINT variables_scopes_id_entity_fkey FOREIGN KEY (id_entity) REFERENCES metadata.entities(id_entity);


--
-- Name: variables_scopes variables_scopes_id_scope_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.variables_scopes
    ADD CONSTRAINT variables_scopes_id_scope_fkey FOREIGN KEY (id_scope) REFERENCES metadata.scopes(id_scope) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: variables_scopes variables_scopes_id_variable_fkey; Type: FK CONSTRAINT; Schema: metadata; Owner: urbo_admin
--

ALTER TABLE ONLY metadata.variables_scopes
    ADD CONSTRAINT variables_scopes_id_variable_fkey FOREIGN KEY (id_variable) REFERENCES metadata.variables(id_variable);
