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
var maps = require('./routes/maps');
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
var generators = require('./routes/admin/generators');
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

// Allow bigger payload size (up to 5mb)
app.use(bodyParser.json({limit: "5mb"}));
app.use(bodyParser.urlencoded({limit: "5mb", extended: true, parameterLimit:5000}));

// Enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token, X-Access-Token-Public, DeMA-Access-PSK');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');

  if (req.method === 'OPTIONS') {
    res.send();
  } else {
    next()
  }
});

// Loading access logger
var logParams = config.getLogOpt();
app.use(log4js.connectLogger(log, logParams.access));  // Morgan substitute
log.info('Access logger successfully started');

// Static Resources (used bz aquasig demo)
app.use('/uploads', express.static(__dirname + '/uploads'));

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
app.use('/:scope/maps', auth.publishedOrLogged, maps);
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
