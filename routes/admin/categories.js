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
var router = express.Router({mergeParams: true});
var config = require('../../config');
var CategoryModel = require('../../models/categoriesmodel');
var CategoryCartoModel = require('../../models/categoriescartomodel');
var OrionDeMA = require('../../orioncb/oriondema');


// TODO: Validators

router.post('/', function(req, res, next){

  // Sync Validation
  req.sanitize('name').trim();
  req.checkBody('id', 'required').notEmpty();
  req.checkBody('name', 'required').notEmpty();
  req.checkParams('scope', 'required').notEmpty();

  var errors = req.validationErrors();
  if (errors)
    return res.status(400).json(errors);

  // Async Validation for id_category
  req.checkBody('id', 'invalid id').categoryInCatalogue();
  req.checkBody('id', 'duplicated id').validCategoryForScope(req.params.scope);

  var opts = {
    scope: req.params.scope,
    category: req.body.id,
    category_name: req.body.name
  };



  req.asyncValidationErrors()
  .then(function(){
    // return config.getCARTO(opts.scope, opts.category)
    return config.getCARTO(opts.scope);
  })
  .then(function(cartocfg){

    opts.carto = cartocfg;
    var pgmodel = new CategoryModel();
    return pgmodel.createDBTables(opts)
  })
  .then(function(){
    var cartomodel = new CategoryCartoModel(opts.carto);
    return cartomodel.createDBTables(opts)
  })
  .then(function(){

    if(req.withDeMA){
      let dema = new OrionDeMA(config.getDeMA(res.locals.dema_access_token));
      dema.updateVerticalStatus(req.params.scope, req.body.id, 'created');
    }

    res.status(201).json({"id": req.body.id});
  })
  .catch(function(errors) {
    console.error(errors);
    return res.status(400).json(errors);
  });

});

router.delete('/:id_category', function(req, res, next){


  var model = new CategoryModel();
  return model.deleteCategory(req.params.scope, req.params.id_category)
  .then(function(){
    if(req.withDeMA){
      let dema = new OrionDeMA(config.getDeMA(res.locals.dema_access_token));
      dema.updateVerticalStatus(req.params.scope, req.params.id_category, 'deleted');
    }
    res.status(200).json({status: "ok"});
  })
  .catch(function(errors) {
    return res.status(404).json(errors);
  });
});

router.put('/:id_category?', function(req, res, next){
  // TODO: validator

  req.sanitize('name').trim();
  req.checkBody('id').optional().notEmpty();
  req.checkBody('name').optional().notEmpty();
  req.checkBody('nodata').optional().isBoolean();
  req.checkParams('scope').optional().notEmpty();

  req.asyncValidationErrors()
  .then(function(){

    var model = new CategoryModel();
    model.updateCategory(req.params.scope, req.body.id, req.body, function(err, d){
      if(err){
        console.error(err);
        next(err);
      }
      else {
        if(req.withDeMA){
          let dema = new OrionDeMA(config.getDeMA(res.locals.dema_access_token));
          dema.updateVerticalStatus(req.params.scope, req.params.id_category, 'updated');
        }
        res.sendStatus(200);
      }
    })
  })
  .catch(function(errors) {
      return res.status(400).json(errors);
  });

})

module.exports = router;
