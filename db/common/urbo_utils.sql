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

DROP FUNCTION IF EXISTS urbo_get_table_name(text,text,boolean,boolean);
DROP FUNCTION IF EXISTS urbo_get_table_name(text,text,boolean,boolean,boolean);

CREATE OR REPLACE FUNCTION urbo_get_table_name(id_scope text, table_name text, iscarto boolean DEFAULT FALSE,
  lastdata boolean default FALSE,view boolean default FALSE)
  RETURNS text AS
  $$
  DECLARE
    _sep char;
    _resp text;
  BEGIN

    IF iscarto THEN
      _sep = '_';
    ELSE
      _sep = '.';
    END IF;

    _resp = id_scope||_sep||table_name;

    IF lastdata THEN
      _resp = _resp||'_lastdata';
    END IF;

    IF view THEN
      _resp = _resp||'_view';
    END IF;

    RETURN _resp;
  END;
  $$ LANGUAGE plpgsql;

--select urbo_get_table_name('distrito_telefonica','pe-moraleja-01',true,true);

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


DROP FUNCTION IF EXISTS create_scope_dbuser(text, text);
CREATE OR REPLACE FUNCTION create_scope_dbuser(id_scope text, user_password text) RETURNS void AS $$
DECLARE
  scope_user text := format('%I_user', id_scope);
BEGIN

  EXECUTE format('
    CREATE ROLE %1$I WITH LOGIN PASSWORD %2$L;
    GRANT CONNECT ON DATABASE urbo TO %1$I;
    GRANT USAGE ON SCHEMA %3$I TO %1$I;
    GRANT SELECT ON ALL TABLES IN SCHEMA %3$I TO %1$I;
    GRANT INSERT ON ALL TABLES IN SCHEMA %3$I TO %1$I;
				 ', scope_user, user_password, id_scope);

END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS delete_scope_dbuser(text, text);
CREATE OR REPLACE FUNCTION delete_scope_dbuser(id_scope text) RETURNS void AS $$
DECLARE
  scope_user text := format('%I_user', id_scope);
BEGIN

  EXECUTE format('
    REVOKE ALL PRIVILEGES ON DATABASE urbo FROM %1$I;
    REVOKE ALL PRIVILEGES ON SCHEMA %2$I FROM %1$I;
    DROP ROLE %1$I;
				 ', scope_user, id_scope);

END;
$$ LANGUAGE plpgsql;
