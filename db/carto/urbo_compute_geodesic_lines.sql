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
* Function to compute geodesic lines.
*
*/

--------------------------------------------------------------------------------
-- HOW TO USE:
--
-- SELECT urbo_compute_geodesic_line(
--     ST_SetSRID(ST_MakePoint(-6.0, 37.0), 4326), 
--     ST_SetSRID(ST_MakePoint(-120.0, 42.0), 4326)
--   );
--
-- Test solving antimeridian problem:
-- SELECT urbo_compute_geodesic_line(
--     ST_SetSRID(ST_MakePoint(-80.0, 37.0), 4326), 
--     ST_SetSRID(ST_MakePoint(120.0, 42.0), 4326)
--   );
--------------------------------------------------------------------------------


DROP FUNCTION IF EXISTS urbo_compute_geodesic_line(
    geometry(Point,4326), geometry(Point,4326), float
  );

CREATE OR REPLACE FUNCTION urbo_compute_geodesic_line(
    point_src geometry(Point,4326), 
    point_dst geometry(Point,4326),
    max_segm_len float DEFAULT 10000
  )
  RETURNS geometry AS
  $$
  DECLARE
    _gc geometry;
    _result geometry;
    _antimeridian text;
    _lng_rng double precision;
  BEGIN
  
    _antimeridian = 'LINESTRING(180 90, 180 -90)';

    EXECUTE format('
      SELECT 
          ST_Segmentize(
            ST_Makeline(
              %L, %L
            )::geography, %s
        )::geometry as great_circle
      ', point_src, point_dst, max_segm_len)
    INTO
      _gc;
      
    _lng_rng = ST_XMax(_gc) - ST_XMin(_gc);
    
    -- RAISE NOTICE '%', _lng_rng;
    
    IF _lng_rng > 180.0 then
      EXECUTE format('
        SELECT 
          ST_Difference(
            ST_ShiftLongitude( %L::geometry ),
            ST_Buffer(
              ST_GeomFromText(%L, 4326), 0.00001)
          ) as great_circle
        ', _gc, _antimeridian)
      INTO
        _gc;
    END IF;
    
    EXECUTE format('
      SELECT 
        ST_Transform(
          %L::geometry, 3857
      ) as great_circle
      ', _gc)
    INTO
      _result;

    RETURN _result;

  END;
  $$ LANGUAGE plpgsql IMMUTABLE;







