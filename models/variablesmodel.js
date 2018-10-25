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

var util = require('util');
var _ = require('underscore');
var PGSQLModel = require('./pgsqlmodel');
var MetadataInstanceModel = require('./metadatainstancemodel');
var EntityModel = require('./entitiesmodel');
var cons = require('../cons.js');
var utils = require('../utils');
var modelutils = require('./modelutils.js');
var QueryBuilder = require('../protools/querybuilder');
var HistFormatter = require('../protools/histformatter');
var VariablesFormatter = require('../protools/variablesformatter');
var DummyFormatter = require('../protools/dummyformatter');
var RankingFormatter = require('../protools/rankingformatter');
var log = utils.log();
var _ = require('underscore');

function VariablesModel(cfg) {
  PGSQLModel.call(this,cfg);
}

util.inherits(VariablesModel, PGSQLModel);

VariablesModel.prototype.getVariableAgg = function(opts,cb) {
  var metadata = new MetadataInstanceModel();
  metadata.getVariableForAgg(opts.scope, opts.id_var, (function(err, d) {
    if (err) {
      log.error('Cannot execute sql query');
      cb(err);
    }
    var bbox_filter;
    if (opts.bbox) {
      bbox_filter = 'AND position && ST_MakeEnvelope('+opts.bbox+', 4326)';
    }

    var select = null;
    if (Array.isArray(opts.agg)) {
      select = 'json_build_object(';
      for (var agg of opts.agg) {
        select += `'${agg}', ${agg}(var), `
      }
      select = select.slice(0, -2) + ')';

    } else {
      select = `${opts.agg}(var)`;
    }

    var sql = ['WITH',
      'tempfilter_h AS (SELECT id_entity,',d.rows[0].entity_field,'as var',
      'FROM', d.rows[0].dbschema+'.'+d.rows[0].table_name,
      'WHERE "TimeInstant" >= $1 AND "TimeInstant" < $2',
      bbox_filter,')',
      'SELECT',select,'as value FROM tempfilter_h'];

    this.cachedQuery(sql.join(' '),[opts.start,opts.finish],function(err,data) {
      if (err) {
        log.error('Cannot execute sql query');
        log.error(sql);
        cb(err);
      }
      else if (!data.rows.length) {
        log.debug('No rows returned from query');
        log.debug(sql);
        cb(null,null);
      } else {

        cb(null,data.rows[0])
      }
    });
  }).bind(this));
}

VariablesModel.prototype.getVariablesTimeSerie = function(opts) {
  var metadata = new MetadataInstanceModel();
  return metadata
    .getVarQueryArrayMultiEnt(opts.scope, opts.id_vars.join(','))
    .then((data)=>{
      return this.promiseRow(data);
    })
    .then(function(d) {
      var qb = new QueryBuilder(opts);
      // var filter = `${qb.bbox()} ${qb.filter()}`;
      //
      // // UGLY HACK
      // filter = filter.replace('position', 'foo.position');

      var aggs = opts.agg;
      var bodyVarIds = opts.id_vars;
      var step = modelutils.getSQLFormattedStep(opts.step);

      var schema = d.dbschema;
      var tableNames = d.tablenames;
      var entityTables = d.entitytables;
      var varNames = d.vars;
      var varIds = d.vars_ids;

      // Group by feature
      var groupBy = null;
      var groupTable = null;
      if (opts.filters.group && varIds.indexOf(opts.filters.group) >= 0) {
        var i = varIds.indexOf(opts.filters.group);
        var entityTable = entityTables.splice(i, 1)[0];
        groupBy = varNames.splice(i, 1)[0];
        groupTable = tableNames.splice(i, 1)[0];
        varIds.splice(i, 1);

        if (groupTable === entityTable) {
          groupTable = groupTable + '_lastdata';
        }
      }

      if (bodyVarIds.indexOf(opts.filters.group) >= 0) {
        var i = bodyVarIds.indexOf(opts.filters.group);
        bodyVarIds.splice(i, 1);
      }

      // Adding the varIds (and their varNames and tableNames) that may have disappeared because they are repeated
      var missingVarIds = JSON.parse(JSON.stringify(bodyVarIds));
      for (var varId of varIds) {
        var i = missingVarIds.indexOf(varId);
        missingVarIds.splice(i, 1);
      }

      for (var missingVarId of missingVarIds) {
        var i = varIds.indexOf(missingVarId);

        tableNames.push(tableNames[i]);
        entityTables.push(entityTables[i]);
        varNames.push(varNames[i]);
        varIds.push(varIds[i]);
      }

      // Ordering the aggs according to the query result
      var aggsCopy = JSON.parse(JSON.stringify(aggs));
      aggs = _.map(varIds, function(varId) {
        var i = bodyVarIds.indexOf(varId);
        var agg = aggsCopy[i];

        bodyVarIds.splice(i, 1);
        aggsCopy.splice(i, 1);

        return agg;
      });

      var promises = [varIds, aggs];
      for (var i in varNames) {
        promises.push((function() {
          var groupColumn = '';
          var groupAlias = '';
          var cGroupAlias = '';
          var from = `${ schema }.${ tableNames[i] }`;

          if (groupBy && groupTable !== tableNames[i]) {
            groupColumn = `"${ groupBy }"`;
            groupAlias = `"${ opts.filters.group }"`;
            cGroupAlias = `, ${ groupAlias }`
            from = `(
                SELECT l."TimeInstant" as "TimeInstant", l.id_entity, l."${ varNames[i] }", r.${ groupColumn } AS ${ groupAlias }
                  FROM ${ schema }.${ tableNames[i] } l
                    LEFT JOIN ${ schema }.${ entityTable + '_lastdata' /* TODO: Use groupTable when variable is an aggretagated one: groupTable */ } r
                      ON l.id_entity = r.id_entity
              )`;
          }

          var sql = `
            WITH filtered AS (
               SELECT
                 DISTINCT id_entity
               FROM ${schema}.${entityTables[i]}_lastdata
               WHERE true
               ${qb.bbox()}
               ${qb.filter()}
            )
            SELECT
              _timeserie AS start,
              (_timeserie + '${step}')::timestamp AS finish,
              ${aggs[i]}(foo."${varNames[i]}") AS "${varIds[i]}_${aggs[i]}"${ cGroupAlias }
            FROM generate_series('${opts.start}'::timestamp, '${opts.finish}'::timestamp, '${ step }') AS _timeserie
            LEFT JOIN ${ from } foo
            ON foo."TimeInstant" >= _timeserie AND foo."TimeInstant" < _timeserie + '${ step }'
            WHERE id_entity IN (SELECT id_entity FROM filtered)
            GROUP BY _timeserie${ cGroupAlias } ORDER BY _timeserie`;

          if (opts.findTimes && (aggs[i] === 'MIN' || aggs[i] === 'MAX')) {
            var preSQL = `
              SELECT
                baz.start,
                baz.finish,
                baz."${varIds[i]}_${aggs[i]}",
                array_agg(quz."TimeInstant") AS times${ cGroupAlias } FROM (
            `;

            var postSQL = `
                ) baz
                JOIN ${ from } quz
                ON quz."TimeInstant" >= baz.start AND quz."TimeInstant" < baz.finish
                WHERE baz."${varIds[i]}_${aggs[i]}" = quz."${varNames[i]}"
                GROUP BY baz.start, baz.finish, baz."${varIds[i]}_${aggs[i]}"${ cGroupAlias }
                ORDER BY baz.start`;

            sql = `${preSQL} ${sql} ${postSQL}`;
          }

          return this.cachedQuery(sql);

        }).bind(this)());
      }

      if (groupBy) {
        promises.push(opts.filters.group);
      }

      return Promise.all(promises);
    }.bind(this))

    .then(function(data) {
      return new VariablesFormatter().timeSerie(data);
    })
    .catch(function(err) {
      return Promise.reject(err);
    });
};

