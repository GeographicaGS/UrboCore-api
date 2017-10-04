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
var VariablesModel = require('../../models/variablesmodel');

// TODO: Validators

router.post('/', function(req, res, next){

	req.sanitize('name').trim();
	req.checkBody('id_entity', 'required').notEmpty();
	req.checkBody('column', 'required').notEmpty();
	req.checkBody('units', 'required').isValidUnit();
	req.checkBody('var_thresholds', 'array required').isArrayOrNull();
	req.checkBody('var_agg', 'array required').isArray();
	req.checkBody('reverse', 'boolean required').isBoolean();

	// Check if var_agg in VALID operations

    var errors = req.validationErrors();
    if (errors)
      return res.status(400).json(errors);

  	// Check if id_entity in metadata.entities_scopes

	var model = new VariablesModel();
	model.addVariable(req.params.scope, req.body, function(err, d){
		if(err){
			next(err);
		}
		else {
			res.status(201).json(d);
		}
	})	
});

router.put('/:id', function(req, res, next){

	req.sanitize('name').trim();
	req.checkBody('var_thresholds', 'array required').optional().isArrayOrNull();
	req.checkBody('var_agg', 'array required').optional().isArray();
	req.checkBody('reverse', 'boolean required').optional().isBoolean();	
	req.checkBody('reverse', 'boolean required').optional().isBoolean();

    var errors = req.validationErrors();
    if (errors)
      return res.status(400).json(errors);	

	var model = new VariablesModel();
	model.updateVariable(req.params.scope, req.params.id, req.body, function(err, d){
		if(err){
			next(err);
		}
		else {
			res.status(200).json(d);
		}
	})	
});

router.delete('/:id', function(req, res, next){
	var model = new VariablesModel();
	model.deleteVariable(req.params.scope, req.params.id, function(err,d ){
		if(err){
			next(err);
		}
		else {
			if(d.rowCount){
				res.status(200).json({status: "ok"});
			} else {
				res.sendStatus(404);
			}
		}
	});
});

module.exports = router;