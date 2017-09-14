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
