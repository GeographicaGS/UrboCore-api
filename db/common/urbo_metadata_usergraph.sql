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
--  SELECT urbo_metadata_usergraph('doshermanas', 133);
--------------------------------------------------------------------------------



DROP FUNCTION IF EXISTS urbo_metadata_usergraph(text, integer, boolean);

CREATE OR REPLACE FUNCTION urbo_metadata_usergraph(
  id_scope text,
  id_user integer,
  is_superadmin boolean DEFAULT FALSE
  )
  RETURNS SETOF record AS
  $$
      WITH RECURSIVE search_graph(id,name) AS
      (
        SELECT
          id,
          name
        FROM users_graph WHERE id IN (
          SELECT
            g.id
          FROM metadata.scopes s JOIN public.users_graph g
          ON s.id_scope=g.name
          WHERE (
            s.parent_id_scope IS NOT NULL
            AND s.parent_id_scope != 'orphan'
            AND s.parent_id_scope = $1)
          OR g.name = $1)
        UNION ALL
        SELECT
          ug.id,
          ug.name
          FROM search_graph sg
          INNER JOIN users_graph ug ON ug.parent=sg.id
          WHERE TRUE = $3 OR (
            $2 = ANY(ug.read_users)
            OR $2 = ANY(ug.write_users)
          )
      )
      SELECT
        id_category as id,
        category_name as name,
        nodata,
        category_config as config,
        json_agg(
          json_build_object(
            'id', id_entity,
            'name', entity_name,
            'mandatory', entity_mandatory,
            'editable', entity_editable,
            'table', entity_table_name,
            'variables', variables
          )
        ) as entities
      FROM (
        SELECT
          mdt.category_name,
          mdt.id_category,
          mdt.nodata,
          mdt.category_config,
          mdt.id_entity,
          mdt.entity_name,
          mdt.entity_mandatory,
          mdt.entity_table_name,
          mdt.entity_editable,
          array_remove(array_agg(
            CASE
              WHEN mdt.id_variable IS NOT NULL THEN
                jsonb_build_object(
                  'id', mdt.id_variable,
                  'id_entity', mdt.id_entity,
                  'name', mdt.var_name,
                  'units', mdt.var_units,
                  'var_thresholds', mdt.var_thresholds,
                  'var_agg', mdt.var_agg,
                  'reverse', mdt.var_reverse,
                  'mandatory', mdt.var_mandatory,
                  'editable', mdt.var_editable,
                  'table_name', mdt.table_name
                )
              ELSE NULL
            END
          ), NULL) as variables
        FROM search_graph sg
        JOIN (
          SELECT DISTINCT
            c.category_name,
            c.id_category,
            c.nodata,
            c.config AS category_config,
            (CASE
                WHEN v.table_name IS NULL THEN e.table_name
                ELSE v.table_name
              END) AS table_name,
            e.id_entity,
            e.entity_name,
            e.mandatory AS entity_mandatory,
            e.table_name AS entity_table_name,
            e.editable AS entity_editable,
            v.id_variable AS id_variable,
            v.var_name,
            v.var_units,
            v.var_thresholds,
            v.var_agg,
            v.var_reverse,
            v.mandatory AS var_mandatory,
            v.editable AS var_editable,
            v.entity_field AS column_name,
            v.config
          FROM metadata.scopes s
          LEFT JOIN metadata.categories_scopes c
            ON c.id_scope = s.id_scope
          LEFT JOIN metadata.entities_scopes e
            ON e.id_category = c.id_category AND e.id_scope = s.id_scope
          LEFT JOIN metadata.variables_scopes v
            ON v.id_entity = e.id_entity AND v.id_scope = s.id_scope
          WHERE s.id_scope = $1
        ) mdt ON (sg.name = mdt.id_variable OR (mdt.id_variable IS NULL AND sg.name=mdt.id_entity))
        GROUP BY mdt.category_name, mdt.id_category, mdt.nodata,
        mdt.category_config, mdt.id_entity, mdt.entity_name,
        mdt.entity_mandatory, mdt.entity_editable, mdt.entity_table_name
      ) _e GROUP BY id_category, category_name, nodata, category_config;

$$ LANGUAGE sql;
