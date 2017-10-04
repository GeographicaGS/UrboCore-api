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
var tokenManager = require('./tokenmanager');
var OrionBase = require('./orionbase');
var utils = require('../utils');
var log = utils.log();


class OrionBaseV2 extends OrionBase {

  constructor(subs) {
    super(subs);
  }

  updateContext(updtdata) {

    var subsconfig = this.getSubsConfig();

    return tokenManager.getAuthToken(subsconfig)
    .then( authtoken => {

      log.debug('Orion auth token successfully created');

      var headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Fiware-Service': subsconfig.service,
        'Fiware-ServicePath': subsconfig.subservice,
        'x-auth-token': authtoken
      };


      var options = {
        'headers': headers,
        'url': `${subsconfig.urlCtxBrBase}:${subsconfig.portCtxApi}/v2/op/update`,
        'method': 'POST',
        'rejectUnauthorized': false,
        'json': {
          'actionType': 'APPEND',
          'entities': [updtdata]
        }

      };

      return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
          if (error) return reject(error);
          return resolve(response.statusCode); // Until CB working fine

        });
      });
    })
    .catch( error => {
      return Promise.reject(error);
    });
  }

}

module.exports = OrionBaseV2;
