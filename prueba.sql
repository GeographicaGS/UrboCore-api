/*
 * Function to calculate AquaGIS Consuption or Forecast in constructions or sectors.
 */

--------------------------------------------------------------------------------
-- HOW TO USE:
-- SELECT urbo_aq_cons_agg_realtime_hourly('scope', '2018-01-16T08:00:00.000Z');
-- SELECT urbo_aq_cons_agg_realtime_hourly('scope', '2018-01-16T08:00:00.000Z', FALSE);
-- SELECT urbo_aq_cons_agg_realtime_hourly('scope', '2018-01-16T08:00:00.000Z', TRUE);
--------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS urbo_aq_cons_agg_realtime_hourly(varchar, timestamp, boolean);

CREATE OR REPLACE FUNCTION urbo_aq_cons_agg_realtime_hourly(
    id_scope varchar,
    moment timestamp,
    on_conflict boolean DEFAULT FALSE  -- IF FALSE THEN UPDATE
  )
  RETURNS void AS
  $$
  DECLARE
    _t_const_ld text;
    _t_const_ms text;
	_t_plot_ms text;
	_t_sector_ms text;
    _t_const_ag text;
    _t_plot_ld text;
    _t_plot_ag text;
    _t_sector_ag text;
    _t_aux_ft text;
    _t_aux_lk text;
    _q_const text;
    _q_plot text;
    _q_sector text;
    _q text;
    _update text;
    _update_columns text;
    _update_where text;
    _insert_into text;
    _insert_columns text;
    _insert_on_conflict text;
  BEGIN

    _t_const_ld  := urbo_get_table_name(id_scope, 'aq_cons_const', FALSE, TRUE);
    _t_const_ms := urbo_get_table_name(id_scope, 'aq_cons_const_measurand');
    _t_const_ag := urbo_get_table_name(id_scope, 'aq_cons_const_agg_hour');

    _t_plot_ld  := urbo_get_table_name(id_scope, 'aq_cons_plot', FALSE, TRUE);
    _t_plot_ms := urbo_get_table_name(id_scope, 'aq_cons_plot_measurand');
    _t_plot_ag := urbo_get_table_name(id_scope, 'aq_cons_plot_agg_hour');

    _t_sector_ag := urbo_get_table_name(id_scope, 'aq_cons_sector_agg_hour');
    _t_sector_ms := urbo_get_table_name(id_scope, 'aq_cons_sector_measurand');

    _t_aux_ft := urbo_get_table_name(id_scope, 'aq_aux_const_futu');
    _t_aux_lk := urbo_get_table_name(id_scope, 'aq_aux_leak');

    _q_const := format('
      -- CONSTRUCTION
      SELECT id_entity, ''%s''::timestamp AS "TimeInstant",
          AVG(flow) AS consumption, AVG(pressure) AS pressure_agg
        FROM %s
        WHERE "TimeInstant" >= ''%s''
          AND "TimeInstant" < ''%s''::timestamp + interval ''1 hour''
        GROUP BY id_entity
      ',
      moment,
      _t_const_ms, moment, moment
    );
    
    
    _q_plot := format('
      -- PLOT
      SELECT id_entity, ''%s''::timestamp AS "TimeInstant",
          AVG(flow) AS consumption, AVG(pressure) AS pressure_agg
        FROM %s
        WHERE "TimeInstant" >= ''%s''
          AND "TimeInstant" < ''%s''::timestamp + interval ''1 hour''
        GROUP BY id_entity
      ',
      moment,
      _t_plot_ms, moment, moment
    );
    
    
    _q_sector := format('
      -- SECTOR
      SELECT id_entity, ''%s''::timestamp AS "TimeInstant",
          AVG(flow) AS consumption, AVG(pressure) AS pressure_agg
        FROM %s
        WHERE "TimeInstant" >= ''%s''
          AND "TimeInstant" < ''%s''::timestamp + interval ''1 hour''
        GROUP BY id_entity
      ',
      moment,
      _t_sector_ms, moment, moment
    );

    _update := 'UPDATE';

    _update_columns := 'qu SET
          consumption = qs.consumption,
          pressure_agg = qs.pressure_agg
        FROM (';

    _update_where := format(
      ') qs
        WHERE qu."TimeInstant" >= ''%s''
          AND qu."TimeInstant" < ''%s''::timestamp + interval ''1 hour''
          AND qu.id_entity = qs.id_entity AND qu."TimeInstant" = qs."TimeInstant"
      ',
      moment, moment
    );

    _insert_into := 'INSERT INTO';

    _insert_columns := '(id_entity, "TimeInstant", consumption, pressure_agg)';

    _insert_on_conflict := 'ON CONFLICT (id_entity, "TimeInstant")
        DO UPDATE SET
          consumption = EXCLUDED.consumption,
          pressure_agg = EXCLUDED.pressure_agg';

    IF on_conflict IS TRUE THEN
      _q_const := format('
        %s
        %s
        %s
        %s
        %s;
        ',
        _insert_into, _t_const_ag, _insert_columns, _q_const, _insert_on_conflict
      );

      _q_plot := format('
        %s
        %s
        %s
        %s
        %s;
        ',
        _insert_into, _t_plot_ag, _insert_columns, _q_plot, _insert_on_conflict
      );

      _q_sector := format('
        %s
        %s
        %s
        %s
        %s;
        ',
        _insert_into, _t_sector_ag, _insert_columns, _q_sector, _insert_on_conflict
      );

    ELSE
    _q_const := format('
      %s
      %s
      %s
      %s
      %s;
      ',
      _update, _t_const_ag, _update_columns, _q_const, _update_where
    );

    _q_plot := format('
      %s
      %s
      %s
      %s
      %s;
      ',
      _update, _t_plot_ag, _update_columns, _q_plot, _update_where
    );

    _q_sector := format('
      %s
      %s
      %s
      %s
      %s;
      ',
      _update, _t_sector_ag, _update_columns, _q_sector, _update_where
    );

    END IF;

    _q := format('
      %s
      %s
      %s',
      _q_const, _q_plot, _q_sector
    );

    EXECUTE _q;

  END;
  $$ LANGUAGE plpgsql;

