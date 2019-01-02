/*
 * Function to detetects leak besed on rules
 */

--------------------------------------------------------------------------------
-- HOW TO USE:
-- SELECT urbo_aq_cons_leak_detection('aljarafe', '2018-01-22T07:00:00.000Z');
--------------------------------------------------------------------------------

DROP TYPE IF EXISTS aq_cons_rule;

CREATE TYPE aq_cons_rule AS (
  consumption double precision,
  pressure double precision,
  time double precision,
  status integer
);

DROP TYPE IF EXISTS aq_cons_sector_data;

CREATE TYPE aq_cons_sector_data AS (
  id_entity character varying(64),
  consumption double precision,
  consumption_forecast double precision,
  pressure double precision,
  pressure_forecast double precision
);

DROP FUNCTION IF EXISTS urbo_aq_cons_leak_detection(varchar, timestamp);

CREATE OR REPLACE FUNCTION urbo_aq_cons_leak_detection(
  id_scope varchar,
  moment timestamp
)
RETURNS void AS
$$
DECLARE
  _q text;
  _r record;
  _rule aq_cons_rule;
  _sector_data aq_cons_sector_data;
  _t_rules text;
  _t_const_sector_agg_hour text;
  _tb_leak_historic_sector text;
  _t_aq_cons_sector_lastdata text;
  _t_aq_cons_sector_measurand text;
  _increase_consumption double precision;
  _increase_pressure double precision;
  _consumption_rule_result boolean;
  _pressure_rule_result boolean;
  _leak_status JSON;
  _key text;
  _rule_description text;
BEGIN

  _t_rules := urbo_get_table_name(id_scope, 'aq_aux_leak_rules');
  _t_const_sector_agg_hour := urbo_get_table_name(id_scope, 'aq_cons_sector_agg_hour');
  _t_aq_cons_sector_lastdata := urbo_get_table_name(id_scope, 'aq_cons_sector_lastdata');
  _tb_leak_historic_sector := urbo_get_table_name(id_scope, 'aq_cons_sector_leak_historic');
  _t_aq_cons_sector_measurand := urbo_get_table_name(id_scope, 'aq_cons_sector_measurand');
  _leak_status = '{}'::json;

  _q := format('
    SELECT consumption, pressure, time, status FROM %s
  ', _t_rules)
  ;
  FOR _rule IN EXECUTE _q
  LOOP
    _q := format('
      SELECT id_entity, SUM(consumption) as consumption, SUM(forecast) as consumption_forecast, AVG(pressure_agg) as pressure, AVG(pressure_forecast) as pressure_forecast
        FROM %s
        WHERE "TimeInstant" > ''%s''::timestamp - interval ''%s second''
        AND "TimeInstant" <= ''%s''::timestamp
        GROUP BY id_entity
    ', _t_const_sector_agg_hour, moment, _rule.time, moment)
    ;

    FOR _sector_data IN EXECUTE _q
    LOOP

      _increase_consumption := (_sector_data.consumption - _sector_data.consumption_forecast) / _sector_data.consumption_forecast * 100;
      _increase_pressure := (_sector_data.pressure - _sector_data.pressure_forecast) / _sector_data.pressure_forecast * 100;

      _q := format('
          SELECT urbo_aq_cons_leak_check_rule(%s, %s)
      ', COALESCE(_rule.consumption::text, 'NULL'), COALESCE(_increase_consumption::text, 'NULL'));
      EXECUTE _q INTO _consumption_rule_result;

      _q := format('
          SELECT urbo_aq_cons_leak_check_rule(%s, %s)
      ', COALESCE(_rule.pressure::text, 'NULL'), COALESCE(_increase_pressure::text, 'NULL'));
      EXECUTE _q INTO _pressure_rule_result;

      IF _consumption_rule_result AND _pressure_rule_result
      THEN
        IF _leak_status->>_sector_data.id_entity IS NULL OR
          GREATEST((_leak_status->_sector_data.id_entity->>'status')::integer, _rule.status) = _rule.status
        THEN
          _rule_description :=
            (CASE WHEN _rule.status = 1 THEN 'Anomalía' ELSE 'Fuga' END) || ' detectada debido a ' ||
            (CASE WHEN _rule.consumption IS NOT NULL THEN (CASE WHEN _rule.consumption > 0 THEN 'un aumento del consumo en un ' ELSE 'una disminución del consumo en un ' END) || @_rule.consumption || '%' ELSE ''  END) ||
            (CASE WHEN _rule.consumption IS NOT NULL AND _rule.pressure IS NOT NULL THEN ' y a ' ELSE '' END) ||
            (CASE WHEN _rule.pressure IS NOT NULL THEN (CASE WHEN _rule.pressure > 0 THEN 'un aumento de la presión en un ' ELSE 'una disminución de la presión en un ' END) || @_rule.pressure || '%' ELSE ''  END)
            ;

          _leak_status := _leak_status::jsonb || format('{"%s":{"status":%s, "description":"%s"}}', _sector_data.id_entity, _rule.status, _rule_description)::jsonb;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  FOR _key IN SELECT * FROM json_object_keys(_leak_status)
  LOOP
    _q := format('
      UPDATE %s SET leak_status=%s, leak_rule=''%s'' WHERE id_entity=''%s'';
    ', _t_aq_cons_sector_lastdata, _leak_status->_key->>'status', _leak_status->_key->>'description', _key);
    EXECUTE _q;

    _q := format('
      INSERT INTO %s (id_entity, "TimeInstant", leak_status, leak_rule) VALUES(''%s'', ''%s'', %s, ''%s'');
    ', _tb_leak_historic_sector, _key, moment, _leak_status->_key->>'status', _leak_status->_key->>'description');
    EXECUTE _q;

  END LOOP;

END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS urbo_aq_cons_leak_check_rule(double precision, double precision);

CREATE OR REPLACE FUNCTION urbo_aq_cons_leak_check_rule(
  rule double precision,
  value double precision
)
RETURNS boolean AS
$$
BEGIN
  IF rule IS NULL OR (
    (rule < 0 AND value <= rule) OR
    (rule > 0 AND value >= rule)
  )
  THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

