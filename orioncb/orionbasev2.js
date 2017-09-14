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
