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

var pg = require('pg');
var utils = require('../utils.js');
var log = utils.log();
var config = require('../config.js');
var cache = require('../cache.js');
var crypto = require('crypto');

var pool = new pg.Pool(Object.assign({max:10},config.getData().pgsql));

function PGSQLModel() {

}

PGSQLModel.prototype.close = function() {
  pool.end();
  if (cache)
    cache.quit();
}

PGSQLModel.prototype.promise_query = function(sql, bindings) {

  return new Promise(function(resolve, reject) {
    pool.connect(function(err, client, done) {
      if (err) return reject(err);
      client.query(sql, bindings, function(err, r) {
        done();
        if (err) {
          log.error('Error executing query');
          log.error(sql);
          log.error(bindings);
          return reject(err);
        }
        return resolve(r);
      });
    });
  }.bind(this));
};

PGSQLModel.prototype.query = function(sql, bindings, cb) {
  this.promise_query(sql, bindings)
    .then(function(data) {
      if (cb) return cb(null, data);
      return Promise.resolve(data);
    })
    .catch(function(err) {

      log.error(err);
      if (cb) return cb(err);
      return Promise.reject(err);
    });
};

PGSQLModel.prototype.cbResults = function(cb) {
  return function(err, data) {
    if (err)
      cb(err);
    else
      cb(null, data.rows);
  };
};

PGSQLModel.prototype.cbRow = function(cb) {
  return function(err, data) {
    if (err)
      cb(err);
    else {
      if (!data||!data.rows||!data.rows.length)
        cb(err, null);
      else
        cb(err, data.rows[0]);
    }
  };
};

PGSQLModel.prototype.promiseRow = function(data) {
  if (!data || !data.rows || !data.rows.length)
    return Promise.reject('Invalid row');

  // Standard resultset
  var dataset = data.rows[0];
  dataset.historic = dataset.table_name;
  dataset.now = dataset.historic + '_lastdata';
  if ('entity_table_name' in dataset)
    dataset.now = dataset.entity_table_name + '_lastdata';

  return Promise.resolve(dataset);
};

// The callback is optional, so if it isn't used it returns a promise
PGSQLModel.prototype.pCachedQuery = function(sql, bindings) {
  var cacheKey = sql + ' - BINDINGS: ' + JSON.stringify(bindings);
  cacheKey = crypto.createHash('md5').update(cacheKey).digest('base64');

  if (cache === null) {
    log.warn('Cache isn\'t available, falling back to database');
    return this.promise_query(sql, bindings);
  }

  return cache.getAsync(cacheKey)
  .then((function(res) {
    if (res !== null) {
      log.debug('Retrieving data from cache');
      return Promise.resolve(JSON.parse(res));
    }
    else {
      // If the data doesn't exist in cache...
      return this.promise_query(sql, bindings)
      .then(function(res) {

        return cache.setAsync(cacheKey, JSON.stringify(res), 'PX',  cache.keyTTL * 60 * 1000)
        .then(function(resCache) {
          log.debug('Retrieving data from database and storing it in cache');
          return Promise.resolve(res);
        })
        .catch(function(err) {
          log.error('Error saving the query result to the cache');
          log.error(err);
          return Promise.reject(err);
        });

      })
      .catch(function(err) {
        return Promise.reject(err);
      });
    }
  }).bind(this))
  .catch(function(err) {
    log.error('Error getting the query result from the cache');
    log.error(err);
    return Promise.reject(err);
  });

}

PGSQLModel.prototype.cachedQuery = function(sql, bindings, cb) {
  return this.pCachedQuery(sql, bindings)
  .then(function(data) {
    if (cb) return cb(null, data)
    return Promise.resolve(data);
  })
  .catch(function(err) {
    if (cb) return cb(err);
    return Promise.reject(err);
  });
}



// The cache's funcionality: The functions of the cached results will be null
PGSQLModel.prototype.callbackedCachedQuery = function(sql, bindings, cb) {
  var cacheKey = sql + ' - BINDINGS: ' + JSON.stringify(bindings);
  cacheKey = crypto.createHash('md5').update(cacheKey).digest('base64');

  if (cache === null) {
    log.warn('Cache isn\'t available, falling back to database');
    return this.query(sql, bindings, function(err, res) {
      return cb(err, res);  // By-passing the query
    });
  }

  cache.get(cacheKey, function(err, res) {
    if (err) {
      log.error('Error getting the query result from the cache');
      log.error(err);
      return cb(err);
    }

    if (res != null) {
      log.debug('Retrieving data from cache');
      return cb(err, JSON.parse(res));
    }

    // If the data doesn't exist in cache...
    this.query(sql, bindings, function(err, res) {
      if (err) {
        return cb(err);  // Semi by-passing the query
      }

      // So, caching it now, with a TTL!
      cache.set(cacheKey, JSON.stringify(res), 'PX', cache.keyTTL * 60 * 1000, function(err, resCache) {
        if (err) {
          log.error('Error saving the query result to the cache');
          log.error(err);
          return cb(err);
        }

        log.debug('Retrieving data from database and storing it in cache');
        return cb(null, res);
      });
    });

  }.bind(this));
};

// The good old 'unprocessed_query' method
PGSQLModel.prototype.uq = function(sql, cb) {
  try {
    this.promise_query(sql, null)
    .then(function(data) {
      return cb(null, data);
    })
    .catch(function(err) {
      log.error(err);
      log.error(sql);
      return cb(err);
    });

  } catch (e) {
    return cb(e);
  }
};

module.exports = PGSQLModel;
