INSERT INTO metadata.variables
  (id_variable, id_entity, entity_field, var_name, var_units, var_thresholds, var_agg, var_reverse, config, table_name, type, mandatory, editable)
VALUES
  ('aq_cons.tank.location', 'aq_cons.tank', 'location', 'Localización del depósito', 'NULL', '{}', '{"NOAGG"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aq_cons.tank.capacity', 'aq_cons.tank', 'capacity', 'Capacidad', 'm³', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aq_cons.tank.min_level', 'aq_cons.tank', 'min_level', 'Nivel mínimo de llenado', 'm³', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aq_cons.tank.max_level', 'aq_cons.tank', 'max_level', 'Nivel máximo de llenado', 'm³', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aq_cons.tank.pump_flow', 'aq_cons.tank', 'pump_flow', 'Potencia de caudal', 'm³/h', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aq_cons.tank.pump_power', 'aq_cons.tank', 'pump_power', 'Potencia necesaria', 'MW', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aq_cons.tank.level', 'aq_cons.tank', 'level', 'Nivel de llenado', 'm³', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'aq_cons_tank_measurand', 'variable', TRUE, FALSE),
  ('aq_cons.tank.status', 'aq_cons.tank', 'status', 'Estado del depósito', 'NULL', '{}', '{"NOAGG"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'aq_cons_tank_agg_hour', 'aggregated', TRUE, FALSE),
  ('aq_cons.tank.electricity_consumption_agg', 'aq_cons.tank', 'electricity_consumption_agg', 'Consumo de electricidad', 'Kwh', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'aq_cons_tank_agg_hour', 'aggregated', TRUE, FALSE),
  ('aq_cons.tank.electricity_consumption_forecast', 'aq_cons.tank', 'electricity_consumption_forecast', 'Previsión de consumo de electricidad', 'Kwh', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'aq_cons_tank_agg_hour', 'aggregated', TRUE, FALSE);

INSERT INTO metadata.variables_scopes
  (id_scope, id_variable, id_entity, entity_field, var_name, var_units, var_thresholds, var_agg, var_reverse, config, table_name, type, mandatory, editable)
VALUES
  ('aljarafe', 'aq_cons.tank.location', 'aq_cons.tank', 'location', 'Localización del depósito', 'NULL', '{}', '{"NOAGG"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.capacity', 'aq_cons.tank', 'capacity', 'Capacidad', 'm³', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.min_level', 'aq_cons.tank', 'min_level', 'Nivel mínimo de llenado', 'm³', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.max_level', 'aq_cons.tank', 'max_level', 'Nivel máximo de llenado', 'm³', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.pump_flow', 'aq_cons.tank', 'pump_flow', 'Potencia de caudal', 'm³/h', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.pump_power', 'aq_cons.tank', 'pump_power', 'Potencia necesaria', 'MW', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'NULL', 'catalogue', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.level', 'aq_cons.tank', 'level', 'Nivel de llenado', 'm³', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'aq_cons_tank_measurand', 'variable', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.status', 'aq_cons.tank', 'status', 'Estado del depósito', 'NULL', '{}', '{"NOAGG"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'aq_cons_tank_agg_hour', 'aggregated', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.electricity_consumption_agg', 'aq_cons.tank', 'electricity_consumption_agg', 'Consumo de electricidad', 'Kwh', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'aq_cons_tank_agg_hour', 'aggregated', TRUE, FALSE),
  ('aljarafe', 'aq_cons.tank.electricity_consumption_forecast', 'aq_cons.tank', 'electricity_consumption_forecast', 'Previsión de consumo de electricidad', 'Kwh', '{}', '{"SUM", "AVG", "MIN", "MAX"}', FALSE, '{"active": true, "widget": "variable", "default": true}', 'aq_cons_tank_agg_hour', 'aggregated', TRUE, FALSE);

