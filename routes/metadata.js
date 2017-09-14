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
