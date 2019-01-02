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
var _ = require('underscore');
var router = express.Router({mergeParams: true});
var ScopeModel = require('../../models/scopemodel');
var UsersModel = require('../../models/usersmodel');
var auth = require('../../auth.js');
var utils = require('../../utils.js');
var util = require('util');
var log = utils.log();

function getResource(req,res,next){

  // TODO Improve validators
  req.checkParams('id_resource', 'required').notEmpty();
  var errors = req.validationErrors();
  if (errors)
    return res.status(400).json(errors);

  var id_resource = req.params.id_resource;

  auth.findByNamesInScope(req.params.scope,[id_resource],function(err,nodes){
    if (err)
      return next(err);

    if (!nodes || !nodes.length)
      return next(utils.error('Resouce not found',404));

    var users = nodes[0].read_users;

    // // Append own user is superadmin
    // if(res.user.superadmin){
    //   users.push(res.user.id);
    // }

    var um = new UsersModel();
    um.getUsersInList(users,function(err,data2){
      if (err)
        return next(err);
      res.json(data2);
    });
  });

}

router.get('/:id_resource', getResource);

// get all permissions
router.get('/', function(req, res, next){
  req.params.id_resource = req.params.scope;
  next();
}, getResource);


router.put('/:id_resource?', function(req, res, next){

  // TODO: Validators

  var scopemodel = new ScopeModel();
  scopemodel.getChildrenForScope(req.params.scope, function(err, children){
        var resource = req.params.id_resource;
        if(!resource){
            resource = req.params.scope;
        }

    // Repeat for scope and children, if multi
    var scopes = [req.params.scope];
    _.each(children, function(child){
      scopes.push(child.id);
    });


    var errors = [];
    _.each(scopes, function(scope){
      // Repeat for every operation for every scope, if 'add' or 'rm'
      for(operation in req.body){
        if(operation==='add' || operation==='rm'){
          _.each(req.body[operation], function(user_id){
              var usersmodel = new UsersModel();

              usersmodel.users_graph_operation(scope, resource, user_id, 'read', operation, function(err, d){
                if(err){
                    errors.push({
                        msg: err,
                        param: resource
                    });
                }
                log.error(err);
                log.error(d);
              });
          });
        }
      };
    });

    if(!errors.length){
        res.sendStatus(200);
    }
    else {
        res.send(400).json(errors);
    }
  });
});


module.exports = router;
