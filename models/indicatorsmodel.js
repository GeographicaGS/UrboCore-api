// Copyright 2017 Telefónica Digital España S.L.
// 
// This file is part of UrboCore API.
// 
// UrboCore API is free software: you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// UrboCore API is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
// General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with UrboCore API. If not, see http://www.gnu.org/licenses/.
// 
// For those usages not covered by this license please contact with
// iot_support at tid dot es

'use strict';

var PGSQLModel = require('./pgsqlmodel.js');
var util = require('util');
var utils = require('../utils');

var log = utils.log();

class IndicatorsModel extends PGSQLModel {
  constructor(cfg) {
    super(cfg);
  }

  get this() {
    return this;
  }

  getIndicatorsList(opts) {
    var sql = 'SELECT config->>\'id_prefix\' AS prefix FROM metadata.variables_scopes ' +
      `WHERE id_scope = '${opts.scope}' AND id_variable = '${opts.category}.indicators.value';`;

    return this.promise_query(sql)

    .then(function(data) {
      return this.promiseRow(data)  // TODO: Think of returning a 404 if it fails
    }.bind(this))

    .then(function(data) {
      var filterDataIndicator = '';
      var filterNameIndicator = '';
      if (opts.indicatorId) {
        filterDataIndicator = ` AND id_entity = '${data.prefix}${opts.indicatorId}'`;
        filterNameIndicator = ` WHERE id_entity = '${data.prefix}${opts.indicatorId}'`;
      }


      var order = ' ORDER BY _name_query.id_entity';
      var period = '';
      var condition = '=';
      if (opts.last) {
        order = ' ORDER BY _data_query.period DESC';
        period = ', _data_query.period';
        condition = '<=';
      }

      var sql = 'WITH _data_query as (SELECT id_entity, value, penalty_bonus, period ' +
                    `FROM ${opts.scope}.${opts.category}_indicators ` +
                      `WHERE to_timestamp(period, 'YYYYMM') ${condition} '${opts.start}'::timestamp${filterDataIndicator}), ` +
                  `_name_query as (SELECT id, id_entity, name_${opts.language}, periodicity_${opts.language} ` +
                    `FROM ${opts.scope}.${opts.category}_indicators_names` +
                      `${filterNameIndicator} ORDER BY id) ` +
                `SELECT _name_query.id_entity, _name_query.name_${opts.language} AS name, _data_query.value, ` +
                    `_data_query.penalty_bonus, _name_query.periodicity_${opts.language} AS periodicity${period} ` +
                  'FROM _name_query LEFT JOIN _data_query ' +
                    'ON _data_query.id_entity = _name_query.id_entity ' +
                  `WHERE to_timestamp(_data_query.period, 'YYYYMM') ${condition} '${opts.start}'::timestamp` +
                  `${order};`;

      return this.cachedQuery(sql);
    }.bind(this))

    .then(function(data) {
      if (opts.indicatorId) {
        data = data.rows[0];

      } else {
        data = data.rows;
      }

      return Promise.resolve(data);
    })

    .catch(function(error) {
      log.error(error);
      return Promise.reject(error);
    });
  }

  getPeriodsList(opts) {
    var sql = 'SELECT json_build_object(\'value\', array_agg(period)) AS periods FROM (SELECT period ' +
      `FROM ${opts.scope}.${opts.category}_indicators GROUP BY period ` +
      'ORDER BY period ASC) q;';

    return this.promise_query(sql)

    .then(function(data) {
      return this.promiseRow(data)  // TODO: Think of returning a 404 if it fails
    }.bind(this))

    .catch(function(error) {
      log.error(error);
      return Promise.reject(error);
    });
  }

}

module.exports = IndicatorsModel;
