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

var express = require('express');
var auth = require('../../auth.js');
var _ = require('underscore');
var fs = require('fs');
var router = express.Router({mergeParams: true});
var ScopeModel = require('../../models/scopemodel');
var UsersModel = require('../../models/usersmodel');
var path = require("path");
var mime = require('mime');
var utils = require('../../utils.js');
var util = require('util');
var YMLGenerator = require('../../protools/ymlgenerator');
var log = utils.log();


/*
* Connector Config Generator
*/
router.get('/config/connector/:category',auth.protectSuperAdmin,function(req, res, next) {

  // set variables
  var category = req.params.category;
  var id_scope = req.params.scope;

  // create merged yaml
  var ymlGenerator = new YMLGenerator();

  ymlGenerator.getScopeUserPassword(id_scope)
  .then(
    dbuser_password => {

      var ymlDoc = ymlGenerator.createConfigFile(category, id_scope, dbuser_password);

      // send response
      var mimetype = mime.lookup(ymlDoc);
      res.setHeader('Content-disposition', `attachment; filename=connector_${category}_${id_scope}_config.yml`);
      res.setHeader('Content-type', mimetype);
      res.setHeader('Content-transfer-encoding', 'base64');
      res.send(ymlDoc);
      res.end();

    }
  )

});


module.exports = router;
