'use strict';

const config = require('../config');
module.exports = function(req, res, next) {
  let token = req.headers['dema-access-psk'];
  req.withDeMA = config.getDeMA(token);
  if (req.withDeMA) {
    res.locals.dema_access_token = token;
  }

  return next();
}