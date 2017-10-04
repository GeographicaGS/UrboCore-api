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
var CartoModel = require('./cartomodel');
var cons = require('../cons');
var utils = require('../utils');
var modelutils = require('./modelutils');
var log = utils.log();
var auth = require('../auth.js');



class CategoryCartoModel extends CartoModel {
  constructor(cfg) {
    super(cfg);
  }

  createDBTables(opts) {
    log.debug(`Start Carto transaction for ${opts.category}...`);

    var params = {
      scope: opts.scope,
      category: opts.category,
      category_name: opts.category_name,
      carto_user: opts.carto.user
    };

    var sql = `SELECT urbo_categories_ddl('{{scope}}', '{{category}}',
            '{{category_name}}', false, true, '{{carto_user}}');`;

    return this.query({
      'query': sql,
      'params': params
    });
  }

}

module.exports = CategoryCartoModel;
