'use strict';

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var expressValidator = require('express-validator');
var log4js = require('log4js');
var path = require('path');
var routes = require('./routes/index');
var scopes = require('./routes/scopes');
var metadata = require('./routes/metadata');
var variables = require('./routes/variables');
var devices = require('./routes/devices');
var entities = require('./routes/entities');
var indicators = require('./routes/indicators');
var users = require('./routes/users');
var admin = require('./routes/admin/admin');
var logs = require('./routes/logs');
var notifier = require('./routes/notifier');
var validators = require('./routes/validators');
var frames = require('./routes/frames');
var verticals = require('./verticals');
var auth = require('./auth');
var config = require('./config');
var utils = require('./utils');
var widgets = require('./auth_graph/widgets');
var app = express();
var cfgData = config.getData();
var log = utils.log();

// Saving config
app.set('config', cfgData);

// Auth
app.set('jwtTokenSecret', cfgData.auth.token_secret);
app.set('jwtTokenExpiration', cfgData.auth.token_expiration || 600);

var notifierTokenSecret = cfgData.notifier ? cfgData.notifier.token_secret : '';
app.set('jwtNotifierTokenSecret', notifierTokenSecret);

// Enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token, X-Access-Token-Public, DeMA-Access-PSK');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  next();
});

// Loading access logger
var logParams = config.getLogOpt();
app.use(log4js.connectLogger(log, logParams.access));  // Morgan substitute
log.info('Access logger successfully started');

// Data middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressValidator({ customValidators: validators }));

// Routes
app.use('/', routes);
app.use('/auth',auth.routes);

// Plublication widgets API
app.use('/:scope/auth/widget', auth.logged, auth.protectSuperAdmin, widgets);

app.use('/metadata', metadata);
app.use('/scopes',auth.publishedOrLogged,scopes);

app.param('scope', function (req, res, next, id) {
  req.scope = req.params.scope;
  next();
});

app.param('category', function (req, res, next, id) {
  req.category = req.params.category;
  next();
});

app.use('/logs', auth.logged, logs);
app.use('/users', auth.logged,users);
app.use('/:scope/devices', auth.publishedOrLogged, devices);
app.use('/:scope/entities', auth.publishedOrLogged, entities);
app.use('/:scope/frames', auth.publishedOrLogged, frames);
app.use('/:scope/variables', auth.publishedOrLogged, variables);
app.use('/:scope/:category/indicators', auth.publishedOrLogged, indicators);

verticals(app);  // Load the routes of the installed verticals

// Sockets notifictions
app.use('/notifier', auth.checkNotifierToken, notifier);

// Admin API
app.use('/admin', auth.logged, auth.protectSuperAdmin, admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    log.error('[%d] %s',err.status,err.message);
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  log.error('[%d] %s',err.status,err.message);
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});


module.exports = app;
