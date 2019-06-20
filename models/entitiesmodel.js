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
var MetadataInstanceModel = require('./metadatainstancemodel');
var VariablesModel = require('./variablesmodel');
var cons = require('../cons.js');
var utils = require('../utils');
var modelutils = require('./modelutils.js');
var log = utils.log();
var auth = require('../auth.js');
var QueryBuilder = require('../protools/querybuilder');

function EntitiesModel(cfg) {
  PGSQLModel.call(this,cfg);
}

util.inherits(EntitiesModel, PGSQLModel);

EntitiesModel.prototype.queryData = function(sql,bindings,cb) {
  this.query(sql,bindings,cb);
}

EntitiesModel.prototype.getAllElementsByDevice = function(scope, id_entity, variables, cb) {
  let metadata = new MetadataInstanceModel();
  metadata.getAllElementsByDevice(scope, id_entity, (function(err, dm) {
    if (err) {
      log.error('Cannot execute sql query');
      log.error(dm);
      cb(err);
    } else if (!dm.rows.length) {
      log.debug('No rows returned from query');
      log.debug(dm);
      cb(null,null);
    } else {
      variables.push(id_entity + '.name');
      metadata.getVarQueryArray(scope, variables)
      .then((dn) => {
        var columns = [];
        for (var variable of dn.rows) {
          columns.push(...variable.vars);
        }

        var columnNames = '';
        if (columns.length > 0) {
          columnNames = ',' + columns.join(',');
        }

        var qd = `
          SELECT
            DISTINCT id_entity${ columnNames }
            FROM ${dm.rows[0].dbschema}.${dm.rows[0].entity_table_name}_lastdata
            ORDER BY id_entity`;

        this.query(qd,null,function(err,data) {
          if (err) {
            log.error('Cannot execute sql query');
            log.error(qd);
            cb(err);
          } else if (!data.rows.length) {
            log.debug('No rows returned from query');
            log.debug(qd);
            cb(null,null);
          } else {
            var dt = _.map(data.rows, function(obj) {
              var result = {
                'id': obj.id_entity,
                'name': obj.id_entity
              };

              for (var column of columns) {
                result[column] = obj[column];
              }

              return result;
            });
            cb(null,dt);
          }
        });
      });
    }
  }).bind(this));
}

//DEPRECATED
EntitiesModel.prototype.mapCounters = function(scope,opts,cb) {

  var metadata = new MetadataInstanceModel();
  metadata.getMapCounters(scope, opts, (function(err, data) {
    var entities = data.rows;
    var queries = [];
    for (var i in entities) {
      var ent = entities[i];

      var sql_all = [util.format('SELECT count(*) as n, \'%s\' as f, \'total\' as t from %s.%s',ent.id_entity,scope,ent.table)];
      var sql_filter = [util.format('SELECT count(*) as n,\'%s\' as f, \'filter\' as t from %s.%s WHERE TRUE',ent.id_entity,scope,ent.table)];
      // Get the filter for the entity id
      var filters = opts.filters[ent.id_entity]||null;
      if (filters) {
        // Get query condition for filter
        var cond = [];
        for (var i in filters) {
          var field = ent.fields.find(function(el) {
            return el.variable === i;
          });
          if (!field)
            return cb(utils.error('Bad parameters: invalid type [' + i+  '] found at filter',400));

          cond.push(util.format('%s IN (\'%s\')',field.field,filters[i].join('\',\'')));
        }
        sql_filter.push(' AND ' + cond.join(' AND '));
      }

      sql_filter.push(util.format('AND position && ST_MakeEnvelope(%s, 4326)',opts.filters.bbox));
      queries.push(sql_filter.join(' '),sql_all.join(' '));
    }

    var sql = '(' + queries.join(') UNION ALL (') + ')';
    this.query(sql,[],function(err,data) {
      if (err)
        return cb(err);

      var resp = {};
      for (var i in data.rows) {
        var o = data.rows[i]
        resp[o.f] = resp[o.f]||{};
        resp[o.f][o.t] = o.n;
      }
      cb(null,resp);
    });
  }).bind(this));
}

EntitiesModel.prototype._getEntityField = function(fields,v) {
  return fields.find(function(el) {
    return el.variable === v;
  });
}

EntitiesModel.prototype.mapCountersEntity = function(opts,cb) {
  var bbox_sql = opts.bbox ? util.format('ST_MakeEnvelope(%s,4326)',opts.bbox):'NULL';
  var start_sql = opts.start ? util.format('\'%s\'', opts.start):'NULL';
  var finish_sql = opts.finish ? util.format('\'%s\'', opts.finish):'NULL';

  var sql = util.format('select id_entity as id,nfilter as filter,nall as all from entitesMapCounters (\'%s\',array[\'%s\'],%s,%s,%s)',opts.scope,opts.entities.join('\',\''),bbox_sql,start_sql,finish_sql);

  this.query(sql,[],function(err,data) {
    if (err)
      return cb(err);
    cb(null,data.rows);
  });
}

