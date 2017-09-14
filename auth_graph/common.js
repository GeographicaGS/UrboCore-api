'use strict';

var config = require('../config');
var jwt = require('jwt-simple');


function getPublicToken(opts) {
  var secret = config.getData().auth.token_secret;
  var token = jwt.encode(opts, secret);
  return token;
}


module.exports.getPublicToken = getPublicToken;