VariablesModel.prototype.addVariable = function(scope, data, cb) {

  var model = new EntityModel();
  model.getCategoriesForEntity(scope, data.id_entity, (function(err, d) {
    var category = d.rows[0].id_category;

    var thresholds = 'NULL';
    if (Array.isArray(data.var_thresholds)) {
      if (data.var_thresholds[0] != null) {
        thresholds = 'ARRAY[' + data.var_thresholds.join(',') + ']::double precision[]';
      }
    }

    var table_name = d.rows[0].table_name;
    if ('table_name' in data) {
      table_name = data.table_name;
    }

    var baseQry = 'INSERT INTO metadata.variables_scopes (id_scope, id_variable, id_entity, entity_field, var_name, var_units, var_thresholds, var_agg, var_reverse, config, table_name, type) VALUES ';
    var values = {
      id_scope: '\'' + scope + '\'',
      id_variable: '\'' + data.id + '\'',
      id_entity: '\'' + data.id_entity + '\'',
      entity_field: '\'' + data.column + '\'',
      name: '\'' + data.name + '\'',
      units: '\'' + data.units + '\'',
      var_thresholds: thresholds,
      var_agg: 'ARRAY[\'' + data.var_agg.join('\',\'') + '\']',
      var_reverse: data.reverse,
      config: '\'' + JSON.stringify(data.config) + '\'',
      table_name: '\'' + table_name + '\'',
      type: '\'' + data.type + '\''
    }
    var rawValues = _.values(values).join(',');
    var insertQry = baseQry + '(' + rawValues + ')';

    try {
      this.query(insertQry, null, function(err, d) {
        if (err) return cb(err);
        return cb(null, {id: data.id});
      });
    }
    catch (e) {
      return cb(e);
    }

  }).bind(this));

}

VariablesModel.prototype.updateVariable = function(scope, id_variable, data, cb) {

  var baseQry = ['UPDATE metadata.variables_scopes SET'];
  var updateClause = [];

    // Explicit validator and processor for updates
  if ('name' in data) {
    updateClause.push('var_name=\''+data.name+'\'');
  }
  if ('id_entity' in data) {
      // updateClause.push("geom=")
    updateClause.push('id_entity=\'' + data.id_entity + '\'');
  }
  if ('units' in data) {
    updateClause.push('var_units=\'' + data.units + '\'');
  }
  if ('var_thresholds' in data) {
    var thresholds = 'NULL';
    if (Array.isArray(data.var_thresholds)) {
      if (data.var_thresholds[0] != null) {
        thresholds = 'ARRAY[' + data.var_thresholds.join(',') + ']::double precision[]';
      }
    }
    updateClause.push('var_thresholds=' + thresholds);
  }
    // Database UNIQUE Should handle dups
  if ('var_agg' in data) {
    updateClause.push('var_agg=ARRAY[\'' + data.var_agg.join('\',\'') + '\']');
  }

  if ('table' in data) {
    updateClause.push('entity_field=\'' + data.table + '\'');
  }

  if ('reverse' in data) {
    updateClause.push('var_reverse=' + data.reverse);
  }

  if ('config' in data) {
    updateClause.push('config=\'' + JSON.stringify(data.config) + '\'');
  }


  if ('type' in data) {
    updateClause.push('type=\'' + data.type + '\'');
  }

  if ('table_name' in data) {
    updateClause.push('table_name=\'' + data.table_name + '\'');
  }

  baseQry.push(updateClause.join(','));
  baseQry.push('WHERE id_scope=\''+scope+'\' AND id_variable=\'' + id_variable + '\'');


  try {
    this.query(baseQry.join(' '), null, function(err, d) {
      if (err) return cb(err);
      return cb(null, { status: 'ok' });
    });
  }
  catch (e) {
    return cb(e);

  }
}

