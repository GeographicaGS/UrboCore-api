/*
* Several functions:
*     - Function to create all tables for a category in a given scope.
*       This function creates the category in metadata tables for the given scope.
*     - Function to check if a table exists in a given scope.
*     - Function to check if an array of tables exists in a given scope.
*     - Function to drop all tables for a category in a given scope.
*
*/

--------------------------------------------------------------------------------
-- HOW TO USE:
-- SELECT urbo_categories_ddl('calvia', 'lighting', 'Iluminación');
--------------------------------------------------------------------------------


DROP FUNCTION IF EXISTS urbo_categories_ddl(text, text, text, boolean, boolean, text);

CREATE OR REPLACE FUNCTION urbo_categories_ddl(
  id_scope text,
  category text,
  category_name text,
  isdebug boolean DEFAULT FALSE,
  iscarto boolean DEFAULT FALSE,
  cartouser text DEFAULT NULL
  )
  RETURNS void AS
  $$
  DECLARE
    _ddl_qry text;
  BEGIN

    IF iscarto IS TRUE then
      _ddl_qry = format('
        SELECT urbo_createtables_%s(%L, ''%s'', ''%s'', %L);',
        category,id_scope, isdebug, iscarto, cartouser);

    ELSE
      _ddl_qry = format('
        SET client_encoding = ''UTF8'';

        INSERT INTO metadata.categories_scopes
          (id_scope, id_category, category_name,config)
          VALUES
          (%L, %L, %L,
            (select jsonb_set(config,''{carto}'',(select config->''carto'' from metadata.scopes where id_scope=%L))
            from metadata.categories where id_category=%L)
          );

        INSERT INTO metadata.entities_scopes (SELECT DISTINCT %L, e.* FROM metadata.entities e where id_category=''%s'');
        INSERT INTO metadata.variables_scopes (SELECT DISTINCT %L, v.* FROM metadata.variables v where id_entity like ''%s%%'');

        SELECT urbo_createtables_%s(%L, ''%s'');',
        id_scope, category, category_name,
        id_scope, category,
        id_scope, category,
        id_scope, category,
        category,id_scope, isdebug);


    END IF;

    IF isdebug IS TRUE then
      RAISE NOTICE '%', _ddl_qry;
    END IF;

    EXECUTE _ddl_qry;

  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_checktable_ifexists(text, text);

CREATE OR REPLACE FUNCTION urbo_checktable_ifexists(
  id_scope text,
  tablename text
  )
  RETURNS int AS
  $$
  DECLARE
    _result int;
  BEGIN
    EXECUTE format('SELECT 1
       FROM   information_schema.tables
       WHERE  table_schema = %L
       AND    table_name = %L',
       id_scope, tablename)
    INTO
      _result;

    RETURN _result;
  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_checktable_ifexists_arr(text, text[], boolean);

CREATE OR REPLACE FUNCTION urbo_checktable_ifexists_arr(
  id_scope text,
  tablenames_arr text[],
  remove_sch_from_tb boolean DEFAULT FALSE
  )
  RETURNS int AS
  $$
  DECLARE
    _tb text;
    _result int;
  BEGIN

    FOREACH _tb IN ARRAY tablenames_arr
      LOOP
        IF remove_sch_from_tb then
          _tb = replace(_tb, format('%s.',id_scope), '');
        END IF;

        _result = urbo_checktable_ifexists(id_scope, _tb);
        --RAISE NOTICE '%', _result;

        IF _result = 1 then
          RETURN _result;
        END IF;
      END LOOP;

    RETURN _result;
  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_cartodbfy_tables_qry(text, text[]);

CREATE OR REPLACE FUNCTION urbo_cartodbfy_tables_qry(
  cartouser text,
  _tb_arr text[]
  )
  RETURNS text AS
  $$
  DECLARE
    _tb text;
    _stm text;
    _cartodbfy text;
  BEGIN
    FOREACH _tb IN ARRAY _tb_arr
      LOOP
        _stm = format(
          'SELECT CDB_Cartodbfytable(%L, %L);',
          cartouser, _tb
        );
        _cartodbfy = concat(_cartodbfy, _stm);
      END LOOP;

    RETURN _cartodbfy;

  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_geom_idx_qry(text, text[]);

CREATE OR REPLACE FUNCTION urbo_geom_idx_qry(
  _geom_fld text,
  _tb_arr text[]
  )
  RETURNS text AS
  $$
  DECLARE
    _tb text;
    _stm text;
    _pg_geom_idx text;
  BEGIN
    FOREACH _tb IN ARRAY _tb_arr
      LOOP
        _stm = format(
          'CREATE INDEX IF NOT EXISTS %s_gidx ON %s
            USING gist (%s);',
          replace(_tb, '.', '_'), _tb, _geom_fld
        );
        _pg_geom_idx = concat(_pg_geom_idx, _stm);
      END LOOP;

    RETURN _pg_geom_idx;

  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_pk_qry(text[]);

