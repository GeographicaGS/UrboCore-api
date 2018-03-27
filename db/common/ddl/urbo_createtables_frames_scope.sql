-- CATALOGUE
CREATE TABLE IF NOT EXISTS public.frames_scope (
	id bigint PRIMARY KEY,
	title text NOT NULL,
	url text NOT NULL,
	description text,
	source text,
	datatype text,
	type boolean DEFAULT FALSE NOT NULL, -- TRUE: vertical assigned
	vertical character varying(255),
	scope_id character varying(255) NOT NULL
);