VariablesModel.prototype.deleteVariable = function(scope, id_variable, cb) {
  var dropQ = 'DELETE FROM metadata.variables_scopes where id_scope=\''+scope+'\' AND id_variable=\''+id_variable+'\'';
  this.uq(dropQ, cb);
}


VariablesModel.prototype.deleteVariablesForEntity = function(opts, cb) {
  var dropQ = 'DELETE FROM metadata.variables_scopes where id_scope=\''+opts.scope+'\' AND id_entity IN (\''+opts.id_entities.join('\', \'')+'\')';
  return this.promise_query(dropQ)
  .then(function(d) {
    if (cb) return cb(null, d);
    return Promise.resolve(d);
  })
  .catch(function(err) {
    if (cb) return cb(err);
    return Promise.reject(err);
  });
}


VariablesModel.prototype.getVariableDevicesGroupTimeSerie = function(opts) {
  var metadata = new MetadataInstanceModel();
  return metadata.getVarQueryArray(opts.scope, opts.id_var)
  .then((function(data) {
    return this.promiseRow(data);
  }).bind(this))
  .then((function(d) {

    var qb = new QueryBuilder(opts);
    var bbox_filter = qb.bbox();

    var tm_step = modelutils.getSQLFormattedStep(opts.step);

    var variable = d.vars[0];
    var qtablename = d.dbschema+'.'+d.table_name;

    var qavgsel = '';
    var qavgjoin = '';
    var qavggrpby = '';
    if (opts.groupagg) {
      qavgsel = [',_vaggqry as (',
        util.format('SELECT __time_serie as start,(__time_serie+\'%s\')::timestamp as finish,',tm_step),
        util.format('%s(%s) as tot_avg FROM ',opts.agg,variable),
        util.format('generate_series(\'%s\'::timestamp,\'%s\'::timestamp,\'%s\') as __time_serie',opts.start,opts.finish,tm_step),
        'LEFT JOIN _bqry ON _bqry."TimeInstant" >= __time_serie AND "TimeInstant"',
        util.format('< __time_serie+\'%s\'',tm_step),
        'GROUP BY __time_serie)'].join(' ');
      qavgjoin = ['LEFT JOIN _vaggqry ON _vaggqry.start=_vqry.start'];
      qavggrpby = ',_vaggqry.tot_avg';
    }

    var sql;
    sql = ['WITH _bqry as (',
      util.format('SELECT "TimeInstant",%s,id_entity FROM %s WHERE "TimeInstant"',variable,qtablename),
      util.format('>= \'%s\'::timestamp AND', opts.start),
      '"TimeInstant"',
      util.format('< \'%s\'::timestamp %s),',opts.finish,bbox_filter),
      '_vqry as (',
      util.format('SELECT __time_serie as start,(__time_serie+\'%s\')::timestamp as finish,',tm_step),
      util.format('%s(%s)as avg_dev,id_entity FROM ',opts.agg,variable),
      util.format('generate_series(\'%s\'::timestamp,\'%s\'::timestamp,\'%s\') as __time_serie',opts.start,opts.finish,tm_step),
      'LEFT JOIN _bqry ON _bqry."TimeInstant" >= __time_serie AND "TimeInstant"',
      util.format('< __time_serie+\'%s\'',tm_step),
      'WHERE id_entity IS NOT NULL GROUP BY __time_serie,id_entity)',qavgsel,
      'SELECT _vqry.start as time, array_agg(_vqry.id_entity) as id_ent,',
      util.format('array_agg(_vqry.avg_dev) as ent_avg %s FROM _vqry %s',qavggrpby,qavgjoin),
      util.format('GROUP BY _vqry.start %s ORDER BY _vqry.start',qavggrpby)];

    return this.cachedQuery(sql.join(' '), null);
  }).bind(this))
    .then(function(dqr) {
      return Promise.resolve(dqr.rows);
    })
    .then(function(dq) {
      return new VariablesFormatter().timeSerieDevGroup(dq);
    })
    .catch(function(err) {
      return Promise.reject(err);
    });
}


