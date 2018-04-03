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

DROP TYPE IF EXISTS frame_type;
CREATE TYPE frame_type AS ENUM ('cityanalytics', 'scope', 'vertical');
CREATE TABLE IF NOT EXISTS public.frames_scope (
	id bigint PRIMARY KEY,
	title text NOT NULL,
	url text NOT NULL,
	description text,
	source text,
	datatype text,
	type frame_type DEFAULT 'cityanalytics' NOT NULL, -- TRUE: vertical assigned
	vertical character varying(255),
	scope_id character varying(255) NOT NULL
);
