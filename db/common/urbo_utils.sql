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