VariablesModel.prototype.getVariablesDiscreteHistogramNow = function(opts) {
  var metadata = new MetadataInstanceModel();
  var varQueryVars = [opts.id];
  if (opts.subVariable) {
    varQueryVars.push(opts.subVariable);
  }
  return metadata.getVarQueryArray(opts.scope, varQueryVars)
    .then((function(data) {
      return this.promiseRow(data);
    }).bind(this))
    .then(function(d) {
      var data = {};
      data.ranges = opts.ranges;

      // Rich data
      var actualTable = opts.scope + '.' + d.now;
      opts.table = actualTable.split('.')[1];

      /*
      * getVarQueryArray's result does not respect the input array's
      * order, we must check if the first element is the variable
      * obtained from the id parameter in the URL
      */
      if (opts.subVariable && d.vars_ids[0] !== opts.id[0]) {
        let t_var = d.vars[1];
        let t_var_id = d.vars_ids[1]
        d.vars[1] = d.vars[0];
        d.vars_ids[1] = d.vars_ids[0];
        d.vars[0] = t_var;
        d.vars_ids[0] = t_var_id;
      }

      opts.raw = d;


      var promises = [];

      // Check if we have the sub ranges and the desired variable

      if (opts.subRanges && opts.subVariable) {
        promises.push(function() {
          var qb = new QueryBuilder(opts);
          return qb
            .select(d.vars[0], 'category')
            .select(d.vars[1], 'sub_category')
            .count(d.vars[0], 'value')
            .from(actualTable)
            .condition()
            .then(qb.group)
            .then(function(plainSQL) {
              return Promise.resolve(plainSQL);
            })
            .catch(function(err) {
              log.error(err);
              return Promise.reject(err);
            });
        }());
      } else {
        /*
        SELECT d.entity_field as category, count(d.entity_field) as total from ${actualTable}
        */
        promises.push(function() {
          var qb = new QueryBuilder(opts);
          return qb
            .select(d.vars[0],  'category')
            .count(d.vars[0], 'value')
            .from(actualTable)
            .condition()
            .then(qb.group)
            .then(function(plainSQL) {
              return Promise.resolve(plainSQL);
            })
            .catch(function(err) {
              log.error(err);
              return Promise.reject(err);
            });
        }());
      }

      // If totals, repeat query without filtering
      if (opts.totals) {
        promises.push(function() {
          var qb = new QueryBuilder(opts);
          return qb
            .select(d.vars[0],  'category')
            .count(d.vars[0], 'total')
            .from(actualTable)
            .nocondition()
            .then(qb.group)
            .then(function(plainSQL) {
              return Promise.resolve(plainSQL);
            })
            .catch(function(err) {
              log.error(err);
              return Promise.reject(err);
            });
        }());
      }

      data.SQLs = [];
      return Promise.all(promises).then(function(sqls) {
        for (var sql of sqls) {
          data.SQLs.push(sql);
        }
        return Promise.resolve(data);
      });

    })
    .then((function(data) {
      var promises = [];
      for (var sql of data.SQLs) {
        promises.push((function() {
          return this.promise_query(sql, null);
        }).bind(this)());
      }

      return Promise.all(promises).then(function(results) {
        data.results = results;
        if (opts.subRanges && opts.subVariable) {
          data.subRanges = opts.subRanges;
        }
        return Promise.resolve(data);
      });

    }).bind(this))
    .then(function(data) {
      return Promise.resolve(data);
    })
    .then(new HistFormatter().formatDiscrete)
    .catch(function(err) {
      return Promise.reject(err);
    });
}

VariablesModel.prototype.getVariablesContinuousHistogramNow = function(opts, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getVarQuery(opts.scope, opts.id)
  .then((function(data) {
    return this.promiseRow(data);
  }).bind(this))
  .then(function(d) {


    var data = {};
    data.ranges = opts.ranges;

    // Rich data
    var actualTable = opts.scope + '.' + d.now;
    opts.table = actualTable.split('.')[1];
    opts.raw = d;

    var promises = [];
    promises.push(function() {
      var qb = new QueryBuilder(opts);
      return qb
      .select(d.entity_field)
      .from(actualTable)
      .condition()
      .then(qb.group)
      .then(function(plainSQL) {
        return Promise.resolve(plainSQL);
      })
      .catch(function(err) {
        log.error('Error');
        log.error(err);
        return Promise.reject(err);
      });
    }());



    // If totals, repeat query without filtering
    if (opts.totals) {
      promises.push(function() {
        var qb = new QueryBuilder(opts);
        return qb
        .select(d.entity_field)
        .from(actualTable)
        .nocondition()
        .then(qb.group)
        .then(function(plainSQL) {
          return Promise.resolve(plainSQL);
        })
        .catch(function(err) {
          log.error('Error');
          log.error(err);
          return Promise.reject(err);
        });
      }());
    }

    data.SQLs = [];
    return Promise.all(promises).then(function(sqls) {
      for (var sql of sqls) {
        data.SQLs.push(sql);
      }
      return Promise.resolve(data);
    });

  })
  .then((function(data) {
    var promises = [];
    for (var sql of data.SQLs) {
      promises.push((function() {
        return this.promise_query(sql, null);
      }).bind(this)());
    }

    return Promise.all(promises).then(function(results) {
      data.results = results;
      return Promise.resolve(data);
    });

  }).bind(this))
  .then(function(data) {
    return Promise.resolve(data);
  })
  .then(new HistFormatter().formatContinuous)
  .catch(function(err) {
    return Promise.reject(err);
  });

}


