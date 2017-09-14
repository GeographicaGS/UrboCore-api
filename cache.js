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
