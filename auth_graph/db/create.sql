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

CREATE TABLE users
(
  users_id bigserial not null,
  name character varying(128) not null,
  surname character varying(256) not null,
  email character varying(256) not null,
  password character varying(64) not null,
  superadmin boolean not null,
  address text,
  telephone text,
  PRIMARY KEY (users_id)
);
ALTER TABLE users OWNER TO :owner;
CREATE UNIQUE index users_email_idx ON users(email);

CREATE TABLE users_tokens
(
  users_id bigint not null references users(users_id),
  token text not null,
  expiration timestamp not null
);
ALTER TABLE users_tokens OWNER TO :owner;

CREATE TABLE users_graph
(
  id serial not null,
  name character varying(64) not null,
  parent integer,
  read_users bigint[] not null,
  write_users bigint[] not null
);
ALTER TABLE users_graph OWNER TO :owner;

DROP FUNCTION IF EXISTS users_graph_node_op(integer, bigint, text, text);
CREATE OR REPLACE FUNCTION users_graph_node_op(node_id integer, user_id bigint, mode text, op text) RETURNS void AS $$
DECLARE
  nodes integer[];
BEGIN

  if mode!='read' and mode!='write' then
    RAISE EXCEPTION 'Unsupported mode'
    USING HINT = 'Please use mode ''read'' or ''write''';
    return;
  end if;

  if op!='add' and op!='rm' then
    RAISE EXCEPTION 'Unsupported operation'
    USING HINT = 'Please use operation ''add'' or ''rm''';
    return;
  end if;


    -- Children all around AND multi

    nodes := array(WITH RECURSIVE search_graph(id, name) AS
    (
      SELECT
        id, name FROM users_graph WHERE id IN
        (
          SELECT
            g.id
          FROM metadata.scopes s RIGHT JOIN public.users_graph g
          ON s.id_scope=g.name
          WHERE (
            s.parent_id_scope IS NOT NULL
            AND s.parent_id_scope!='orphan'
            AND parent_id_scope=(select name from public.users_graph where id=node_id))
            OR (g.name=(select name from public.users_graph where id=node_id)
                AND g.parent=(select parent from public.users_graph where id=node_id))
        )
      UNION ALL
      SELECT
        ug.id, ug.name
        FROM search_graph sg
        INNER JOIN users_graph ug ON ug.parent=sg.id
    )
    SELECT DISTINCT id FROM search_graph order by id);


  -- RAISE NOTICE '%', nodes;

  IF op = 'add' THEN
    -- APPEND parents only of adding
    -- parents
    -- MULTi Scope permissions going up when adding
    nodes := nodes ||
      array(WITH RECURSIVE search_graph(id,parent) AS (
          SELECT id,parent FROM users_graph WHERE id IN
          (
            SELECT
              g.id
            FROM metadata.scopes s JOIN public.users_graph g
            ON (s.id_scope=g.name AND
            (g.id=node_id OR
            g.id=(
              SELECT id
              FROM public.users_graph
              WHERE name=(SELECT parent_id_scope FROM public.users_graph ug join metadata.scopes us on ug.name=us.id_scope where id=node_id)))
            )
          )
          UNION ALL
          SELECT
            ug.id,
            ug.parent
          FROM search_graph sg INNER JOIN users_graph ug
          ON ug.id=sg.parent
        )
        SELECT id FROM search_graph);
  END IF;

  -- remove duplicates
  nodes := uniq(sort(nodes));

  -- raise notice '%', nodes;

  if op = 'add' then
    if mode = 'read' then
      UPDATE users_graph set read_users=read_users||user_id
      WHERE not user_id=ANY(read_users) AND id=ANY(nodes);
    elsif mode = 'write' then
      UPDATE users_graph set write_users=write_users||user_id
      WHERE not user_id=ANY(write_users) AND id=ANY(nodes);
    end if;
  elsif op = 'rm' then
    if mode = 'read' then
      raise notice 'here';
      UPDATE users_graph set read_users=array_remove(read_users,user_id) WHERE id=ANY(nodes);
    elsif mode = 'write' then
      UPDATE users_graph set write_users=array_remove(write_users,user_id) WHERE id=ANY(nodes);
    end if;
  end if;
END;
$$ LANGUAGE plpgsql;


INSERT INTO users_graph VALUES (1,'root',null,array[]::bigint[],array[]::bigint[]);