VariablesModel.prototype.getVariablesContinuousHistogramTimeserie = function(opts, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getVarQuery(opts.scope, opts.id)
  .then((function(data) {
    return this.promiseRow(data);
  }).bind(this))
  .then(function(d) {

    var data = {}
    // Prepopulate for query
    // Rich data
    var actualTable = opts.scope + '.' + d.historic;
    opts.table = d.historic;
    opts.raw = d;

    var qb = new QueryBuilder(opts);
    var cases = qb.ranges();
    data.ranges_length = qb.ranges_length(); // Ranges length to populate

    var column = d.entity_field;
    var start = opts.time.start;
    var finish = opts.time.finish;
    var step = opts.time.step;
    var bbox = opts.filters.bbox;
    var timeColumn = opts.timeColumn;

    var compileQry = function(start, finish, step, column, actualTable, bbox, filter, cases, timeColumn) {
      return `
        WITH
        _bqry AS (
          SELECT date_trunc('minute', "${timeColumn}") as time, id_entity, MAX(${column}) as ${column} FROM ${actualTable}
          WHERE "${timeColumn}" >= '${start}'::timestamp AND "${timeColumn}" < '${finish}'::timestamp
          ${bbox}
          ${filter}
          GROUP BY date_trunc('minute', "${timeColumn}"), id_entity ORDER BY time, id_entity
        ),
        _groupQry AS (
          SELECT time, (CASE ${cases} END) as value FROM _bqry
        ),
        _gQry AS (
          SELECT time, value, count(value) as total FROM _groupQry group by time, value
          ORDER BY time, value
        ),
        _final AS (
          SELECT DISTINCT __time_serie as time,
            value as position,
            total as value
            FROM generate_series('${start}'::timestamp, '${finish}'::timestamp, '${step}') as __time_serie
            LEFT JOIN _gQry ON (_gQry.time >= __time_serie AND _gQry.time < (__time_serie + '${step}')::timestamp)
            WHERE (_gQry.time IS NULL OR (_gQry.time = (SELECT MAX(time) from _gQry WHERE _gQry.time >= __time_serie AND _gQry.time < (__time_serie + '${step}')::timestamp)))
            GROUP BY __time_serie, value, total
            ORDER BY __time_serie, position
        )
          SELECT time, position, SUM(value) AS value from _final group by time, position
          ORDER BY time, position`;
    }

    data.SQLs = [];
    data.SQLs.push(compileQry(start, finish, step, column, actualTable, qb.bbox(), qb.filter(), cases, timeColumn));
    if (opts.totals) {
      data.SQLs.push(compileQry(start, finish, step, column, actualTable, qb.bbox(), '', cases, timeColumn));
    }

    return Promise.resolve(data);

  })
  .then((function(data) {
    var promises = [];
    for (var sql of data.SQLs) {
      promises.push((function() {
        return this.cachedQuery(sql, null);
      }).bind(this)());
    }

    return Promise.all(promises).then(function(results) {
      data.results = results;
      return Promise.resolve(data);
    });

  }).bind(this))
  .then(function(data) {
    return Promise.resolve(data);
  })
  .then(new HistFormatter().formatTimeserie)
  .catch(function(err) {
    return Promise.reject(err);
  });


}


VariablesModel.prototype.getOuters = function(opts,cb) {
  var metadata = new MetadataInstanceModel();
  metadata.getVarQuery(opts.scope, opts.id_var, (function(err, d) {
    if (err)
      return cb(err);
    if (!d)
      return cb(utils.error('Variable not found',404));

    var sql = util.format('SELECT min(%s),max(%s) FROM %s.%s WHERE "TimeInstant" BETWEEN $1 AND $2',
              d.entity_field,d.entity_field,opts.scope,d.historic);
    this.cachedQuery(sql,[opts.start,opts.finish],this.cbRow(cb));
  }).bind(this));

}

VariablesModel.prototype.getVariableHistoric = function(opts) {
  var metadata = new MetadataInstanceModel();
  var promises = [metadata.getVarQuery(opts.scope, opts.idVar)];

  if (opts.filters.group) {
    promises.push(metadata.getVarQuery(opts.scope, opts.filters.group));
  }

  return Promise.all(promises)
  .then(function(data) {
    var dataVar = data[0].rows[0];
    var dataGroup = null;

    if (opts.filters.group) {
      dataGroup = data[1].rows[0];
    }

    var where = '';
    if (opts.start && opts.finish) {  // Both of them or nothing!
      where = `AND "TimeInstant" >= '${opts.start}'::timestamp AND "TimeInstant" < '${opts.finish}'::timestamp`;
    }

    var qb = new QueryBuilder(opts);
    var bboxAndFilter = qb.bbox() + ' ' + qb.filter();

    var suffix = opts.tableSuffix || '';

    // Group by feature
    var groupBy = null;
    var groupTable = null;
    if (opts.filters.group) {
      var groupBy = dataGroup.entity_field;
      var entityTable = dataGroup.entity_table_name;
      var groupTable = dataGroup.table_name;

      if (groupTable === entityTable) {
        groupTable = groupTable + '_lastdata';
      }
    }

    var select = null;
    if (Array.isArray(opts.agg)) {
      select = 'json_build_object(';
      for (var agg of opts.agg) {
        select += `'${ agg }', ${ agg }(${ dataVar.entity_field }), `
      }
      select = select.slice(0, -2) + ')';

    } else {
      select = `${ opts.agg }(${ dataVar.entity_field })`;
    }
    select += ' AS value'

    var selectJoin = '';
    var group = '';
    if (groupBy) {
      select += `, ${ groupBy } AS group`;
      var selectJoin = ` ld.${ groupBy },`;
      var group = `GROUP BY ${ groupBy }`;
    }

    if (suffix === '') {
      var sql = `
        SELECT ${ select }
          FROM (
            SELECT DISTINCT ld.position,${ selectJoin } p.*
              FROM ${ opts.scope }.${ dataVar.table_name } p
                JOIN ${ opts.scope }.${ dataVar.entity_table_name }_lastdata ld
                  ON ld.id_entity = p.id_entity) AS foo
              WHERE TRUE ${ where } ${ bboxAndFilter }
          ${ group }`;

    } else {
      var sql = `
        SELECT ${ select }
          FROM ${ opts.scope }.${ dataVar.entity_table_name }${ suffix } p
          WHERE TRUE ${ where } ${ bboxAndFilter }
          ${ group }`;
    }

    return this.cachedQuery(sql, null);
  }.bind(this))

  .then(function(data) {
    data = opts.filters.group ? data.rows : data.rows[0];
    return Promise.resolve(new DummyFormatter().pipe(data));
  })

  .catch(function(err) {
    return Promise.reject(err);
  });
};

