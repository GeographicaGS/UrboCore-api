'use strict';

var request = require('request');
var tokenManager = require('./tokenmanager');
var utils = require('../utils');
var log = utils.log();


class OrionBase {

  constructor(subs) {
    this._subs = subs;
  }

  getSubsConfig() {
    return {
      'service': this._subs.service,
      'subservice': this._subs.subservice,
      'urlCtxBrBase': this._subs.urlCtxBrBase,
      'urlCtxAuthBase': this._subs.urlCtxAuthBase || this._subs.urlCtxBrBase,
      'portAuthtk': this._subs.portAuthtk,
      'portCtxApi': this._subs.portCtxApi,
      'user': this._subs.user,
      'password': this._subs.password
    };
  }

  updateContext(updtdata) {

    var subsconfig = this.getSubsConfig();

    return tokenManager.getAuthToken(subsconfig)
    .then(function(authtoken) {
      log.debug('Orion auth token successfully created');

      var headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Fiware-Service': subsconfig.service,
        'Fiware-ServicePath': subsconfig.subservice,
        'x-auth-token': authtoken
      };

      var data = {
        'contextElements': [
          {
            'type': updtdata.type,
            'isPattern': 'false',
            'id': updtdata.id_entity,
            'attributes': updtdata.attributes
          }
        ],
        'updateAction': 'UPDATE'
      };

      var options = {
        'headers': headers,
        'url': `${subsconfig.urlCtxBrBase}:${subsconfig.portCtxApi}/v1/updateContext`,
        'method': 'POST',
        'rejectUnauthorized': false,
        'json': data
      };

      return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
          var res = response.body.contextResponses;

          return resolve(response); // Until CB working fine

         /*
         if (!error && res && res.statusCode.code === '200') {
            log.debug(`Update context request successful for ${updtdata.type}`);
            resolve(res);

          } else {
            log.error(error);
            log.error(res);
            reject(error);
          }
          */
        });
      });
    });
  }

}

module.exports = OrionBase;
