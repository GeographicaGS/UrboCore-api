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

var request = require('request');
var utils = require('../utils');
var log = utils.log();


function getAuthToken(subs) {

  if (!subs.portAuthtk) return Promise.resolve('');

  var data = {
    'auth': {
      'identity': {
        'methods': [
          'password'
        ],
        'password': {
          'user': {
            'domain': {
              'name': subs.service
            },
            'name': subs.user,
            'password': subs.password
          }
        }
      }
    }
  };

  var options = {
    'url': `${subs.urlCtxAuthBase}:${subs.portAuthtk}/v3/auth/tokens`,
    'method': 'POST',
    'rejectUnauthorized': false,
    'json': data
  };


  return new Promise(function(resolve, reject) {
    request(options, function (error, response, body) {
      if (!error) {
        resolve(response.headers['x-subject-token']);
      }
      else {
        reject(error);
      }
    });
  });
}

module.exports.getAuthToken = getAuthToken;