// Not used, for now
VariablesModel.prototype.getRangesForVariable = function(scope, variable) {
  var metadata = new MetadataInstanceModel();
  return metadata.getVarQuery(scope, variable)
  .then(function(data) {
    log.debug(data);
    return this.promiseRow(data);
  }.bind(this))
  .then(function(data) {
    log.debug(data);
    var sql = `SELECT DISTINCT ${variable} FROM "${scope}"."${data.table_name}" WHERE id_scope='${scope}'`;
    log.debug(sql);
    return this.promise_query(sql);

  })
  .catch(function(err) {
    log.error(err);
    return Promise.reject(err);
  })

}


VariablesModel.prototype.getVariablesDailyAgg = function(opts) {
  var metadata = new MetadataInstanceModel();
  return metadata.getVarQueryArrayMultiEnt(opts.scope, opts.id_vars.join(','))

  .then(function(data) {
    return this.promiseRow(data);
  }.bind(this))

  .then(function(d) {
    var qb = new QueryBuilder(opts);
    var filter = `${qb.bbox()} ${qb.filter()}`;
    filter = filter.replace('AND', '').trim();
    filter = filter ? `WHERE ${filter} AND` : 'WHERE';

    var aggs = opts.agg;
    var bodyVarIds = opts.id_vars;
    var step = opts.step;

    var schema = d.dbschema;
    var tableNames = d.tablenames;
    var entityTables = d.entitytables;
    var varNames = d.vars;
    var varIds = d.vars_ids;
    var hours;
    var hstp;

    var missingVarIds = JSON.parse(JSON.stringify(bodyVarIds));
    for (var varId of varIds) {
      var i = missingVarIds.indexOf(varId);
      missingVarIds.splice(i, 1);
    }

    for (var missingVarId of missingVarIds) {
      var i = varIds.indexOf(missingVarId);

      tableNames.push(tableNames[i]);
      entityTables.push(entityTables[i]);
      varNames.push(varNames[i]);
      varIds.push(varIds[i]);
    }

    var aggsCopy = JSON.parse(JSON.stringify(aggs));
    aggs = _.map(varIds, function(varId) {
      var i = bodyVarIds.indexOf(varId);
      var agg = aggsCopy[i];

      bodyVarIds.splice(i, 1);
      aggsCopy.splice(i, 1);

      return agg;
    });

    var promises = [varIds, aggs];
    for (var i in varNames) {
      var entitySql = '';
      if (tableNames[i] !== entityTables[i]) {
        entitySql = `LEFT JOIN ${schema}.${entityTables[i]}_lastdata bar ` +
                     'ON foo.id_entity = bar.id_entity ';
      }

      var datePart = '(date_part(\'hour\',foo."TimeInstant"::timestamp) + 1)';

      if (step !== '1h') {
        hstp = parseInt(step.slice(0,-1));
        hours = `(ceil(${datePart} / ${hstp})) * ${hstp}`;
      } else {
        hours = `${datePart}`;
      }

      var sql = [
        `SELECT ${aggs[i]}(foo."${varNames[i]}") AS "${varIds[i]}_${aggs[i]}",`,
        `(${hours} * 3600) as time`,
        `FROM ${schema}.${tableNames[i]} foo ${entitySql} ${filter}`,
        `foo."TimeInstant" >= '${opts.start}'::timestamp AND foo."TimeInstant" < '${opts.finish}'::timestamp`,
        'GROUP BY time ORDER BY time'
      ];

      promises.push(this.cachedQuery(sql.join(' '), null));
    }

    return Promise.all(promises);
  }.bind(this))

  .then(function(data) {
    return new VariablesFormatter().dailyagg(data);

  })

  .catch(function(err) {
    return Promise.reject(err);
  });
}

VariablesModel.prototype.rankingNow = function(opts) {
  var metadata = new MetadataInstanceModel();
  return metadata
    .getVarQueryArrayMultiEnt(opts.scope, opts.id_vars.join(','))

    .then(function(data) {
      return this.promiseRow(data);
    }.bind(this))

    .then(function(data) {
      var qb = new QueryBuilder(opts);
      var filter = `${qb.bbox()} ${qb.the_geom()} ${qb.filter()}`;

      var varIds = data.vars_ids;
      var varNames = data.vars;

      var varOrder = varNames[varIds.indexOf(opts.var_order)];
      var order = opts.order || 'DESC';
      var limit = opts.limit ? `LIMIT ${opts.limit}` : '';

      var sql = `SELECT id_entity,"${varNames.join('", "')}"
          FROM ${data.dbschema}.${data.entitytables[0]}_lastdata
          WHERE true
          ${filter}
          AND ${varOrder} IS NOT NULL
          ORDER BY ${varOrder} ${order} ${limit};`;

      return this.cachedQuery(sql)
    }.bind(this))
    .then(function(data) {
      return new VariablesFormatter().ranking(data);
    })
};

