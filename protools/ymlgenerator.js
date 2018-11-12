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

var utils = require('../utils');
var DBUsersModel = require('../models/dbusersmodel');
var log = utils.log();
var fs = require('fs');
var path = require('path');
var mergeYaml = require('merge-yaml');
var jsYaml = require('js-yaml');
var lodash = require('lodash');

class YMLGenerator {


  constructor() {
  }


  mergeYaml(yamlsArray) {
    var mergedConfig;
    yamlsArray.forEach(function (yaml) {
      var parsedConfig = yaml;
      if (!mergedConfig) {
        mergedConfig = parsedConfig;
      } else {
        lodash.merge(mergedConfig, parsedConfig);
      }
    });
    return mergedConfig;
  }


  getScopeUserPassword(id_scope) {
    let dbusersmodel = new DBUsersModel();
    return dbusersmodel.getScopeUserPassword(id_scope);
  }


  createConfigFile(category, id_scope, scope_db_user_password) {

    // define objects to merge
    var apiConfig = jsYaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
    var baseConfig = jsYaml.safeLoad(fs.readFileSync('templates/configs/base.yml', 'utf8'));
    var userConfig = jsYaml.safeLoad(fs.readFileSync('templates/configs/user.yml', 'utf8'));
    var autoConfig = jsYaml.safeLoad(fs.readFileSync('templates/configs/auto.yml', 'utf8'));
    var serviceConfig = jsYaml.safeLoad(fs.readFileSync(`verticals/${category}/connector/config.yml`, 'utf8'));

    // inject options
    autoConfig.pgsql = apiConfig.pgsql;
    autoConfig.pgsql.user = id_scope;
    autoConfig.pgsql.password = scope_db_user_password;
    autoConfig.cartodb.apiKey = apiConfig.carto[0].api_key;
    autoConfig.cartodb.user = apiConfig.carto[0].user;
    autoConfig.processing.url = apiConfig.processing.url;
    if (apiConfig.processing.auth.user) {
      autoConfig.processing.auth.user = apiConfig.processing.auth.user;
      autoConfig.processing.auth.password = apiConfig.processing.auth.password;
    }
    serviceConfig.logging.file.name = `${id_scope}-${category}-connector`;
    serviceConfig.subscriptions.forEach(function(element, index) {
      Object.keys(element).forEach( function(key) {
        if (key === 'schemaname') {
          element[key] = id_scope;
        }
      });
    });

    // merge yamls - The last files will take the highest precedence
    var connectorConfigFile = this.mergeYaml(
      [
        baseConfig,
        userConfig,
        autoConfig,
        serviceConfig
      ]
    )

    return jsYaml.safeDump(connectorConfigFile);
  }

}

module.exports = YMLGenerator;
