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

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: dashboard_categories; Type: TABLE; Schema: public;
--

CREATE TABLE public.dashboard_categories (
    id_category character varying(255) NOT NULL,
    category_name character varying(255),
    category_colour character varying(10)
);


ALTER TABLE public.dashboard_categories OWNER TO :owner;

--
-- Name: dashboard_entities; Type: TABLE; Schema: public;
--

CREATE TABLE public.dashboard_entities (
    id_entity character varying(255) NOT NULL,
    entity_name character varying(255),
    id_category character varying(255),
    id_table character varying(255),
    icon character varying(255)
);


ALTER TABLE public.dashboard_entities OWNER TO :owner;

--
-- Name: dashboard_scopes; Type: TABLE; Schema: public;
--

CREATE TABLE public.dashboard_scopes (
    id_scope character varying(255) NOT NULL,
    scope_name character varying(255),
    geom public.geometry(Point,4326),
    zoom smallint,
    dbschema character varying(255),
    devices_map boolean DEFAULT true,
    parent_id_scope character varying(255)
);


ALTER TABLE public.dashboard_scopes OWNER TO :owner;

--
-- Name: dashboard_scopesentities; Type: TABLE; Schema: public;
--

CREATE TABLE public.dashboard_scopesentities (
    id_scope character varying(255),
    id_entity character varying(255)
);


ALTER TABLE public.dashboard_scopesentities OWNER TO :owner;

--
-- Name: dashboard_variables; Type: TABLE; Schema: public;
--

CREATE TABLE public.dashboard_variables (
    id_variable character varying(255) NOT NULL,
    id_entity character varying(255),
    entity_field character varying(255),
    var_name character varying(255),
    var_units character varying(255),
    var_thresholds double precision[],
    var_tempalarmvalue integer,
    var_tempalarmactive boolean,
    var_agg character varying[],
    var_reverse boolean
);


ALTER TABLE public.dashboard_variables OWNER TO :owner;

--
-- Name: frames_scope; Type: TABLE; Schema: public;
--

DROP TYPE IF EXISTS public.frame_type;
CREATE TYPE public.frame_type AS ENUM ('cityanalytics', 'scope', 'vertical');
-- create a new data_type to used for description_type column inside frame_types
DROP TYPE IF EXISTS public.descrip_type;
CREATE TYPE public.descrip_type AS ENUM ('text', 'image', 'iframe');
-- 

CREATE TABLE public.frames_scope (
    id bigint NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    description text,
    description_type public.descrip_type DEFAULT 'text' NOT NULL,
    source text,
    datatype text,
    scope_id character varying(255) NOT NULL,
    type public.frame_type DEFAULT 'cityanalytics'::public.frame_type NOT NULL,
    vertical character varying(255)
);


ALTER TABLE public.frames_scope OWNER TO :owner;

--
-- Name: frames_scope_id_seq; Type: SEQUENCE; Schema: public;
--

CREATE SEQUENCE public.frames_scope_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.frames_scope_id_seq OWNER TO :owner;

--
-- Name: frames_scope_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.frames_scope_id_seq OWNED BY public.frames_scope.id;


--
-- Name: migrations; Type: TABLE; Schema: public;
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


ALTER TABLE public.migrations OWNER TO :owner;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public;
--

CREATE SEQUENCE public.migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO :owner;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: subscriptions; Type: TABLE; Schema: public;
--

CREATE TABLE public.subscriptions (
    subs_id character varying(255) NOT NULL,
    id_name character varying(255),
    schema text
);


ALTER TABLE public.subscriptions OWNER TO :owner;

--
-- Name: tmp_import_incidences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tmp_import_incidences (
    latitude numeric,
    longitude numeric,
    incidencecode character varying(255) NOT NULL,
    category character varying(255),
    status_datetime timestamp without time zone,
    priority integer,
    jurisdiction character varying(50),
    status character varying(10),
    subject character varying(1000),
    id_entity character varying(50) NOT NULL
);


ALTER TABLE public.tmp_import_incidences OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public;
--

CREATE TABLE public.users (
    users_id bigint NOT NULL,
    name character varying(128) NOT NULL,
    surname character varying(256) NOT NULL,
    email character varying(256) NOT NULL,
    password character varying(64) NOT NULL,
    superadmin boolean NOT NULL,
    address text,
    telephone text,
    ldap boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO :owner;

--
-- Name: users_graph; Type: TABLE; Schema: public;
--

CREATE TABLE public.users_graph (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    parent integer,
    read_users bigint[] NOT NULL,
    write_users bigint[] NOT NULL
);


ALTER TABLE public.users_graph OWNER TO :owner;

--
-- Name: users_graph_id_seq; Type: SEQUENCE; Schema: public;
--

CREATE SEQUENCE public.users_graph_id_seq
    START WITH 2
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_graph_id_seq OWNER TO :owner;

--
-- Name: users_graph_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.users_graph_id_seq OWNED BY public.users_graph.id;


--
-- Name: users_tokens; Type: TABLE; Schema: public;
--

CREATE TABLE public.users_tokens (
    users_id bigint NOT NULL,
    token text NOT NULL,
    expiration timestamp without time zone NOT NULL
);


ALTER TABLE public.users_tokens OWNER TO :owner;

--
-- Name: users_users_id_seq; Type: SEQUENCE; Schema: public;
--

CREATE SEQUENCE public.users_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_users_id_seq OWNER TO :owner;

--
-- Name: users_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.users_users_id_seq OWNED BY public.users.users_id;


--
-- Name: frames_scope id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.frames_scope ALTER COLUMN id SET DEFAULT nextval('public.frames_scope_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: users users_id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.users ALTER COLUMN users_id SET DEFAULT nextval('public.users_users_id_seq'::regclass);


--
-- Name: users_graph id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.users_graph ALTER COLUMN id SET DEFAULT nextval('public.users_graph_id_seq'::regclass);


--
-- Name: dashboard_categories dashboard_categories_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.dashboard_categories
    ADD CONSTRAINT dashboard_categories_pkey PRIMARY KEY (id_category);


--
-- Name: dashboard_entities dashboard_entities_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.dashboard_entities
    ADD CONSTRAINT dashboard_entities_pkey PRIMARY KEY (id_entity);


--
-- Name: dashboard_scopes dashboard_scopes_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.dashboard_scopes
    ADD CONSTRAINT dashboard_scopes_pkey PRIMARY KEY (id_scope);


--
-- Name: dashboard_variables dashboard_variables_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.dashboard_variables
    ADD CONSTRAINT dashboard_variables_pkey PRIMARY KEY (id_variable);


--
-- Name: frames_scope frames_scope_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.frames_scope
    ADD CONSTRAINT frames_scope_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (subs_id);


--
-- Name: subscriptions subscriptions_scope_unique; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_scope_unique UNIQUE (subs_id, schema);


--
-- Name: users_graph users_graph_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.users_graph
    ADD CONSTRAINT users_graph_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (users_id);


--
-- Name: idx_scope_geom; Type: INDEX; Schema: public;
--

CREATE INDEX idx_scope_geom ON public.dashboard_scopes USING gist (geom);


--
-- Name: users_email_idx; Type: INDEX; Schema: public;
--

CREATE UNIQUE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_tokens users_tokens_users_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.users_tokens
    ADD CONSTRAINT users_tokens_users_id_fkey FOREIGN KEY (users_id) REFERENCES public.users(users_id);
