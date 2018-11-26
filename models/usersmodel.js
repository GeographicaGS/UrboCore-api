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

function UsersModel(cfg) {
  PGSQLModel.call(this,cfg);
}

util.inherits(UsersModel, PGSQLModel);


UsersModel.prototype.getUsers = function(cb) {
  var sql = 'SELECT users_id as id,name, surname,email,superadmin,ldap, (select array_agg(name) from users_graph  where parent=1 AND users_id=ANY(read_users)) as scopes from users';
  this.query(sql,null,this.cbResults(cb));
}


UsersModel.prototype.getUser = function(id,cb) {
  var sql = ['SELECT users_id as id,name, surname,email,superadmin,ldap,',
    '(select array_agg(name) from users_graph  where parent=1 AND $1=ANY(read_users)) as scopes',
    'FROM users where users_id=$1'];
  this.query(sql.join(' '),[id],this.cbRow(cb));
}


UsersModel.prototype.deleteUser = function(id, cb) {
  var _this = this;
  var sql = 'DELETE FROM users_tokens where users_id=$1';
  this.query(sql, [id], function(err, data) {
    if (err) {
      return cb(err);
    }

    sql = 'DELETE FROM users where users_id=$1'
    _this.query(sql, [id], cb);
  });
};


UsersModel.prototype.checkUserEmail = function(email,cb) {
  var sql = 'select exists(select users_id from users where email=$1) as t';
  this.query(sql,[email],function(err,data) {
    if (err)
      cb(err);
    else
      cb(null,data.rows[0].t);
  });
}


UsersModel.prototype.checkOtherUsersEmail = function(id,email,cb) {
  var sql = 'select exists(select users_id from users where email=$1 AND users_id!=$2) as t';
  this.query(sql,[email,id],function(err,data) {
    if (err)
      cb(err);
    else
      cb(null,data.rows[0].t);
  });
}


UsersModel.prototype.saveUser = function(user,cb) {
  var _this = this;

  if (!user.ldap) {
    user.ldap = false;
  }

  if (user.nocipher) {
    var sql = 'INSERT INTO users (name,surname,password,email,superadmin,ldap) values ( $1,$2,$3,$4,$5,$6) RETURNING users_id';
  }
  else {
    var sql = 'INSERT INTO users (name,surname,password,email,superadmin,ldap) values ( $1,$2,md5($3),$4,$5,$6) RETURNING users_id';
  }

  this.query(sql,[user.name,user.surname,user.password,user.email,user.superadmin,user.ldap],function(err,data) {
    if (err)
      cb(err);
    else {
      var id = data.rows[0].users_id;

      if (!user.superadmin && (!user.scopes||!user.scopes.length))
        return cb(null,id);

      var sql;
      if (user.superadmin)
        sql = 'select users_graph_node_op(1,$1,\'read\',\'add\')';
      else
        sql = 'select users_graph_node_op(id,$1,\'read\',\'add\') from users_graph where parent=1 and name in (\'' + user.scopes.join('\',\'') + '\')';

      _this.query(sql,[id],function(err) {
        if (err) cb(err);
        else cb(null,id);
      });
    }
  });
}


UsersModel.prototype.editUser = function(id,user,editpermissions,cb) {
  var _this = this;

  var sql ='UPDATE users SET name=$2,surname=$3,email=$4,superadmin=$5 WHERE users_id=$1';
  this.query(sql,[id,user.name,user.surname,user.email,user.superadmin],function(err,data) {
    if (err)
      cb(err);
    else {
      if (!editpermissions)
        return cb(null);

      var sql = 'update users_graph set read_users=array_remove(read_users,$1::bigint),write_users=array_remove(write_users,$1::bigint)';

      _this.query(sql,[id],function(err) {
        if (err) cb(err);
        else {
          if (user.superadmin)
            sql = 'select users_graph_node_op(1,$1,\'read\',\'add\')';
          else
            sql = 'select users_graph_node_op(id,$1,\'read\',\'add\') from users_graph where parent=1 and name in (\'' + user.scopes.join('\',\'') + '\')';

          _this.query(sql,[id],function(err) {
            if (err) cb(err);
            else cb(null);
          });
        }
      });
    }
  });
}


UsersModel.prototype.findSuperUsers = function(cb) {
  this.query('SELECT users_id FROM users WHERE superadmin=true', null, cb);
}


UsersModel.prototype.editPassword = function(id,password,cb) {
  var sql = 'UPDATE users SET password=md5($1) WHERE users_id=$2';
  this.query(sql,[password,id],cb);
}


UsersModel.prototype.editHashedPassword = function(id,password,cb) {
  var sql = 'UPDATE users SET password=$1 WHERE users_id=$2';
  this.query(sql,[password,id],cb);
}


UsersModel.prototype.checkOldPassword = function(id,password,cb) {
  var sql = 'select password=md5($1) as t from users WHERE users_id=$2';
  this.query(sql,[password,id],function(err,d) {
    if (err) cb(err);
    else cb(null,d.rows[0].t);
  });
}


UsersModel.prototype.getUsersInList = function(users_ids,cb) {
  var sql = util.format('SELECT users_id::int as id,name, surname,superadmin from users WHERE users_id in (%s)',users_ids.join(','));
  this.query(sql,null,this.cbResults(cb));
}


UsersModel.prototype.users_graph_operation = function(scope, id_resource, user_id, permission, operation, cb) {
  auth.findByNamesInScope(scope, [id_resource], (function(err, nodes) {
    if (err)
      return cb(err);

    if (!nodes || !nodes.length)
      return cb(utils.error('Resource not found',404));

    _.each(nodes, (function(node) {
      var resource = node.id;
      var permissionQ = 'SELECT users_graph_node_op(\'' + resource + '\',\'' + user_id + '\',\'' + permission + '\',\'' + operation + '\')';
      this.uq(permissionQ, function() {});
    }).bind(this));

    return cb(null, null);
  }).bind(this));
}


module.exports = UsersModel;
