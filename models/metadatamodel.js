'use strict';

var util = require('util');
var _ = require('underscore');
var BaseMetadaDataModel = require('./basemetadatamodel');
var cons = require('../cons.js');
var utils = require('../utils');
var log = utils.log();

function MetadataModel(cfg) {
  BaseMetadaDataModel.call(this,cfg);
}

util.inherits(MetadataModel, BaseMetadaDataModel);


MetadataModel.prototype.getCategoriesMetadata = function(cb) {
  var q = 'SELECT id_category from metadata.categories';
  this.query(q, null, function(err, d) {
    if (err) return cb(err);
    return cb(null, d);
  });
}

MetadataModel.prototype.getEntitiesMetadata = function(user_id, cb) {
  var q = this._getMetadataQuery();
  this.query(q,null,(function(err,d) {
    if (err) return cb(err);
    var dataset = this._dataset2metadata(d);
    return cb(null, dataset);
  }).bind(this));
}


// Helper function to process database response when getting metadata
MetadataModel.prototype._dataset2metadata = function(d) {

  var dt = [];
  _.each(d.rows, function(obj) {

    if (obj.id_category===null) return;
      // Categories
    var category = _.findWhere(dt, {id: obj.id_category });
      // First hit for this category
    if (typeof category === 'undefined') {
      var category = {
        'id': obj.id_category,
        'name': obj.category_name,
        'nodata': obj.nodata,
        'config': obj.category_config,
        'entities': []
      }
      dt.push(category);
    }

    if (obj.id_entity===null) return;
      // Entities
    var entity = _.findWhere(category.entities, {id: obj.id_entity})
      // First hit for this entity
    if (typeof entity === 'undefined') {
      var entity = {
        'id': obj.id_entity,
        'name': obj.entity_name,
        'id_category': obj.id_category,
        'table': obj.entity_table_name,
        'mandatory': obj.entity_mandatory,
        'editable': obj.entity_editable,
        'variables': []
      }
      category.entities.push(entity);
    }

    if (obj.id_variable===null) return;
      // Variables
    var variable = _.findWhere(entity.variables, {id: obj.id_variable});
      // First hit for this variable
    if (typeof variable === 'undefined') {
      variable = {
        'id': obj.id_variable,
        'id_entity': obj.id_entity,
        'name': obj.var_name,
        'units': obj.var_units === 'null' ? null : obj.var_units,
        'var_thresholds': obj.var_thresholds,
        'var_agg': _.map(obj.var_agg, function(ag) {return ag.replace('\'','').replace('\'','')}),
        'reverse': obj.var_reverse,
        'column': obj.column_name,
        'config': obj.config,
        'table_name': obj.table_name,
        'mandatory': obj.variable_mandatory,
        'editable': obj.variable_editable,
        'type': obj.type
      }
      entity.variables.push(variable);
    }
  });

  return dt;

}


MetadataModel.prototype._getMetadataQuery = function() {
  // [{
  // category_name: '<category_name>',
  // id_category: '<id_category>',
  // table: '<table_name>',
  // entity_name: '<entity_name>',
  // id_variable: '<id_variable>',
  // id_entity: '<id_entity>',
  // var_name: '<var_name>',
  // var_units: '<var_units>',
  // var_thresholds: [],
  // var_agg: ["SUM","MAX","MIN","AVG"],
  // var_reverse: true|false
  // }]


  // Old fashioned query
  var mtdQry = [
    'SELECT c.category_name, c.id_category, c.nodata, c.config AS category_config, ',
    '(CASE WHEN v.table_name IS NULL THEN e.table_name ELSE v.table_name END) AS table_name, ',
    'e.entity_name, e.mandatory as entity_mandatory, e.table_name AS entity_table_name, e.editable as entity_editable, v.config,',
    'v.id_variable as id_variable, v.id_entity, v.type, v.var_name, v.var_units, ',
    'v.var_thresholds, v.var_agg, v.var_reverse, v.mandatory as variable_mandatory, ',
    'v.editable as variable_editable, v.entity_field as column_name',
    'FROM metadata.variables v',
    'INNER JOIN metadata.entities e on v.id_entity=e.id_entity',
    'INNER JOIN metadata.categories c on e.id_category = c.id_category'
  ];

  // View??
  // var mtdQry = 'SELECT * FROM metadata.full_metadata';
  return mtdQry.join(' ');
}

/*

RETURNS the variables fields for a table.
Sample response:
{
  "varfields": [
    {
      "id_var": "mt_winddir",
      "field": "winddir"
    },
    {
      "id_var": "mt_windvel",
      "field": "windvel"
    },
    {
      "id_var": "mt_pluvio",
      "field": "pluvio"
    },
    {
      "id_var": "mt_battery",
      "field": "battery"
    }
  ],
  "table": "weatherstation"
}
*/
MetadataModel.prototype.entityVariablesFields = function(id_entity,cb) {
  var sql = ['select json_agg(json_build_object(\'id_var\',id_variable,\'field\',entity_field)) as varfields,',
    '(select table_name from metadata.entities_scopes WHERE id_entity=$1 LIMIT 1) as table',
    ' FROM metadata.variables_scopes where id_entity=$1'];

  this.query(sql.join(' '),[id_entity],this.cbRow(cb));
}


module.exports = MetadataModel;
