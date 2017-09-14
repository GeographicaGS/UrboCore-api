var config = require('./config');
var log = require('log4js');
var json2csv = require('json2csv');

var _log = function() {
  var logParams = config.getLogOpt();
  return log.getLogger(logParams.output);
};

module.exports.log = _log;

module.exports.error = function(msg,status){
  var err = new Error(msg);
  err.status = status || 500;
  return err;
}

module.exports.json2csvWrapper = function(opts, cb) {
  if (opts.data.length <= 0) {
    return cb(null, '');
  }

  json2csv(opts, function(err, csv) {
    if (err) {
      return cb(err);
    }

    return cb(null, csv);
  });
};

module.exports.timesValidator = function(req, res, next){
  // Sync validators
  req.checkBody('time.start', 'required').notEmpty();
  req.checkBody('time.finish', 'required').notEmpty();

  return next();
};

module.exports.responseValidator = function(req, res, next){
  var errors = req.validationErrors();
  if (errors) {
    _log().error(errors);
    return res.status(400).json(errors);
  } else {
    return req.asyncValidationErrors()
    .then(function(){
      return next();

    })
    .catch(function(errors){
      _log().error(errors);
      return res.status(400).json(errors);

    });
  }
}
