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

var moment = require('moment-timezone');
var ScopeModel = require('../../models/scopemodel');
var CategoryModel = require('../../models/categoriesmodel');
var EntitiesModel = require('../../models/entitiesmodel');
var MetadataModel = require('../../models/metadatamodel');
var MetadataInstanceModel = require('../../models/metadatainstancemodel');
var utils = require('../../utils.js');
var log = utils.log();

var _ = require('underscore');

module.exports = {
    isArray: function(value) {
        return Array.isArray(value);
    },
    isDate: function(value){
      return new Date(value) != 'Invalid Date';
    },
    isArrayOrNull: function(value){
      return Array.isArray(value) || value === null;
    },
    isZoom: function(value){
      return value >= 1;
    },
    isLocation: function(location){
      return Array.isArray(location) &&
        location.length === 2;
    },
    isValidUnit: function(unit){
      return true;
      // TODO: Async check for other units at catalogue: SELECT DISTINCT var_units from metadata.variables where var_units is not NULL
    },
    validMulti: function(multi, parent_id, user){
    	return new Promise(function(resolve, reject){
    		if(multi===true){
    			return resolve();
    		}
    		else {
    			if(typeof parent_id === 'undefined'){
    				return resolve();
    			}
    			else {
    				// Magic
    				var model = new ScopeModel();
    				model.getScope(parent_id, user, function(err, d){
    					if(err) return reject();
    					if(d===null){
    						return reject();
    					}
    					if(d.parent_id==='orphan'){
    						return reject("invalid parent")
    					}
    					return resolve();
    				});
    			}
    		}
    	});
    },
    isValidTimezone: function(timezone){
      return moment.tz.zone(timezone) !== null;
    },
    validDbschema: function(dbschema, owndbschema){
      	return new Promise(function(resolve, reject){

          // If updating own dbschema
          if(dbschema===owndbschema) return resolve();

      		var model = new ScopeModel();
      		model.getReducedScopes(function(err, d){
      			if(err) return reject();
      			if(typeof _.findWhere(d, {dbschema: dbschema}) === 'undefined'){
      				return resolve();
      			}
      			else {
      				return reject();
      			}
      		})
      	});
      },
    categoryInCatalogue: function(category){
        return new Promise(function(resolve, reject){
            var model = new MetadataModel();
            model.getCategoriesMetadata(function(err, d){
                if(err) return reject();
                if(typeof _.findWhere(d.rows, {id_category: category}) !== 'undefined'){
                      return resolve();

                }
                else {
                      return reject();
                }
              })
            });
    },
    validCategoryForScope: function(category, scope){
        return new Promise(function(resolve, reject){
            var model = new CategoryModel();
            model.getCategoriesForScope(scope, category, function(err, d){
                if(err) return reject();
                if(d.rows.length){
                    return reject();
                }
                else {
                    return resolve();
                }
            });
        });
    },
    entityInCatalogue: function(entity, user_id, category){
        return new Promise(function(resolve, reject){
            var model = new MetadataModel();
            model.getEntitiesMetadata(user_id, function(err, d){
                if(err) return reject();
                var cat = _.findWhere(d, {id: category});
                if(typeof cat !== 'undefined'){
                  var entityobj = _.findWhere(cat.entities, {id: entity});
                  if(typeof entityobj !== 'undefined'){
                    return resolve();
                  }
                }

                return reject();
            });
        });
    },
    validEntityForScope: function(entity, scope, category){
        return new Promise(function(resolve, reject){
            var model = new EntitiesModel();
            model.getEntitiesForCategory(scope, category, function(err, d){
                log.error(err);
                log.error(entity, scope, category);

                log.error(d);
                if(err) return reject();
                if(d.rows.length){
                  var found = _.findWhere(d.rows, {id_entity: entity})
                  if(typeof found !== 'undefined') return reject();
                }
                return resolve();
            });
        });
    }

}
