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
var config = require('../config');
var utils = require('../utils');
var log = utils.log();
var util = require('util');
var cons = require('../cons.js');
var auth = require('../auth.js');
var ScopeModel = require('../models/scopemodel');

/* Scope list */
router.get('/', function(req, res, next) {
  try {
    var multi = JSON.parse(req.query.multi.toLowerCase());
    multi = (typeof multi === 'boolean') ? multi : null;

  } catch (e) {
    multi = null;
  }

  if (res.locals.publishedWidget) {
    res.user = {id: cons.PUBLISHED};
  }

  var model = new ScopeModel();
  model.getScopeList(res.user.id, multi, function(err, scopeList) {
    if (err) {
      log.error('Devices map: Error when selecting data');
      next(err);

    } else {
      res.json(scopeList);
    }
  });
});

function checkScope(req, res, next) {
  if (res.locals.publishedWidget) {
    res.user = {id: cons.PUBLISHED};
    return next();
  }

  else
    auth.protectScopes([req.params.scope], ['read'], {'notfound_action': 'notfound'})(req, res, next);
}

router.get('/:scope', checkScope, function(req, res, next) {
  var model = new ScopeModel();
  model.getScope(req.params.scope, res.user, function(err, data) {
    if (err) {
      log.error('Devices map: Error when selecting data');
      next(err);

    } else {
      res.json(data);
    }
  });
});


router.get('/:scope/metadata', checkScope, function(req, res, next) {
  var model = new ScopeModel();
  model.getScopeMetadata(req.params.scope, res.user, function(err, data) {
    if (err) {
      log.error('Error getting metadata for scope');
      next(err);
    } else {
      res.json(data);
    }
  });
});

module.exports = router;
