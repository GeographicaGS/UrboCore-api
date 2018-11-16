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

var express = require('express');
var router = express.Router();
var utils = require('../../utils');
var log = utils.log();
var responseValidator = utils.responseValidator;
var util = require('util');
var cons = require('../../cons.js');
var auth = require('../../auth.js');
var ScopeModel = require('../../models/scopemodel');
var DBUsersModel = require('../../models/dbusersmodel');
var categories = require('./categories'),
  entities = require('./entities'),
  variables = require('./variables'),
  permissions = require('./permissions'),
  generators = require('./generators');
var OrionDeMA = require('../../orioncb/oriondema');
var checkDeMA = require('../../middlewares/dema');
var config = require('../../config');


function checkScope(req, res, next) {
  auth.protectScopes([req.params.scope], ['read'], {'notfound_action': 'notfound'})(req, res, next);
}


// Categories, entities, variables, permissions
router.use('/:scope/categories', checkScope, checkDeMA, categories);
router.use('/:scope/entities', checkScope, entities);
router.use('/:scope/variables', checkScope, variables);
router.use('/:scope/permissions', checkScope, permissions);
router.use('/:scope/generators', checkScope, generators);


/* Scope list */
router.get('/', function(req, res, next) {
  new ScopeModel().getScopeForAdmin(null, res.user, function(err, scopeList) {
      if (err) {
        next(err);
      } else {
        res.json(scopeList);
      }
  });
});

router.get('/:scope', checkScope, function(req, res, next) {
  new ScopeModel().getScopeForAdmin(req.params.scope, res.user, function(err, data) {
    if (err) {
      log.error('Devices map: Error when selecting data');
      next(err);

    } else {
      res.json(data[0]);
    }
  });
});


var addScopeValidator = function(req, res, next){
  // Sync Validation
  req.sanitize('name').trim();
  req.checkBody('name', 'required').notEmpty();
  req.checkBody('location', '2-dimensional array required').optional().isLocation();
  req.checkBody('zoom', 'int >0 required').optional().isInt().isZoom();
  req.checkBody('multi', 'boolean required').isBoolean();
  req.checkBody('timezone', 'invalid timezone').optional().isValidTimezone();
   // Async Validation
  req.checkBody('multi', 'invalid or non-existent parent_id').optional().validMulti(req.body.parent_id, res.user);

  return next();
};

/* Create Scope */
router.post('/',
  addScopeValidator,
  responseValidator,
  checkDeMA,
  function(req, res, next){

    // Actual insertion
    var model = new ScopeModel();
    model.addAdminScopes(req.body, function(err, data){
      if(err){
        return next(err);
      }
      else {
        if ( config.getData().generators.ymlConnectorGenerator === true ) {

          let dbusersmodel = new DBUsersModel();
          dbusersmodel.createScopeDBUser(data.id)
          .then(function(opts){
            return dbusersmodel.saveScopeUserPassword(opts.scope, opts.user_password)
          })
          .then( function(d){

            if (req.withDeMA) {
              let dema = new OrionDeMA(config.getDeMA(res.locals.dema_access_token));
              dema.updateScopeStatus(data.id, 'created', res.user)
              .then( function(d){
                return res.status(201).json(data);
              })
            } else {
              return res.status(201).json(data);
            }

          })
          .catch(function(errors) {
            console.error(errors);
            return res.status(400).json(errors);
          });

        } else {

          if (req.withDeMA) {
            let dema = new OrionDeMA(config.getDeMA(res.locals.dema_access_token));
            dema.updateScopeStatus(data.id, 'created', res.user)
            .then( function(d){
              return res.status(201).json(data);
            })
          } else {
            return res.status(201).json(data);
          }

        }

      }
    });
});

var updateScopeValidator = function(req, res, next){
  req.sanitize('name').trim();

  // Sync Validation
  req.checkBody('zoom', 'int >0 required').optional().isInt().isZoom();
  req.checkBody('status', 'int required').optional().isInt();
  req.checkBody('location', '2-dimensional array required').optional().isLocation();
  req.checkBody('timezone', 'invalid timezone').optional().isValidTimezone();

  return next();
};

router.put('/:scope',
  checkScope,
  updateScopeValidator,
  responseValidator,
  checkDeMA,
  function(req, res, next){

    var model = new ScopeModel();
    model.updateAdminScopes(req.params.scope,
      req.body,
      function(err, data){
        if(err){
          return next(err);
        }
        else {
          if (req.withDeMA) {
            let dema = new OrionDeMA(config.getDeMA(res.locals.dema_access_token));
            dema.updateScopeStatus(req.params.scope, 'updated', res.user)
            .then( d => {
              return res.sendStatus(200);
            })
          }
          else { return res.sendStatus(200); }

        }
    });
});

router.delete('/:scope',
  checkScope,
  checkDeMA,
  function(req, res, next){

  var model = new ScopeModel();
  model.deleteAdminScopes(req.params.scope, function(err, status){
    if(err){
      next(err);
    }
    else {
      if(status==='ok'){

        if ( config.getData().generators.ymlConnectorGenerator === true ) {

          let dbusersmodel = new DBUsersModel();
          dbusersmodel.deleteScopeDBUser(req.params.scope)
          .then( function(da){

            if (req.withDeMA) {
              var dema = new OrionDeMA(config.getDeMA(res.locals.dema_access_token));
              dema.deleteScope(req.params.scope)
              .then( d => {
                return res.json({status: status});
              })
            }
            else { return res.json({status: status}); }

          })
          .catch(function(errors) {
            console.error(errors);
            return res.status(400).json(errors);
          });
        } else {

          if (req.withDeMA) {
            var dema = new OrionDeMA(config.getDeMA(res.locals.dema_access_token));
            dema.deleteScope(req.params.scope)
            .then( d => {
              return res.json({status: status});
            })
          }
          else { return res.json({status: status}); }

        }
      }
      else{
        res.sendStatus(404);
      }
    }
  });
});

// Children
router.get('/:scope/multi/children', checkScope, function(req, res, next){
  var model = new ScopeModel();
  model.getChildrenForScope(req.params.scope, function(err, children){
    if(err){
      next(err);
    }
    else {
      res.json(children);
    }
  });
});



module.exports = router;
