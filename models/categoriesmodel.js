'use strict';

var util = require('util');
var _ = require('underscore');
var PGSQLModel = require('./pgsqlmodel');
var cons = require('../cons');
var utils = require('../utils');
var modelutils = require('./modelutils');
var EntitiesModel = require('./entitiesmodel');
var VariablesModel = require('./variablesmodel');
var log = utils.log();
var auth = require('../auth.js');



class CategoryModel extends PGSQLModel {
  constructor(cfg) {
    super(cfg);
  }

  get this() {
    return this; // Because parent is not a strict class
  }


  deleteCategory(scope, id_category) {

    var bindings = [
      scope, id_category
    ];

    var sql = `
      DELETE FROM metadata.categories_scopes
        WHERE id_scope=$1 AND id_category=$2`;

    return this.promise_query(sql, bindings)
    .then(function(d) {
      var op = {'scope':scope, 'id_category': id_category};
      return Promise.resolve(op);
    })
    .then(function(opts) {
      return new EntitiesModel().deleteEntitiesForCategory(opts)
    })
    .then(function(d) {
      var ents = [];
      _.each(d.rows, function(row) { ents.push(row.id_entity) })
      return Promise.resolve({'scope': scope, 'id_entities': ents});
    })
    .then(function(data) {
      var vmodel = new VariablesModel();
      return vmodel.deleteVariablesForEntity(data);
    })

  }

  createDBTables(opts) {
    log.debug(`Start PgSQL transaction for ${opts.category}...`);

    var bindings = [
      opts.scope,
      opts.category,
      opts.category_name
    ];

    var sql = 'SELECT urbo_categories_ddl($1, $2, $3);'

    return this.promise_query(sql, bindings)
  }

  getCategoriesForScope(scope, id_category, cb) {
    var q = 'SELECT id_category FROM metadata.categories_scopes WHERE id_scope=\''
      + scope + '\' AND id_category = \''+id_category+'\'';
    return this.uq(q, cb);
  }

  updateCategory(scope, id_category, data, cb) {
    var baseQry = ['UPDATE metadata.categories_scopes SET'];
    var updateClause = [];

    if ('name' in data) {
      updateClause.push('category_name=\'' + data.name + '\'');
    }
    if ('nodata' in data) {
      updateClause.push('nodata=\'' + data.nodata + '\'');
    }

    baseQry.push(updateClause.join(','));
    baseQry.push('WHERE id_scope=\''+scope+'\' AND id_category=\'' + id_category + '\'');

    try {
      this.query(baseQry.join(' '), null, function(err, d) {
        if (err) {
          log.error(err);
          return cb(err);
        }
        return cb(null, null);
      });

    } catch (e) {
      return cb(e);

    }
  }

}

module.exports = CategoryModel;
