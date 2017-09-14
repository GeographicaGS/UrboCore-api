var express = require('express');
var router = express.Router({mergeParams: true});
var EntitiesModel = require('../../models/entitiesmodel');

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

module.exports = router;