CREATE OR REPLACE FUNCTION urbo_pk_qry(
  _tb_arr text[]
  )
  RETURNS text AS
  $$
  DECLARE
    _tb text;
    _stm text;
    _pg_pk text;
  BEGIN
    FOREACH _tb IN ARRAY _tb_arr
      LOOP
        _stm = format(
          'ALTER TABLE %s ADD COLUMN id bigserial NOT NULL;
           ALTER TABLE ONLY %s
               ADD CONSTRAINT %s_pk PRIMARY KEY (id);',
          _tb, _tb, replace(_tb, '.', '_')
        );
        _pg_pk = concat(_pg_pk, _stm);
      END LOOP;

    RETURN _pg_pk;

  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_tbowner_qry(text[], text);

CREATE OR REPLACE FUNCTION urbo_tbowner_qry(
  _tb_arr text[],
  _tb_owner text DEFAULT 'urbo_admin'
  )
  RETURNS text AS
  $$
  DECLARE
    _tb text;
    _stm text;
    _pg_tbowner text;
  BEGIN
    FOREACH _tb IN ARRAY _tb_arr
      LOOP
        _stm = format(
          'ALTER TABLE %s OWNER TO %s;',
          _tb, _tb_owner
        );
        _pg_tbowner = concat(_pg_tbowner, _stm);
      END LOOP;

    RETURN _pg_tbowner;

  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_time_idx_qry(text[]);

CREATE OR REPLACE FUNCTION urbo_time_idx_qry(
  _tb_arr text[]
  )
  RETURNS text AS
  $$
  DECLARE
    _tb text;
    _stm text;
    _time_idx text;
  BEGIN
    FOREACH _tb IN ARRAY _tb_arr
      LOOP
        _stm = format(
          'ALTER TABLE ONLY %s
              ADD CONSTRAINT %s_unique UNIQUE (id_entity, "TimeInstant");

          CREATE INDEX IF NOT EXISTS %s_tm_idx
              ON %s USING btree ("TimeInstant");',
          _tb, replace(_tb, '.', '_'), replace(_tb, '.', '_'), _tb
        );
        _time_idx = concat(_time_idx, _stm);
      END LOOP;

    RETURN _time_idx;

  END;
  $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION urbo_unique_lastdata_qry(
  _tb_arr text[]
  )
  RETURNS text AS
  $$
  DECLARE
    _tb text;
    _stm text;
    _unique_ld text;
  BEGIN
    FOREACH _tb IN ARRAY _tb_arr
      LOOP
        _stm = format(
          'ALTER TABLE ONLY %s
              ADD CONSTRAINT %s_ld_unique UNIQUE (id_entity);',
          _tb, replace(_tb, '.', '_')
        );
        _unique_ld = concat(_unique_ld, _stm);
      END LOOP;

    RETURN _unique_ld;

  END;
  $$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS urbo_indicators_qry(text, text);

CREATE OR REPLACE FUNCTION urbo_indicators_qry(
  tb_indic text,
  tb_indic_nm text
  )
  RETURNS text AS
  $$
  DECLARE
    _indicators_tb text;
  BEGIN

    _indicators_tb = format('
      CREATE TABLE IF NOT EXISTS %s (
          id bigint NOT NULL,
          bonus_max double precision,
          description text,
          indicatortype text,
          name text,
          penalty_bonus double precision,
          penalty_max double precision,
          performed_detail text,
          period text,
          periodicity text,
          update_date timestamp without time zone,
          value double precision,
          id_entity character varying(64) NOT NULL,
          created_at timestamp without time zone DEFAULT timezone(''utc''::text, now()),
          updated_at timestamp without time zone DEFAULT timezone(''utc''::text, now())
      );

      CREATE TABLE IF NOT EXISTS %s (
          id integer NOT NULL,
          description_es text,
          periodicity_es text,
          name_es text,
          description_en text,
          periodicity_en text,
          name_en text,
          id_entity character varying(64) NOT NULL
      );

      ALTER TABLE ONLY %s
          ADD CONSTRAINT %s_pk PRIMARY KEY (id);

      ALTER TABLE ONLY %s
          ADD CONSTRAINT %s_pk PRIMARY KEY (id);

      ALTER TABLE %s OWNER TO urbo_admin;

      ALTER TABLE %s OWNER TO urbo_admin;

      CREATE INDEX %s_idx
          ON %s USING btree (update_date);
      ', tb_indic, tb_indic_nm, tb_indic,
      replace(tb_indic, '.', '_'), tb_indic_nm,
      replace(tb_indic_nm, '.', '_'), tb_indic,
      tb_indic_nm, replace(tb_indic, '.', '_'), tb_indic
    );

    RETURN _indicators_tb;

  END;
  $$ LANGUAGE plpgsql;
