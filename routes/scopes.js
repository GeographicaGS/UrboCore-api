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
