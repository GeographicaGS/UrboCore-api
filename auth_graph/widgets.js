'use strict';

var router = require('express').Router();
var jwt = require('jwt-simple');
var _ = require('underscore');
var utils = require('../utils');
var log = utils.log();
var utils = require('../utils');
var responseValidator = utils.responseValidator;
var Model = require('./model.js');

// WIDGET PUBLICATION

// router.get('/token/:token', function(req, res, next) {
//   var opts = {
//     token: req.params.token
//   }
//   new Model().getWidgetByToken(req.params.token)
//   .then((function(data){
//     return this.promiseRow(data);
//   }).bind(this))
//   .then(function(d){
//       let result = d.rows[0];
//       delete result.id;
//       res.status(200).json(result);
//   })
//   .catch(function(err){
//     var error = new Error(err);
//     error.status = 400;
//     return next(error);
//   })
// })


router.get('/:widget', function(req, res, next) {
  var opts = {
    scope: req.scope,
    widget: req.params.widget
  }
  new Model().getWidgetsByTypeAndScope(req.scope, req.params.widget)
  .then(function(d) {
    res.status(200).json(d.rows);
  })
  .catch(function(err) {
    var error = new Error(err);
    error.status = 400;
    return next(error);
  })
});



var publishValidator = function(req, res, next) {
  req.check('widget', 'id_widget required').notEmpty();
  req.checkBody('name', 'name required').notEmpty();
  req.checkBody('payload', 'payload required').notEmpty();
  return next();
}

router.post('/',
  publishValidator,
  responseValidator,
  function(req, res, next) {

    var host = req.headers['x-custom-host'] || (req.protocol + '://' + req.get('host'));
    var opts = {
      widget: req.body.widget,
      scope: req.scope,
      publish_name: req.body.name,
      description: req.body.description,
      payload: req.body.payload
    }

    opts.token = jwt.encode(opts.payload, req.app.get('jwtTokenSecret'));

    // Default metadata stuff
    opts.payload.push({
      url: host + '/scopes/' + req.scope + '?access_token_public=' + opts.token,
      data: {}
    })

    opts.payload.push({
      url: host + '/scopes?access_token_public=' + opts.token,
      data: {}
    })


    opts.payload.push({
      url: host + '/scopes/' + req.scope + '/metadata?access_token_public=' + opts.token,
      data: {}
    })

    opts.payload.push({
      url: host + '/metadata?access_token_public=' + opts.token,
      data: {}
    })



    new Model().publishWidget(opts)
    .then(function(data) {
      res.status(201).json(data.rows[0]);
    })
    .catch(function(err) {
      res.status(400).json(err);
    });
  });

var unpublishValidator = function(req, res, next) {
  req.check('id', 'id required').notEmpty();
  return next();
}

router.delete('/:id',
  unpublishValidator,
  responseValidator,
  function(req, res, next) {
    new Model().unpublishWidget(req.params.id)
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      res.status(400).json(err);
    });
  });



module.exports = router;