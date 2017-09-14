'use strict';

var util = require('util'),
  PGSQLModel = require('./pgsqlmodel');

function BaseMetaDataModel(cfg) {
  PGSQLModel.call(this,cfg);
}

util.inherits(BaseMetaDataModel, PGSQLModel);


module.exports = BaseMetaDataModel;