/*
* Script to load all PL/PgSQL functions
*/

-- Entities functions
\ir common/urbo_entities.sql

-- Generic map functions
\ir common/CDB_JenksBins.sql
\ir common/CDB_QuantileBins.sql
\ir common/urbo_utils.sql
\ir common/urbo_size_row.sql

-- Users graph
\ir common/urbo_create_graph_for_scope.sql

-- Carto
-- CARTO \ir carto/urbo_compute_geodesic_lines.sql
-- CARTO \ir carto/urbo_get_user_tables.sql

-- DDL
\ir common/ddl/urbo_categories_ddl.sql
-- \ir common/ddl/urbo_droptables_fromcategory.sql  -- Helper function for development
