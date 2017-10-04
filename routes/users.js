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

var express = require('express');
var router = express.Router();
var utils = require('../utils');
var auth = require('../auth.js');
var UsersModel = require('../models/usersmodel.js');

/* Get the list of users */
router.get('/',auth.protectSuperAdmin,function(req, res, next) {
  var um = new UsersModel();
  um.getUsers(function(err,data) {
    if (err)
      return next(err);

    res.json(data);
  });
});

function protectUser(req,res,next) {

  var id = req.params.id;
  if (!id)
    return next(utils.error('Bad parameters',400));

  auth.protectUserId(id)(req,res,next);
}

/* Get an user */
router.get('/:id',protectUser,function(req, res, next) {
  var um = new UsersModel();
  um.getUser(req.params.id,function(err,data) {
    if (err)
      return next(err);

    if (!data)
      return next(utils.error('User not found',404));

    res.json(data);
  });
});

/* Delete an user */
router.delete('/:id',auth.protectSuperAdmin,function(req, res, next) {
  var um = new UsersModel();
  um.deleteUser(req.params.id,function(err, data) {
    if (err)
      return next(err);
    res.json({status: 'ok'});
  });
});

/* Create a new user */
router.post('/',auth.protectSuperAdmin,function(req, res, next) {

  req.sanitize('password').trim();

  //req.check('name', 'Name is required and it must be an alphanumeric string from 3 to 30 characters').notEmpty().isAlphanumeric('es-ES').isLength({min: 3,max:80});
  req.checkBody('name', 'required').notEmpty();
  req.checkBody('name', '3 to 30 characters required').isLength({min: 3,max:30});
  req.checkBody('surname', 'required').notEmpty();
  req.checkBody('surname', '3 to 30 characters required').isLength({min: 3,max:30});
  req.checkBody('password', 'required').notEmpty();
  req.checkBody('password', '7 to 14 characters required').isLength({min: 7,max:14});
  req.checkBody('email', 'required').notEmpty();
  req.checkBody('email', 'valid email required').isEmail();
  req.checkBody('superadmin', 'required').notEmpty();
  req.checkBody('superadmin', 'boolean required').isBoolean();

  req.sanitize('superadmin').toBoolean();

  var errors = req.validationErrors();
  if (errors)
    return res.json(errors, 400);

  var d = req.body;
  var um = new UsersModel();
  um.checkUserEmail(d.email,function(err,exists) {
    if (err) return next(err);
    if (exists)
      return res.json([{param : 'email', msg: 'Email already taken', value: d.email}], 400);
    else
      um.saveUser(d,function(err,id) {
        if (err) return next(err);
        res.json({id: id});
      });
  });
});


/* Update an  user*/
router.put('/:id',protectUser,function(req, res, next) {

  req.sanitize('password').trim();

  //req.check('name', 'Name is required and it must be an string from 3 to 30 characters').notEmpty().isAlphanumeric('es-ES').isLength({min: 3,max:80});
  req.checkBody('name', 'required').notEmpty();
  req.checkBody('name', '3 to 30 characters required').isLength({min: 3,max:30});
  req.checkBody('surname', 'required').notEmpty();
  req.checkBody('surname', '3 to 30 characters required').isLength({min: 3,max:30});
  req.checkBody('email', 'required').notEmpty();
  req.checkBody('email', 'valid email required').isEmail();
  req.checkBody('superadmin', 'required').notEmpty();
  req.checkBody('superadmin', 'boolean required').isBoolean();

  req.sanitize('superadmin').toBoolean();

  if (req.body.superadmin && !res.user.superadmin)
    return next(utils.error('Only a superadmin can upgrade to superadmin'),403);

  if (req.body.password) {
    if (!res.user.superadmin)
      req.checkBody('old_password', 'required').notEmpty();
    req.checkBody('password', 'required').notEmpty();
    req.checkBody('password', '7 to 14 characters required').isLength({min: 7,max:14});
  }

  var errors = req.validationErrors();
  if (errors)
    return res.json(errors, 400);

  var d = req.body;
  var um = new UsersModel();
  var id = req.params.id;

  function editUser() {
    um.editUser(id,d,res.user.superadmin,function(err) {
      if (err)
        return next(utils.error('Cannot edit user'));
      res.json({id: id});
    });
  }

  um.checkOtherUsersEmail(id,d.email,function(err,exists) {
    if (err) return next(err);
    if (exists)
      return res.json([{param : 'email', msg: 'Email already taken', value: d.email}], 400);
    else {
      if (req.body.password) {
        if (!res.user.superadmin) {
          um.checkOldPassword(id,req.body.old_password,function(err,valid) {
            if (err) next(utils.error('Cannot checkOldPassword'));
            if (!valid)
              return res.json([{param : 'password', msg: 'Incorrect old password', value: null}], 400);

            um.editPassword(id,req.body.password,function(err,d) {
              if (err) next(utils.error('Cannot edit password'));
              else editUser();
            });
          });
        }
        else {
          um.editPassword(id,req.body.password,function(err,d) {
            if (err) next(utils.error('Cannot edit password'));
            else editUser();
          });
        }
      }
      else {
        editUser();
      }
    }
  });
});

module.exports = router;
