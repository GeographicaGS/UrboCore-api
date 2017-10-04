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

var config = require('./config');
var redis = require('redis');
var utils = require('./utils');
var bluebird = require('bluebird');
var log = utils.log();

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var cacheConfig = config.getData().redis;
cacheConfig.retry_strategy = function (options) {
  if (options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
  }

  // Take a look to the 'retry_strategy' section of:
  // https://github.com/NodeRedis/node_redis#rediscreateclient
  return undefined;
};

var connErrorHandler = function(err) {
  client = null;
  log.warn('The API server COULDN\'T connect to cache, ' +
           'the cache requests will fall back to database');
};

var connSuccessHandler = function() {
  client.removeListener('error', connErrorHandler);
  client.flushdb();
  client.keyTTL = cacheConfig.ttl;
  log.info('The API server IS connected to cache and has cleaned it');
};

var client = null;
if (cacheConfig.use_cache) {
  client = redis.createClient(cacheConfig);
  client.on('error', connErrorHandler);
  client.on('connect', connSuccessHandler);

} else {
  log.info('The API server is NOT connected to cache because is set in the ' +
           'configuration');
}

module.exports = client;
