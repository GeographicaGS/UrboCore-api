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
var PGSQLModel = require('./pgsqlmodel.js');
var cons = require('../cons.js');
var utils = require('../utils');
var modelutils = require('./modelutils.js');
var MetadataModel = require('./metadatamodel.js');
var MetadataInstanceModel = require('./metadatainstancemodel');
var DevicesFormatter = require('../protools/devicesformatter');
var QueryBuilder = require('../protools/querybuilder');
var log = utils.log();
var auth = require('../auth.js');

function DevicesModel(cfg) {
  PGSQLModel.call(this,cfg);
}

util.inherits(DevicesModel, PGSQLModel);

DevicesModel.prototype.queryData = function(sql,bindings,cb) {
  this.query(sql,bindings,cb);
}

DevicesModel.prototype.getDevicesMapByScope = function(scope,entities,user,cb) {
  /*
  *   [{
  *     "device_id":"watering.sosteco.weatherstation:es1",
  *     "location":{"lat":37.235251,"lng":-5.094984},
  *   }]
  */

  var metadata = new MetadataInstanceModel();
  metadata.getEntitiesForDevicesMapByScope(scope, entities, (function(err, d) {
    if (err) {
      log.error('Cannot execute sql query');
      cb(err);
    }
    else if (!d.rows.length) {
      log.debug('No rows returned from query');
      cb(null,null);
    } else {
      var sql = [];

      auth.validElements({
        scope: scope,
        user: user,
        elements : d.rows.map(function(r) {
          return r.id_entity;
        })
      }, (function(err, elements) {

        if (err)
          return cb(err);

        for (var i in d.rows) {
          sql.push('SELECT DISTINCT ON (id_entity) ST_X(ST_PointOnSurface(position)) As lon,ST_Y(ST_PointOnSurface(position)) As lat,id_entity');
          sql.push('FROM '+d.rows[i].dbschema+'.'+d.rows[i].table_name+'_lastdata WHERE position IS NOT NULL');
          sql.push('UNION ALL');
        }
        sql.pop();
        this.query(sql.join(' '),null,function(err,data) {
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
            var dt = _.map(data.rows, function(obj) {
              return {
                'id': obj.id_entity,
                'location': {'lat': obj.lat, 'lon': obj.lon}
              }
            })
            cb(null, dt);
          }
        });
      }).bind(this));
    }
  }).bind(this));
}


DevicesModel.prototype.getDevicesMapByEntity = function(scope,entities,geojson,geojsonCollection,user,cb) {
  /*
  *   [{
  *     "device_id":"watering.sosteco.weatherstation:es1",
  *     "entity_id":"watering.sosteco.weatherstation",
  *     "location":{"lat":37.235251,"lng":-5.094984},
  *     "timeinstant":"2016-06-15T17:38:48.063",
  *     "lastdata":[{"var":"<id_var>","value":""}]
  *   }]
  */

  var metadata = new MetadataInstanceModel();
  metadata.getEntitiesForDevicesMapByEntity(scope, entities, (function(err, d) {
    if (err) {
      log.error('Cannot execute sql query');
      cb(err);
    }
    else if (!d.rows.length) {
      log.debug('No rows returned from query');
      cb(null,null);
    } else {

      var vars;
      var var_names;
      var id_vars;

      auth.validElements({
        scope: scope,
        user: user,
        elements : d.rows.map(function(r) {
          return r.id_entity;
        })
      }, (function(err, elements) {

        if (err)
          return cb(err);

        var sqls = [];
        for (var i in d.rows) {
          vars = d.rows[i].vars.map(function(v) {return util.format('"%s"', v)});
          var_names = '\'' + d.rows[i].vars + '\'';
          id_vars = '\'' + d.rows[i].id_vars + '\'';

          var plainsql = `
            (SELECT row_to_json(row) AS json_entity FROM
            (SELECT DISTINCT ON (id_entity)
              ST_X(ST_PointOnSurface(position::geometry)) as lon,
              ST_Y(ST_PointOnSurface(position::geometry)) as lat,
              id_entity AS device_id,
              "TimeInstant",
              ${id_vars} AS id_vars, ${var_names} AS var_names, ${vars}, '${d.rows[i].id_entity}' as entity_id
              FROM "${d.rows[i].dbschema}"."${d.rows[i].table_name}_lastdata" WHERE position IS NOT NULL) AS row)`;

          sqls.push(plainsql);

        }

        this.query(sqls.join(' UNION ALL '),null,(function(err,data) {
          if (err) {
            log.error('Cannot execute sql query');
            log.error(sqls.join(' UNION ALL '));
            cb(err);
          }
          else if (!data.rows.length) {
            log.debug('No rows returned from query');
            log.debug(sqls.join(' UNION ALL '));
            cb(null,null);
          } else {
            var dt = this._getVarData(data.rows, geojson, geojsonCollection);
            cb(null, dt);
          }
        }).bind(this));
      }).bind(this));
    }
  }).bind(this));
}

