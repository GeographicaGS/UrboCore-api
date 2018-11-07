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
    log.info(mergedConfig);
    return mergedConfig;
  };

  createConfigFile(category, scope) {
    // define objects to merge
    var apiConfig = jsYaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
    var baseConfig = jsYaml.safeLoad(fs.readFileSync('templates/configs/base.yml', 'utf8'));
    var userConfig = jsYaml.safeLoad(fs.readFileSync('templates/configs/user.yml', 'utf8'));
    var autoConfig = jsYaml.safeLoad(fs.readFileSync('templates/configs/auto.yml', 'utf8'));
    var serviceConfig = jsYaml.safeLoad(fs.readFileSync(`verticals/${category}/connector/config.yml`, 'utf8'));

    // inject values from api config and params
    autoConfig.pgsql = apiConfig.pgsql;
    autoConfig.cartodb.apiKey = apiConfig.carto[0].api_key;
    autoConfig.cartodb.user = apiConfig.carto[0].user;
    autoConfig.processing.url = apiConfig.processing.url;
    serviceConfig.logging.file.name = `${scope}-${category}-connector`;
    serviceConfig.subscriptions.forEach(function(element, index) {
      Object.keys(element).forEach( function(key){
        if (key == 'schemaname') {
          element[key] = scope;
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
