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
\ir common/urbo_last_agg.sql

-- Users graph
\ir common/urbo_create_graph_for_scope.sql

-- Carto
-- CARTO \ir carto/urbo_compute_geodesic_lines.sql
-- CARTO \ir carto/urbo_get_user_tables.sql

-- DDL
\ir common/ddl/urbo_categories_ddl.sql
\ir common/ddl/urbo_createtables_frames_scope.sql
-- \ir common/ddl/urbo_droptables_fromcategory.sql  -- Helper function for development