DevicesModel.prototype._getVarData = function(data,geojson,geojsonCollection) {
  var dt = data.map(function(obj) {
    var lData = [];
    var var_fields = obj.json_entity.var_names.split(',');
    var id_vars = obj.json_entity.id_vars.split(',');
    var var_values;
    var values;
    var dataObj;
    for (var i in var_fields) {
      var_values = obj.json_entity[var_fields[i]];
      dataObj = {};
      dataObj['value'] = var_values;
      dataObj['var'] = id_vars[i];
      if (_.findWhere(lData, dataObj)===undefined) {
        lData.push(dataObj);
      }
    }
    if (geojson || geojsonCollection) {
      return {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [
            obj.json_entity.lon,
            obj.json_entity.lat
          ]
        },
        'properties': {
          'device_id': obj.json_entity.device_id,
          'timeinstant': obj.json_entity.TimeInstant,
          'entity_id': obj.json_entity.entity_id,
          'lastdata': lData
        }
      };
    } else {
      return {
        'device_id': obj.json_entity.device_id,
        'location': {
          'lat': obj.json_entity.lat,
          'lng': obj.json_entity.lon
        },
        'timeinstant': obj.json_entity.TimeInstant,
        'entity_id': obj.json_entity.entity_id,
        'lastdata': lData
      };
    }
  });

  if (geojsonCollection) {
    dt = {
      type: 'FeatureCollection',
      features: dt
    };
  }

  return dt;
}

DevicesModel.prototype.getDeviceLastData = function(scope,deventity,devname,user,cb) {

  var metadata = new MetadataInstanceModel();
  metadata.getMetadataQueryForDeviceLastData(scope, deventity, (function(err, d) {
    if (err) {
      log.error('Cannot execute sql query');
      cb(err);
    }
    else if (!d.rows.length) {
      log.debug('No rows returned from query');
      cb(null,null);
    }
    else {
      var d = d.rows[0];

      auth.validElements({
        scope: scope,
        user: user,
        elements : d.vars_ids
      },
      (function(err, validvars) {

        var vars = d.vars.map(function(v) {return util.format('"%s"', v)});
        var qtablename = d.dbschema+'.'+d.table_name+'_lastdata';
        var sql = ['WITH',
          '__tqry As (SELECT MAX("TimeInstant") as lasttime FROM',
          qtablename,'WHERE id_entity=$1),',
          '__bqry As (SELECT',vars,
          ',position,id_entity,"TimeInstant" FROM',
          qtablename,',__tqry',
          'WHERE id_entity=$1 AND "TimeInstant" = lasttime),',
          '__vqry As (SELECT',vars,'FROM __bqry)',
          'SELECT id_entity, "TimeInstant",',
          'ST_X(ST_Centroid(position)) as lon,ST_Y(ST_Centroid(position)) as lat,',
          'row_to_json(__vqry) As var_values,',
          '\''+d.vars_ids+'\' As vars_ids',
          'FROM __bqry,__vqry'];

        this.query(sql.join(' '),[devname],function(err,data) {
          if (err) {
            log.error('Cannot execute sql query');
            log.error(sql);
            cb(err);
          }

          if (data.rows.length === 0) {
            return cb(utils.error('Resource not found',404));
          }

          var obj = data.rows[0];
          var lData = [];
          var var_fields = _.values(obj.var_values);
          var vars_ids = obj.vars_ids.split(',');

          for (var i in vars_ids) {
            if (validvars.indexOf(vars_ids[i])!==-1)
              lData.push({
                var_value: var_fields[i],
                var_id: vars_ids[i]
              });
          }

          cb(null,{
            'id': obj.id_entity,
            'location': {
              'lat': obj.lat,
              'lng': obj.lon
            },
            'timeinstant': obj.TimeInstant,
            'entity_id': d.table_name,
            'lastdata': lData
          });
        });
      }).bind(this));
    }
  }).bind(this));
}

