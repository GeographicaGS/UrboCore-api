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

ScopeModel.prototype.getScopeForAdmin = function(scope, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getScopeForAdmin(scope, cb);
}


ScopeModel.prototype.getScope = function(scope, user, cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getScope(scope, user, cb);
}

ScopeModel.prototype.getAdminScopes = function(cb) {
  var metadata = new MetadataInstanceModel();
  return metadata.getAdminScopes(cb);
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
