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
-- Name: logs_registry; Type: SCHEMA; Schema: -;
--

CREATE SCHEMA logs_registry;


ALTER SCHEMA logs_registry OWNER TO :owner;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: user_weblogs; Type: TABLE; Schema: logs_registry;
--

CREATE TABLE logs_registry.user_weblogs (
    id_userlog bigint NOT NULL,
    url text,
    user_ip text,
    id_user bigint NOT NULL,
    timeinstant timestamp without time zone
);


ALTER TABLE logs_registry.user_weblogs OWNER TO :owner;

--
-- Name: user_weblogs_id_userlog_seq; Type: SEQUENCE; Schema: logs_registry;
--

CREATE SEQUENCE logs_registry.user_weblogs_id_userlog_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE logs_registry.user_weblogs_id_userlog_seq OWNER TO :owner;

--
-- Name: user_weblogs_id_userlog_seq; Type: SEQUENCE OWNED BY; Schema: logs_registry;
--

ALTER SEQUENCE logs_registry.user_weblogs_id_userlog_seq OWNED BY logs_registry.user_weblogs.id_userlog;


--
-- Name: user_weblogs id_userlog; Type: DEFAULT; Schema: logs_registry;
--

ALTER TABLE ONLY logs_registry.user_weblogs ALTER COLUMN id_userlog SET DEFAULT nextval('logs_registry.user_weblogs_id_userlog_seq'::regclass);


--
-- Name: user_weblogs id_userlog_pkey; Type: CONSTRAINT; Schema: logs_registry;
--

ALTER TABLE ONLY logs_registry.user_weblogs
    ADD CONSTRAINT id_userlog_pkey PRIMARY KEY (id_userlog);


--
-- Name: user_weblogs_time_idx; Type: INDEX; Schema: logs_registry;
--

CREATE INDEX user_weblogs_time_idx ON logs_registry.user_weblogs USING btree (timeinstant);
