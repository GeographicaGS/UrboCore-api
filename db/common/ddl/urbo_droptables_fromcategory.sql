/*
* Function to drop all tables for a category in a given schema.
*
*/

--------------------------------------------------------------------------------
-- HOW TO USE:
-- PgSQL: 
    -- SELECT urbo_droptables_from_category('calvia', 'lighting');
-- Carto: 
    -- SELECT urbo_droptables_from_category('carto-account', 'lighting', 'calvia', TRUE)
--------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS urbo_droptables_from_category(text, text, text, boolean);

CREATE OR REPLACE FUNCTION urbo_droptables_from_category(
  schemaname text,
  category text,
  id_scope text DEFAULT NULL, --only use if iscarto=TRUE
  iscarto boolean DEFAULT FALSE
  )
  RETURNS setof text AS
  $$
  DECLARE
    _tb text;
    _tb_prefix text;
  BEGIN
    IF iscarto IS TRUE then
      _tb_prefix = format('%s_%s_',id_scope,category);
    ELSE
      _tb_prefix = format('%s_',category);
    END IF;

    FOR _tb IN EXECUTE format('SELECT table_name
          FROM   information_schema.tables
          WHERE  table_schema = %L
          AND    table_name LIKE ''%s%%'' ',
          schemaname, _tb_prefix)
      LOOP
        EXECUTE format('DROP TABLE %I.%s CASCADE',
          schemaname, _tb);

        RETURN NEXT _tb;

      END LOOP;

  END;
  $$ LANGUAGE plpgsql;
