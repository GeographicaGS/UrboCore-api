
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