VariablesModel.prototype.rankingHistoric = function (opts) {
  var metadata = new MetadataInstanceModel();
  return metadata.getVarQueryArrayMultiEnt(opts.scope, opts.id_vars.join(','))

  .then(function(data) {
    return this.promiseRow(data);
  }.bind(this))

  .then(function(data) {

    var dates = '';
    if (opts.start && opts.finish) { // Both of them or nothing!
      dates = `AND "TimeInstant" >= '${opts.start}'::timestamp AND "TimeInstant" < '${opts.finish}'::timestamp`;
    }

    var qb = new QueryBuilder(opts);
    var filter = `${qb.bbox()} ${qb.filter()}`;

    // Ordering the aggs according to the query result
    var aggsCopy = JSON.parse(JSON.stringify(opts.agg));
    opts.agg = _.map(data.vars_ids, function(varId) {
      var i = opts.id_vars.indexOf(varId);
      var agg = aggsCopy[i];

      opts.id_vars.splice(i, 1);
      aggsCopy.splice(i, 1);

      return agg;
    });

    var select = null;
    if (Array.isArray(opts.agg)) {
      select = 'id_entity, ';
      var i;
      for (i = 0; i < opts.agg.length; i++) {
        if (opts.agg[i].toUpperCase() === 'NOAGG') {
          select += `LAST(${data.vars[i]}) as ${data.vars[i]}, `
        } else {
          select += `${opts.agg[i]}(${data.vars[i]}) as ${data.vars[i]}, `
        }
      }
      select = select.slice(0, -2);
    } else {
      select = `${opts.agg}($data.vars_ids[0])`;
    }
    var varNames = data.vars;

    var i_order = data.vars_ids.indexOf(opts.var_order);
    var order = opts.order || 'DESC';
    var limit = opts.limit ? `LIMIT ${opts.limit}` : '';

    var sql = `
      SELECT row_to_json(row) as device FROM (
        SELECT ${select}
        FROM ${data.dbschema}.${data.tablenames[0]}
        WHERE TRUE
        ${filter}
        ${dates}
        AND ${data.vars[i_order]} IS NOT NULL
        GROUP BY id_entity
        ORDER BY ${opts.agg[i_order]}(${data.vars[i_order]}) ${order} ${limit}
      ) row;`;

    return this.cachedQuery(sql)
  }.bind(this))

  .then(function(data) {
    return new VariablesFormatter().rankingHistoric(data);
  })

  .catch(function(err) {
    return Promise.reject(err);
  });
};

VariablesModel.prototype.weekSerie = function(opts) {
  var metadata = new MetadataInstanceModel();
  var entityField = null;
  return metadata.getVarQuery(opts.scope, opts.idVar)

  .then(function(data) {
    return this.promiseRow(data);
  }.bind(this))

  .then(function(data) {
    entityField = data.entity_field;
    var dbschema = opts.scope;
    var qb = new QueryBuilder(opts);
    var filter = qb.bbox() + ' ' + qb.filter();

    var sql = `
        SELECT
          (EXTRACT(ISODOW FROM m."TimeInstant"::timestamp)) -1 AS dow,
          (EXTRACT(HOUR FROM m."TimeInstant"::timestamp)) AS hod,
          ${opts.agg}(m.${data.entity_field}) AS ${data.entity_field}
        FROM ${dbschema}.${data.historic} m
        JOIN ${dbschema}.${data.now} ld
        ON m.id_entity = ld.id_entity
        WHERE m."TimeInstant" >= '${opts.start}'::timestamp AND m."TimeInstant" < '${opts.finish}'::timestamp
        ${filter}
        GROUP BY dow, hod
        ORDER BY dow, hod`;

    return this.cachedQuery(sql)
  }.bind(this))

  .then(function(data) {
    var hoursInADay = 24;
    var weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday', 'Sunday'];
    var formatted = weekdays.map(function(weekday, i) {
      return {
        'day': weekday,
        'data': Array(hoursInADay).fill(null)
      }
    });

    for (var row of data.rows) {
      formatted[row.dow]['data'][row.hod] = row[entityField];
    }

    return Promise.resolve(formatted);
  }.bind(this));
};

VariablesModel.prototype.grouped = function(opts) {
  return new MetadataInstanceModel().getVarQuery(opts.scope, opts.idVar)

  .then(data => {
    if (!data.rows.length) {
      var err = new Error(`Variable '${opts.idVar}' not found in the '${opts.scope}' scope`);
      return Promise.reject(err);
    }

    var table = data.rows[0].table_name;
    var entityTable = data.rows[0].entity_table_name;
    var field = data.rows[0].entity_field;

    var join = '';
    if (table !== entityTable) {  // For using the position
      join = `LEFT JOIN ${opts.scope}.${entityTable}_lastdata j ON t.id_entity = j.id_entity`;
    }

    var timeFilter = '';
    if (opts.start && opts.finish) {
      timeFilter = `AND t."TimeInstant" >= '${opts.start}'::timestamp
        AND t."TimeInstant" < '${opts.finish}'::timestamp`;
    }

    var order = opts.order ? opts.order : 'DESC';
    var limit = opts.limit ? ` LIMIT ${opts.limit}` : '';

    var qb = new QueryBuilder(opts);
    var filter = qb.bbox() + ' ' + qb.filter();

    var sql = `SELECT t."${field}" AS category, count(*)::integer AS total
        FROM ${opts.scope}.${table} t ${join}
        WHERE TRUE ${timeFilter} ${filter}
        GROUP BY t."${field}"
        ORDER BY total ${order}${limit};`;

    return this.cachedQuery(sql);
  })

  .then(data => {
    var formatted = null;
    if (opts.perc) {
      formatted = new RankingFormatter().percentage(data.rows, 'total');

    } else {
      formatted = new DummyFormatter().pipe(data.rows);
    }

    return Promise.resolve(formatted);
  });
};

