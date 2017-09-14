'use strict';

var express = require('express');
var router = express.Router();
var utils = require('../utils');
var log = utils.log();
var Socket = require('./socket');

router.post('/', function(req, res, next) {
  res.json({status: 'ok'});

  var socket = new Socket();
  socket.send(req.body.namespace, req.body.data);
});

module.exports = router;
