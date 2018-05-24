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

var OrionBaseV2 = require('./orionbasev2.js');
var utils = require('../utils.js');
var log = utils.log();
var moment = require('moment');
var MD = require('../models/metadatainstancemodel.js');
var crypto = require('crypto');
var config = require('../config.js');

function makeApi(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for ( var i=0; i < length; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function verticalTranslator(vertical) {
  var demaConfig = config.getData().dema;
  var demaVerticals = demaConfig && demaConfig.vertical_translator
    ? demaConfig.vertical_translator
    : {};
  return demaVerticals[vertical] || vertical;
}

function hasher(key) {
  return key;
}


class OrionDeMA extends OrionBaseV2 {

  constructor(subs) {
    super(subs);
  }

  updateScopeStatus(scope, action) {

    if (action !== 'created' && action !== 'updated' && action !== 'deleted') return Promise.resolve();

    return new Promise((resolve, reject) => {

      let model = new MD();
      model.getScopeForAdmin(scope, null, (error, data) => {
        data = data[0];
        if (error) return reject(error);

        let updtdata = {
          'id': data.id,
          'type': 'scope',
          'name': {
            'type': 'Text',
            'value': data.name
          },
          'mapcenter': {
            'type': 'Object',
            'value': {
              'lat': data.location[0],
              'lng': data.location[1],
              'zoom': data.zoom
            }
          },
          'opType': {
            'type': 'Text',
            'value': action
          },
          'dateModified': {
            'type': 'DateTime',
            'value': new moment().utc().format()
          }
        }

        return resolve(this.updateContext(updtdata));

      })



    })



  }

  deleteScope(scope) {

    let updtdata = {
      'id': scope,
      'type': 'scope',
      'opType': {
        'type': 'Text',
        'value': 'deleted'
      },
      'dateModified': {
        'type': 'DateTime',
        'value': new moment().utc().format()
      }
    }

    return Promise.resolve(this.updateContext(updtdata));

  }


  updateVerticalStatus(scope, vertical, action) {

    if (action !== 'created' && action !== 'updated' && action !== 'deleted') return;

    let idKey = scope+'_'+vertical;
    let updtdata = {
      'id': hasher(idKey),
      'type': 'urbanservice',
      'name': {
        'type': 'Text',
        'value': verticalTranslator(vertical)
      },
      'opType': {
        'type': 'Text',
        'value': action
      },
      'refScope': {
        'type': 'Text',
        'value': scope
      },
      'dateModified': {
        'type': 'DateTime',
        'value': new moment().utc().format()
      }
    }

    if (action==='created') {
      updtdata.apikey = {
        'type': 'Text',
        'value': makeApi(15)
      }
    }

    return this.updateContext(updtdata);

  }

}

module.exports = OrionDeMA;