EntitiesModel.prototype.searchElements = function(opts,cb) {
  if (!opts.term) {
    log.debug('Empty search');
    return cb(null,null);
  }
  var _this = this;
  var metadata = new MetadataInstanceModel();
  metadata.getEntsForSearch(opts.scope, opts.entities, (function(err, dm) {
    if (err) {
      log.error('Cannot execute sql query');
      cb(err);
    } else if (!dm.rows.length) {
      log.debug('No rows returned from query');
      cb(null,null);
    } else {
      var qtable;
      var qemp;
      var qdevs = [];
      var qemp = '';
      var extraSql = '';
      for (var i in dm.rows) {
        qtable = util.format('%s.%s_lastdata',dm.rows[i].dbschema,dm.rows[i].table_name);
        qdevs.push('(SELECT \'device\' as type,id_entity as name,id_entity as element_id,BOX2D(position) as pbbox');
        qdevs.push(util.format('FROM %s',qtable));
        qdevs.push('WHERE id_entity ILIKE unaccent(\'%'+opts.term+'%\')');
        qdevs.push(util.format('LIMIT %d)',opts.limit));
        qdevs.push('UNION ALL');
      }
      qdevs.pop();

      if (_.indexOf(opts.entities,'id_emp_parks') !== -1) {
        qemp = _this._getNonRegisteredEntities(opts.term,opts.limit);
      }

      if (opts.extraSql) {
        extraSql = opts.extraSql;
      }

      var qall = ['WITH _qflt As (',qdevs.join(' '),qemp,extraSql,')',
        'SELECT type,name,element_id,',
        'json_build_array(ST_XMin(pbbox),ST_YMin(pbbox),ST_XMax(pbbox),ST_YMax(pbbox)) as bbox',
        'FROM _qflt ORDER BY name',
        util.format('LIMIT %d',opts.limit)];

      this.query(qall.join(' '),null,function(err,data) {
        if (err) {
          log.error('Cannot execute sql query');
          log.error(qall);
          cb(err);
        }
        else if (!data.rows.length) {
          log.debug('No rows returned from query');
          log.debug(qall);
          cb(null,null);
        } else {
          cb(null,data.rows);
        }
      });
    }
  }).bind(this));
}

EntitiesModel.prototype.searchElementsExtended = function(scope, entities) {
  const metadata = new MetadataInstanceModel();
  return metadata
    .getEntsForSearch(scope, Object.keys(entities))
    .then(function(d) {
      
      const promises = d.rows.map(((entityData) => {

        const entitySelect = entities[entityData.id_entity].select;

        const qb = new QueryBuilder(entities[entityData.id_entity]);
        const queryFilter = `${qb.bbox()} ${qb.filter()}`;

        const suffix = entities[entityData.id_entity].suffix || '';
        return this.cachedQuery(`
          SELECT DISTINCT ON (id_entity) ${entitySelect.join(', ')}
          FROM ${entityData.dbschema}.${entityData.entity_table_name}${suffix}
          WHERE TRUE ${queryFilter}
        `);
      }).bind(this)); 

      return Promise.all(promises)
        .then(dataResult => {
          // group result by id_entity
          return Promise.resolve(_.reduce(dataResult, (result, r, i) => {
            return Object.assign(result, {[d.rows[i].id_entity]: r.rows});
          }, {}));
        });
    }.bind(this))
    .catch(function(err) {
      return Promise.reject(err);
    });
}

EntitiesModel.prototype._getNonRegisteredEntities = function(term,limit) {
  var qemp = ['(SELECT \'placement\' as type,park_name as name,id as element_id,BOX2D(the_geom) as pbbox',
    'FROM parques WHERE park_name ILIKE unaccent(\'%'+term+'%\')',
    util.format('LIMIT %d)',limit)];
  var qall = ['UNION ALL',qemp.join(' ')];
  return qall.join(' ');
}


EntitiesModel.prototype.addEntity = function(scope, data, cb) {
  var baseQry = 'INSERT INTO metadata.entities_scopes (id_scope, id_entity, entity_name, id_category, table_name) VALUES ';
  var values = {
    id_scope: '\'' + scope + '\'',
    id_entity: '\'' + data.id + '\'',
    name: '\'' + data.name + '\'',
    id_category: '\'' + data.id_category + '\'',
    table_name: '\'' + data.table + '\''
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
}

EntitiesModel.prototype.deleteEntity = function(scope, id_entity, cb) {
  var dropQ = 'DELETE FROM metadata.entities_scopes where id_scope=\''+scope+'\' AND id_entity=\''+id_entity+'\'';
  return this.uq(dropQ, cb);
}


EntitiesModel.prototype.getEntitiesForCategory = function(scope, id_category, cb) {
  var q = 'SELECT id_entity from metadata.entities_scopes where id_category=\''+id_category+'\' AND id_scope=\''+scope+'\'';
  return this.uq(q, cb);
}

EntitiesModel.prototype.getCategoriesForEntity = function(scope, id_entity, cb) {
  var q = 'SELECT id_category from metadata.entities_scopes where id_entity=\''+id_entity+'\' AND id_scope=\''+scope+'\'';
  return this.uq(q, cb);
}

EntitiesModel.prototype.deleteEntitiesForCategory = function(opts, cb) {

  var dropQ = 'WITH deleted as (DELETE FROM metadata.entities_scopes where id_scope=\''+opts.scope+'\' AND id_category=\''+opts.id_category+'\' RETURNING id_entity) SELECT id_entity FROM deleted';

  return this.promise_query(dropQ)
}

EntitiesModel.prototype.importFromCSV = function(id_scope, id_entity, fields, filePath, delimiter, hasHeaders, cb) {
  const opts = {
    schema: id_scope,
    table: id_entity,
    fields,
    filePath,
    delimiter,
    hasHeaders
  };
  return this.copyFromCsv(opts, cb);
}

module.exports = EntitiesModel;
