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
--
-- Determine the Quantile classifications from a numeric array
--
-- @param in_array A numeric array of numbers to determine the best
--            bins based on the Quantile method.
--
-- @param breaks The number of bins you want to find.
--  
--
CREATE OR REPLACE FUNCTION CDB_QuantileBins ( in_array NUMERIC[], breaks INT) RETURNS NUMERIC[] as $$ 
DECLARE 
    element_count INT4; 
    break_size numeric;
    tmp_val numeric; 
    i INT := 1; 
    reply numeric[]; 
BEGIN 
    -- sort our values
    SELECT array_agg(e) INTO in_array FROM (SELECT unnest(in_array) e ORDER BY e ASC) x;
    -- get the total size of our data
    element_count := array_length(in_array, 1); 
    break_size :=  element_count::numeric / breaks;
    -- slice our bread
    LOOP  
        IF i < breaks THEN
            IF break_size * i % 1 > 0 THEN
                SELECT e INTO tmp_val FROM ( SELECT unnest(in_array) e LIMIT 1 OFFSET ceil(break_size * i) - 1) x;
            ELSE
                SELECT avg(e) INTO tmp_val FROM ( SELECT unnest(in_array) e LIMIT 2 OFFSET ceil(break_size * i) - 1 ) x;
            END IF;
        ELSIF i = breaks THEN
            -- select the last value
            SELECT max(e) INTO tmp_val FROM ( SELECT unnest(in_array) e ) x;
        ELSE
            EXIT;
        END IF;

        reply = array_append(reply, tmp_val);
        i := i+1;
    END LOOP;
    RETURN reply;
END; 
$$ language plpgsql IMMUTABLE;
