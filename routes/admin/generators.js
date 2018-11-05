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

var auth = require('../../auth.js');
var express = require('express');
var fs = require('fs');
var router = express.Router();
var path = require("path");
var utils = require('../../utils');
var log = utils.log();

var YMLGenerator = require('../../protools/ymlgenerator');


/*
* Connector Config Generator
*/
router.get('/configs/connector/:category/:scope',auth.publishedOrLogged,function(req, res, next) {

  var ymlGenerator = new YMLGenerator();
  log.info(ymlGenerator.configPath);
  var ymlDoc = ymlGenerator.createConfigFile();


  // res.setHeader('Content-disposition', 'attachment; filename=connectorConfigYaml.csv');
  // res.set('Content-Type', 'text/plain');
  // res.set('Content-transfer-encoding', 'base64');
  // res.send(new Buffer(ymlGenerator.configPath));

  res.send('ymlDoc');


});


module.exports = router;
