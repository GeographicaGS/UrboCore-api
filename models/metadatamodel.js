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
};

MetadataModel.prototype.getEntitiesMetadata = function(user_id, cb) {
  let q = `
    SELECT
      -- Category information
      c.category_name,
      c.id_category,
      c.nodata,
      c.config AS category_config,
      -- Entity information
      e.entity_name,
      e.mandatory AS entity_mandatory,
      e.table_name AS entity_table_name,
      e.editable AS entity_editable,
      -- Variable information
      v.config,
      v.id_variable AS id_variable,
      v.id_entity,
      v.type,
      v.var_name,
      v.var_units,
      v.var_thresholds,
      v.var_agg,
      v.var_reverse,
      v.mandatory AS variable_mandatory,
      v.editable AS variable_editable,
      v.entity_field AS column_name,
      (CASE
        WHEN v.table_name IS NULL THEN e.table_name
        ELSE v.table_name
      END) AS table_name
    FROM metadata.categories c
    INNER JOIN metadata.entities e
      ON c.id_category = e.id_category
    LEFT JOIN metadata.variables v
      ON v.id_entity = e.id_entity
  `;

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
