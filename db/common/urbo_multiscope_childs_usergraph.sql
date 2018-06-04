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
--  SELECT urbo_multiscope_childs_usergraph('juntadeandalucia', 133);
--
-- SELECT urbo_categories_usergraph('juntadeandalucia', 133);
--------------------------------------------------------------------------------



DROP FUNCTION IF EXISTS urbo_multiscope_childs_usergraph(text, integer, boolean);

CREATE OR REPLACE FUNCTION urbo_multiscope_childs_usergraph(
  id_multiscope text,
  id_user integer,
  is_superadmin boolean DEFAULT FALSE
  )
  RETURNS SETOF text AS
  $$
    WITH RECURSIVE multiscope_childs(id_scope) AS (
      SELECT
        sc.id_scope
      FROM metadata.scopes sc
      JOIN public.users_graph ug ON (
      sc.id_scope=ug.name
      AND (TRUE = $3 OR
        ($2 = ANY(ug.read_users)
        OR $2 = ANY(ug.write_users))
      )
    ) WHERE sc.parent_id_scope = $1
    )
    SELECT id_scope::text FROM multiscope_childs;

$$ LANGUAGE sql;


DROP FUNCTION IF EXISTS urbo_categories_usergraph(text, integer, boolean,
  boolean);

CREATE OR REPLACE FUNCTION urbo_categories_usergraph(
  id_scope text,
  id_user integer,
  is_parent boolean DEFAULT FALSE,
  is_superadmin boolean DEFAULT FALSE
  )
  RETURNS SETOF text AS
  $$
    WITH RECURSIVE multiscope_childs(id_category, id_scope) AS (
      SELECT
        DISTINCT ON (cs.id_category)
          cs.id_category, cs.id_scope
      FROM metadata.categories_scopes cs
      JOIN public.users_graph ug ON (
      cs.id_category=ug.name
      AND (TRUE = $4 OR
        ($2 = ANY(ug.read_users)
        OR $2 = ANY(ug.write_users))
      )
    ) WHERE cs.id_scope = ANY(
        CASE WHEN $3 THEN array(
           SELECT sp.id_scope::text
           FROM metadata.scopes sp
           WHERE sp.parent_id_scope = $1
        )
        ELSE array(SELECT $1) END
      )
    )
    SELECT id_category::text FROM multiscope_childs;

$$ LANGUAGE sql;
