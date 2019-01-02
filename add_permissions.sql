INSERT INTO users_graph (name, parent, read_users, write_users)
VALUES ('aq_cons.tank', 425, '{1}'::bigint[], '{1}'::bigint[]);

INSERT INTO users_graph (name, parent, read_users, write_users)
VALUES
('aq_cons.tank.location', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.capacity', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.min_level', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.max_level', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.pump_flow', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.pump_power', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.level', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.status', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.electricity_consumption_agg', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]),
('aq_cons.tank.electricity_consumption_forecast', (SELECT id from users_graph where name = 'aq_cons.tank'), '{1}'::bigint[], '{1}'::bigint[]);
