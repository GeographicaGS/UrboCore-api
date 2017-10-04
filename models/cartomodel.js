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

var Carto = require('cartodb');
var util = require('util');
var utils = require('../utils');
var log = utils.log();


class CartoModel {

  constructor(cfg) {
    this._sql = new Carto.SQL({
      user: cfg.user,
      api_key: cfg.api_key,
      sql_api_url: `https://${cfg.user}.carto.com/api/v2/sql`
    });
  }

  query(opts) {
    var err = null;
    if (!opts)
      err = 'No params';
    else if (!opts.query)
      err = 'No query';

    opts.params = opts.params || {};

    if (err) {
      log.error(err);
      return new Promise(err);
    }
    else {

      return new Promise(function(resolve, reject) {
        this._sql.execute(opts.query, opts.params)
        .done(function(data) {
          resolve(data);
        })
        .error(function(err) {
          log.error(err);
          reject(err);
        });
      }.bind(this));
    }
  }

}

module.exports = CartoModel;
