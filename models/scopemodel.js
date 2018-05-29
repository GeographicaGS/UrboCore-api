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
var _ = require('underscore');
var PGSQLModel = require('./pgsqlmodel.js');
var MetadataInstanceModel = require('./metadatainstancemodel');
var cons = require('../cons.js');
var utils = require('../utils');
var log = utils.log();
var auth = require('../auth.js');

function ScopeModel(cfg) {
  PGSQLModel.call(this, cfg);
}

util.inherits(ScopeModel, PGSQLModel);

ScopeModel.prototype.queryData = function(sql, bindings, cb) {
  this.query(sql, bindings, cb);
}

ScopeModel.prototype.getScopeList = function(user_id, multi, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getScopeList(user_id, multi, cb);
}

ScopeModel.prototype.getScopeMetadata = function(scope, user, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getMetadataForScope(scope, user, cb);
}

ScopeModel.prototype.getScopeForAdmin = function(scope, user, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getScopesWithMetadata(scope, user, cb);
}

ScopeModel.prototype.getScope = function(scope, user, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getScope(scope, user, cb);
}

ScopeModel.prototype.getAdminScopes = function(user, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getAdminScopes(user, cb);
}

ScopeModel.prototype.getReducedScopes = function(cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getReducedScopes(cb);
}

ScopeModel.prototype.addAdminScopes = function(data, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.createScope(data, cb);
}

ScopeModel.prototype.updateAdminScopes = function(scope, data, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.updateScope(scope, data, cb);
}

ScopeModel.prototype.deleteAdminScopes = function(scope, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.deleteScope(scope, cb);
}

ScopeModel.prototype.getChildrenForScope = function(scope, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getChildrenForScope(scope, cb);
}

module.exports = ScopeModel;
