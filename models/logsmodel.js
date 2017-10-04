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

var _ = require('underscore');
var modelutils = require('./modelutils.js');
var PGSQLModel = require('./pgsqlmodel');
var util = require('util');
var utils = require('../utils');
var log = utils.log();


class LogsModel extends PGSQLModel {
  constructor(cfg) {
    super(cfg);
  }

  get this() {
    return this; // Because parent is not a strict class
  }

  getTotalPageViews(opts) {

    var sql = `
      SELECT
        url, count(*) as pageviews
      FROM logs_registry.user_weblogs
      WHERE timeinstant >= $1::timestamp
        AND timeinstant < $2::timestamp
      GROUP BY url
      ORDER BY pageviews desc`;

    return this.cachedQuery(sql,[opts.start,opts.finish])
    .then(function(results) {
      return Promise.resolve(results.rows);
    });
  }

  getUserPageViews(opts) {

    var sql = `
      SELECT
        url, count(*) as pageviews
      FROM logs_registry.user_weblogs
      WHERE id_user = $1
        AND timeinstant >= $2::timestamp
        AND timeinstant < $3::timestamp
      GROUP BY url
      ORDER BY pageviews desc`;

    return this.cachedQuery(sql,[opts.id_user,opts.start,opts.finish])
    .then(function(results) {
      return Promise.resolve(results.rows);
    });
  }


  getUserLastLogin(id_user) {

    var sql = `
      SELECT MAX(timeinstant) as lastlogin
        FROM logs_registry.user_weblogs
      WHERE id_user = $1`;

    return this.promise_query(sql,[id_user])
      .then(function(results) {
        return Promise.resolve(results);
      });
  }

  storeUserPageView(opts) {

    var sql = `
      INSERT INTO logs_registry.user_weblogs
        (url, user_ip, id_user, timeinstant)
        VALUES (
          $1, $2,$3,now()
        )`;

    return this.promise_query(sql,[opts.url,
      opts.user_ip,opts.id_user])
    .then(function(results) {
      return Promise.resolve(results);
    });
  }

}


module.exports = LogsModel;
