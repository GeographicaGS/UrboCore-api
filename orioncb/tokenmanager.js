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
