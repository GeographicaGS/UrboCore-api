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
