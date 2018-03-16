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
* Function to compute entitites map counters
*/

--TODO: rename function with urbo prefix

DROP FUNCTION IF EXISTS entitesMapCounters(text, text[], geometry, text, text);
DROP FUNCTION IF EXISTS entitesMapCounters(text, text[], geometry);
DROP TYPE IF EXISTS tEntitesMapCounters;
CREATE TYPE tEntitesMapCounters as (id_entity text, nfilter integer,nall integer);

CREATE OR REPLACE FUNCTION entitesMapCounters(scope text, entities text[], bbox geometry, start text, finish text)
  RETURNS setof tEntitesMapCounters AS
$$
DECLARE
  r tEntitesMapCounters;
  date_filter text;
  row RECORD;
  sql text;
BEGIN

  FOR row in SELECT table_name,id_entity
              FROM metadata.entities_scopes
              WHERE id_entity=ANY(entities)
              AND id_scope=scope
  LOOP

    sql = 'SELECT count(*) FROM '||scope||'.'||row.table_name||'_lastdata';
    EXECUTE sql INTO r.nall;

    r.id_entity = row.id_entity;

    IF start IS NOT NULL AND finish IS NOT NULL THEN 
      date_filter = FORMAT(' AND "TimeInstant" >= $2::timestamp AND "TimeInstant" < $3::timestamp', start, finish);
    ELSE 
      date_filter = '';
    END IF;

    IF bbox IS NOT NULL AND start IS NOT NULL AND finish IS NOT NULL THEN
      EXECUTE sql||' WHERE position && $1 AND "TimeInstant" >= $2::timestamp AND "TimeInstant" < $3::timestamp' INTO r.nfilter USING bbox, start, finish;
    ELSIF bbox IS NOT NULL THEN
      EXECUTE sql||' WHERE position && $1' INTO r.nfilter USING bbox;
    ELSIF start IS NOT NULL AND finish IS NOT NULL THEN
      EXECUTE sql||' WHERE "TimeInstant" >= $1::timestamp AND "TimeInstant" < $2::timestamp' INTO r.nfilter USING start, finish;
    ELSE
      r.nfilter = r.nall;
    END IF;

    return next r;

  END LOOP;
END;
$$ LANGUAGE plpgsql;
