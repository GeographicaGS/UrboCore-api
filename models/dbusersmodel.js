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

var util = require('util');
var PGSQLModel = require('./pgsqlmodel.js');
var utils = require('../utils');
var auth = require('../auth.js');
var _ = require('underscore');

var log = utils.log();

class DBUsersModel extends PGSQLModel {
  constructor(cfg) {
    super(cfg);
  }

  get this() {
    return this; // Because parent is not a strict class
  }


  createScopeDBUser(id_scope) {

    var user_password = Math.random().toString(12).slice(-15);

    var sql = `SELECT create_scope_dbuser('${id_scope}','${user_password}');`;
    return this.promise_query(sql)
    .then(function(d) {
      var opts = {'scope':id_scope, 'user_password': user_password};
      return Promise.resolve(opts);
    })
  }


  deleteScopeDBUser(id_scope) {

    var sql = `SELECT delete_scope_dbuser('${id_scope}');`;
    return this.promise_query(sql)
    .then(function(d) {
      var opts = {'scope':id_scope};
      return Promise.resolve(opts);
    })
  }


  saveScopeUserPassword(id_scope, user_password) {

    var bindings = [
      user_password,
      id_scope
    ];

    var sql = `UPDATE metadata.scopes SET user_scope_password = $1 where id_scope = $2`;
    return this.promise_query(sql, bindings)
    .then(function(d) {
      var opts = {'scope':id_scope, 'user_password': user_password};
      return Promise.resolve(opts);
    })

  }

  getScopeUserPassword(id_scope) {

    var bindings = [
      id_scope
    ];

    var sql = `SELECT user_scope_password FROM metadata.scopes where id_scope = $1 LIMIT 1`;

    return this.promise_query(sql, bindings)
    .then(function(d) {
      var user_scope_password = d.rows[0].user_scope_password;
      return Promise.resolve(user_scope_password);
    })
    .catch((err) => {
      return Promise.reject(err);
    });
  }

}

module.exports = DBUsersModel;
