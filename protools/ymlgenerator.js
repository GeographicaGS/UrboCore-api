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


var _ = require('underscore');
var utils = require('../utils');
var log = utils.log();
// var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');
// var ymal = require('json2yaml'), connectorConfig;
var mergeYaml = require('merge-yaml-cli')

class YMLGenerator {

  constructor() {
    this.configPath = 'configPath';
  }

  createConfigFile() {

    var connectorConfigFile  = mergeYaml.merge(['../base.yml', '../configurated.yml']);
    log.info(connectorConfigFile);

    mergeYaml.on('files', ['../base.yml', '../configurated.yml']);

    return connectorConfigFile;
  }

}

module.exports = YMLGenerator;