VariablesModel.prototype.unique = function(opts) {
  return new MetadataInstanceModel().getVarQuery(opts.scope, opts.idVar)

  .then(data => {
    if (!data.rows.length) {
      var err = new Error(`Variable '${opts.idVar}' not found in the '${opts.scope}' scope`);
      return Promise.reject(err);
    }

    var table = data.rows[0].table_name;
    var entityTable = data.rows[0].entity_table_name;
    var field = data.rows[0].entity_field;

    var join = '';
    if (table !== entityTable) {  // For using the position
      join = `LEFT JOIN ${opts.scope}.${entityTable}_lastdata j ON t.id_entity = j.id_entity`;
    }

    var timeFilter = '';
    if (opts.start && opts.finish) {
      timeFilter = `AND t."TimeInstant" >= '${opts.start}'::timestamp
        AND t."TimeInstant" < '${opts.finish}'::timestamp`;
    }

    var qb = new QueryBuilder(opts);
    var filter = qb.bbox() + ' ' + qb.filter();

    var sql = `SELECT DISTINCT t."${field}" AS value
          FROM ${opts.scope}.${table} t ${join}
          WHERE TRUE ${timeFilter} ${filter}
          ORDER BY t."${field}" ASC;`;

    return this.cachedQuery(sql);
  })

  .then(data => {
    var unique = new DummyFormatter().pipe(data.rows);
    return Promise.resolve(unique);
  });
};

VariablesModel.prototype.boundingBox = function(opts) {
  return new MetadataInstanceModel().getVarQuery(opts.scope, opts.idVar)

  .then(data => {
    if (!data.rows.length) {
      var err = new Error(`Variable '${opts.idVar}' not found in the '${opts.scope}' scope`);
      return Promise.reject(err);
    }

    var table = data.rows[0].table_name;
    var entityTable = data.rows[0].entity_table_name;
    var field = data.rows[0].entity_field;

    var join = '';
    if (table !== entityTable) {  // For using the position
      join = `LEFT JOIN ${opts.scope}.${entityTable}_lastdata j ON t.id_entity = j.id_entity`;
    }

    var timeFilter = '';
    if (opts.start && opts.finish) {
      timeFilter = `AND t."TimeInstant" >= '${opts.start}'::timestamp
        AND t."TimeInstant" < '${opts.finish}'::timestamp`;
    }

    var qb = new QueryBuilder(opts);
    var filter = qb.bbox() + ' ' + qb.filter();

    var sql = `SELECT ARRAY[ST_XMin(q.bbox), ST_YMin(q.bbox),
          ST_XMax(q.bbox), ST_YMax(q.bbox)] AS value
        FROM (SELECT ST_Buffer(ST_Extent(t.position), 0.00001) AS bbox
          FROM ${opts.scope}.${table} t ${join}
          WHERE TRUE ${timeFilter} ${filter}) q;`;

    return this.cachedQuery(sql);
  })

  .then(data => {
    if (data.rows[0].value[0] == null) {
      data.rows[0].value = null;
    }

    var unique = new DummyFormatter().pipe(data.rows[0]);
    return Promise.resolve(unique);
  });
};

VariablesModel.prototype.comparison = function(opts) {
  return new MetadataInstanceModel().getVarQuery(opts.scope, opts.idVar)

  .then(data => {
    if (!data.rows.length) {
      var err = new Error(`Variable '${opts.idVar}' not found in the '${opts.scope}' scope`);
      return Promise.reject(err);
    }

    var table = data.rows[0].table_name;
    var field = data.rows[0].entity_field;

    var qb = new QueryBuilder(opts);
    // Keep in mind that bbox filter is deprecated as of Jun 2018
    var qry_filter = `${qb.the_geom()} ${qb.filter()}`;

    var sql = `
      WITH t_then AS (
          SELECT  SUM(${field}) val,
                  id_entity
          FROM    ${opts.scope}.${table}
          WHERE   "TimeInstant" >= '${opts.date}'::timestamp - '${opts.interval}'::interval - '${opts.interval}'::interval
                  AND "TimeInstant" < '${opts.date}'::timestamp - '${opts.interval}'::interval
                  ${qry_filter}
          GROUP BY id_entity
      ),   t_now  AS (
          SELECT  SUM(${field}) val,
                  id_entity
          FROM    ${opts.scope}.${table}
          WHERE   "TimeInstant" >= '${opts.date}'::timestamp - '${opts.interval}'::interval
                  AND "TimeInstant" < '${opts.date}'::timestamp
                  ${qry_filter}
          GROUP BY id_entity
      )
      SELECT  COALESCE("then".val, 0) value_then,
              COALESCE(now.val, 0) value_now,
              CASE WHEN "then".val=0 THEN 0
                   ELSE COALESCE((now.val - "then".val) / "then".val, 1) * 100
              END percentage
      FROM    t_then "then"
      FULL JOIN t_now now
      ON "then".id_entity = now.id_entity;
    `

    return this.cachedQuery(sql);
  })

  .then(data => {
    var formatted = null;
    formatted = new DummyFormatter().pipe(data.rows);
    return Promise.resolve(formatted);
  });
};

module.exports = VariablesModel;
