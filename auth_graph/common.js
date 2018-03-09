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

var config = require('../config');
var graph = require('./graph');
var jwt = require('jwt-simple');
var Model = new require('./model.js');
var moment = require('moment');

function getPublicToken(opts) {
  var secret = config.getData().auth.token_secret;
  var token = jwt.encode(opts, secret);
  return token;
}

function insertJwtToken(user, token_expiration, token_secret, callback) {
  var expires = moment().add(token_expiration,'seconds').valueOf();

  var token = jwt.encode({
    iss: user.id,
    exp: expires
  }, token_secret);

  // store token at db
  var m = new Model();
  m.addToken({
    user: user.id,
    expires: expires,
    token: token
  }, function(error1) {
    if (error1) {
      callback(new Error('Cannot store token at db'));
    }

    graph.getUserGraph(user.id,function(error2, data2) {
      if (error2)
        callback(error2);

      callback(null, {
        token : token,
        expires: expires,
        user: user,
        graph: data2
      });
    });

  });
}

module.exports.getPublicToken = getPublicToken;
module.exports.insertJwtToken = insertJwtToken;