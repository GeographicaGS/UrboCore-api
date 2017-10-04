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
var router = express.Router();
var utils = require('../utils');
var log = utils.log();
var MetadataModel = require('../models/metadatamodel');
var auth = require('../auth.js');


/*
* Get all metadata
*/
//router.get('/metadata',auth.logged,function(req, res, next) {
router.get('/',auth.publishedOrLogged,function(req, res, next) {
  var model = new MetadataModel();

  if (res.locals.publishedWidget) {
    res.user = { id: 1}
  }

  model.getEntitiesMetadata(res.user.id, function(err,r) {
    if (err) {
      log.error('Metadata: Error when selecting data');
      next(err);
    } else {
      res.json(r);
    }
  });
});


module.exports = router;
