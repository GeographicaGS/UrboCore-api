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

var multer = require('multer');
var path = require('path');
var fs = require('fs');

var express = require('express');
var router = express.Router({mergeParams: true});
var EntitiesModel = require('../../models/entitiesmodel');
var auth = require('../../auth.js');
var utils = require('../../utils.js');
var log = utils.log();

// TODO: Validators

router.post('/', function(req, res, next){

	// Sync Validation
	req.sanitize('name').trim();
	req.checkBody('name', 'required').notEmpty();
	req.checkParams('scope', 'required').notEmpty();
	req.checkBody('id', 'required').notEmpty();
	req.checkBody('id_category', 'required').notEmpty();
	req.checkBody('table', 'required').notEmpty();
    var errors = req.validationErrors();
    if (errors)
      return res.status(400).json(errors);

  	// Async validation
  	req.checkBody('id', 'invalid id').entityInCatalogue(res.user.id, req.body.id_category);
  	req.checkBody('id', 'invalid id for this entity, category and scope').validEntityForScope(req.params.scope, req.body.id_category);

  	req.asyncValidationErrors()
	.then(function(){
		var model = new EntitiesModel();
		model.addEntity(req.params.scope, req.body, function(err, d){
			if(err){
				next(err);
			}
			else {
				res.status(201).json(d);
			}
		})

	})
	.catch(function(errors) {
	  	return res.status(400).json(errors);
	});

});



router.delete('/:id_entity', function(req, res, next){
	var model = new EntitiesModel();
	model.deleteEntity(req.params.scope, req.params.id_entity, function(err,d ){
		if(err){
			next(err);
		}
		else {
			if(d.rowCount!==0){
				res.status(200).json({status: "ok"});
			} else {
				res.sendStatus(404);
			}
		}
	});
});



var uploadCsv = multer({
  dest: path.join(__dirname, '../uploads/temp'),
  fileFilter: function (req, file, cb) {
    var filetype = /csv/;
    var mimetype = filetype.test(file.mimetype);
    var extname = filetype.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('Error: File upload only supports CSV filetype');
  }
});

function importOptionsValidator(req, res, next) {
  req.checkBody('options', 'required').notEmpty().custom(value => {
    try {
      var opts = JSON.parse(value);
      var errors = [];
      if (opts.fields == null || !Array.isArray(opts.fields) || opts.length === 0) // fields: required, array
        errors.push('Invalid options.fields');
      if (opts.delimiter == null || typeof opts.delimiter !== 'string') // delimiter: required, string
        errors.push('Invalid options.delimiter');
      if (opts.hasHeaders != null && typeof opts.hasHeaders !== 'boolean') // hasHeaders: optional, boolean
        errors.push('Invalid options.hasHeaders');
      if (errors.length > 0)
        throw new Error(errors);
    } catch(e) {
      fs.unlink(req.file.path); // remove uploaded file
      if (e instanceof SyntaxError)
        throw new Error('Invalid options')
      else 
        throw new Error(e);
    }
    return true;
  });
  return next();
};

/*
 * Import data from CSV file
 */
router.post('/:id/import/csv/', auth.logged, auth.protectSuperAdmin, uploadCsv.single('file'), importOptionsValidator,
  function(req, res, next){
    var params = JSON.parse(req.body.options);
    var model = new EntitiesModel();
    if (req.file) {
      return model.importFromCSV(req.params.scope, req.params.id, params.fields, req.file.path, params.delimiter, Boolean(params.hasHeaders), function(err) {
        fs.unlink(req.file.path);        
        if (err) {
          log.error('Import CSV: File import error');
          return next(err);
        } else {
          return res.status(200).json({success: 'ok'});
        }
      });
    }
    return next('Import CSV: Missing file');
  }
);

module.exports = router;