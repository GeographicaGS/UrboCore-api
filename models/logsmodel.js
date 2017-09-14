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