DevicesModel.prototype.getDevicesTimeSerie = function(opts, cb) {
  var _this = this;
  this._getSerieAggAndTable(opts,function(err,data) {
    if (err) {
      log.error('Cannot get entity variables fields');
      return cb(err);
    }

    var tm_step = modelutils.getSQLFormattedStep(opts.step);

    var sql = ['WITH ',
      '_bqry as (',
      util.format('select * from %s where id_entity=$1 AND "TimeInstant"',data.table),
      util.format(' between \'%s\'::timestamp and \'%s\'::timestamp +\'%s\'',opts.start,opts.finish,tm_step),
      ')',
          //util.format("SELECT __time_serie as start,(__time_serie+'%s')::timestamp as finish,_bqry.id_entity,",tm_step),
      'SELECT __time_serie as time,',
      data.sqlagg,
      ' FROM ',
      util.format(' generate_series(\'%s\'::timestamp,\'%s\'::timestamp + \'%s\',\'%s\') as __time_serie',opts.start,opts.finish,tm_step,tm_step),
      ' LEFT JOIN _bqry ON _bqry."TimeInstant"',
      util.format(' BETWEEN __time_serie AND __time_serie+\'%s\'',tm_step),
      util.format(' WHERE _bqry.id_entity=$1 or _bqry.id_entity is null'),
      ' GROUP BY __time_serie,id_entity ORDER BY __time_serie'];

    _this.cachedQuery(sql.join(' '),[opts.id_device],function(err,data) {
      if (err) {
        cb(err,data);
      } else {
        var r = data.rows.map(function(r) {
          var time = r.time;
          delete r.time;
          return {
            'time': time,
            'data' : r
          }
        });
        cb(null,r);
      }
    });
  });
}

DevicesModel.prototype.getDevicesRawData = function(opts, cb) {

  var metadata = new MetadataInstanceModel();
  return metadata.getVarsForRawData(opts.scope,opts.id_entity,opts.id_vars)
  .then((function(data) {

    var table;
    var fieldsql;
    var sql;
    var promises = [];

    var qb = new QueryBuilder(opts);
    var filter = `${qb.bbox()} ${qb.filter()}`;
    filter = filter.replace('AND', '').trim();
    filter = filter ? `WHERE ${filter} AND` : 'WHERE';

    data.rows.forEach((function(dt) {
      table = `${dt.dbschema}.${dt.table_name}`;
      fieldsql = dt.varfields.map(function(v) {
        return `'${v.id_var}',"${v.field}"`;
      }).join(',');

      sql = [
        'SELECT "TimeInstant" as time,json_build_object(',
        `${fieldsql}) as data FROM ${table}`,
        `${filter} id_entity='${opts.id_device}' AND "TimeInstant" >=`,
        `'${opts.start}'::timestamp AND "TimeInstant"`,
        `< '${opts.finish}'::timestamp`,
        'ORDER by "TimeInstant"'
      ];

      promises.push(this.cachedQuery(sql.join(' ')));
    }).bind(this));

    return Promise.all(promises);
  }).bind(this))
    .then(function(results) {
      return new DevicesFormatter().rawData(results);
    })
    .catch(function(err) {
      return Promise.reject(err);
    });
}

DevicesModel.prototype._getSerieAggAndTable = function(opts,cb) {
  var mm = new MetadataInstanceModel();
  var _this = this;
  mm.entityVariablesFields(opts.scope, opts.id_entity,function(err,data) {
    if (err) return cb(err);

    var table = opts.scope + '.' + data.table,
      varfields = data.varfields.filter(function(vf) {
        return opts.vars.indexOf(vf.id_var)!==-1;
      });

    for (var i in varfields) {
      var idx = varfields.indexOf(varfields[i].id_var);
      varfields[i].agg = opts.agg[i];
    }

    var sqlagg = varfields.map(function(v) {
      var s;
      if (v.agg === 'NOAGG' )
        s = 'null';
      else if (v.agg === 'RAW')
        s = v.field;
      else
        s = v.agg +'(' + v.field + ')';

      return s + ' as "' + v.id_var + '"';
    });

    cb(null,{
      table: table,
      sqlagg : sqlagg
    });
  });

}

DevicesModel.prototype.getDevicesSummary = function(opts,cb) {
  var _this = this;
  this._getSerieAggAndTable(opts,function(err,data) {
    if (err) {
      log.error('Cannot get entity variables fields');
      return cb(err);
    }

    var sql = ['SELECT id_entity as id,',
      data.sqlagg,
      'FROM', data.table,
      'WHERE "TimeInstant"',
      util.format(' BETWEEN \'%s\'::timestamp AND \'%s\'::timestamp',opts.start,opts.finish),
      'AND id_entity=$1',
      'GROUP BY id_entity'];

    _this.cachedQuery(sql.join(' '),[opts.id_device],function(err,data) {

      if (err) return cb(err);
      var d;

      if (!data.rows.length) {
        // No data
        var lvars = opts.vars.split(',');
        d = {};
        for (var i in lvars)
          d[lvars[i]] = null;
      }
      else {
        d = data.rows[0];
        delete d.id;
      }
      cb(null,{
        id: opts.id_device,
        vars: d
      });

    });
  });
}



module.exports = DevicesModel;
