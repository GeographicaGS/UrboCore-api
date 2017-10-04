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
var config = require('../config');
var utils = require('../utils');
var log = utils.log();
var VariablesModel = require('../models/variablesmodel');
var auth = require('../auth.js');
var responseValidator = utils.responseValidator;
var CSVFormatter = require('../protools/csvformatter');
var timesValidator = utils.timesValidator;

var rankingValidator = function(req, res, next) {
  req.checkBody('vars', 'array, required').notEmpty().isArray();
  req.checkBody('var_order', 'string, required').notEmpty();
  req.checkBody('order', 'string, optional').optional().isIn(['asc', 'ASC', 'desc', 'DESC']);
  req.checkBody('limit', 'integer, optional').optional().isInt();
  req.checkBody('filters.bbox', 'array, optional').optional().isArray();
  req.checkBody('filters', 'optional').optional().notEmpty();

  return next();
};

/*
 * It returns the current values of the requested variables ranked by a variable.
 */
router.post('/ranking/now', rankingValidator, responseValidator, auth.validateVariables('vars'), function(req, res, next) {
  var opts = {
    scope: req.scope,
    filters: req.body.filters || {},
    id_vars: req.body.vars,
    var_order: req.body.var_order,
    order: req.body.order,
    limit: req.body.limit
  };

  new VariablesModel().rankingNow(opts)
  .then(function(data) {
    res.json(data);
  })

  .catch(function(err) {
    next(utils.error(err, 400));
  });
});

var variablesTimeserieValidator = function(req, res, next) {
  if (req.method === 'POST') {
    req.checkBody('agg', 'array, required').notEmpty().isArray();
    req.checkBody('vars', 'array, required').notEmpty().isArray();
    req.checkBody('time.start', 'date, required').notEmpty().isDate();
    req.checkBody('time.finish', 'date, required').notEmpty().isDate();
    req.checkBody('time.step', 'required').notEmpty().optional();
    req.checkBody('filters.bbox', 'array, required').optional().isArray();
    req.checkBody('filters', 'required').optional().notEmpty();
    req.checkBody('findTimes', 'boolean').optional().isBoolean();

  } else {
    req.checkQuery('agg', 'required').notEmpty();
    req.checkQuery('vars', 'required').notEmpty();
    req.checkQuery('start', 'date, required').notEmpty().isDate();
    req.checkQuery('finish', 'date, required').notEmpty().isDate();
    req.checkQuery('step', 'required').notEmpty().optional();
    req.checkQuery('bbox', 'required').optional();
    req.checkQuery('filters', 'required').optional().notEmpty();
  }

  return next();
};

/*
 * This function returns a time serie of a variable (or a set of variables).
 */
router.post('/timeserie',
  variablesTimeserieValidator,
  responseValidator,
  auth.validateVariables('vars'),
  function(req, res, next) {

    var opts = {
      scope: req.scope,
      start: req.body.time.start,
      finish: req.body.time.finish,
      step: req.body.time.step || '1d',
      agg: req.body.agg,
      id_vars: req.body.vars,
      filters: req.body.filters || {},
      findTimes: req.body.findTimes || false,
      csv: req.body.csv || false
    };

    var model = new VariablesModel();
    model.getVariablesTimeSerie(opts)
    .then(function(data) {
      if (opts.csv) {
        res.set('Content-Type', 'text/csv');
        res.send(new CSVFormatter().formatTimeSerie(data))
      }
      else
        res.json(data);
    })

    .catch(function(err) {
      next(err);
    });
  });

/*
* This function returns a time serie of a variable (or a set of variables).
* With GET method if for retrocompatibility.
*/
router.get('/timeserie',
  variablesTimeserieValidator,
  responseValidator,
  auth.validateVariables('vars'),
  function(req, res, next) {

    var opts = {
      scope: req.scope,
      start: req.query.start,
      finish: req.query.finish,
      step: req.query.step || '1d',
      agg: req.query.agg.split(','),
      id_vars: req.query.vars.split(','),
      filters: {bbox: req.query.bbox ? req.query.bbox.split(',') : null}
    };

    var model = new VariablesModel()
    model.getVariablesTimeSerie(opts)
    .then(function(data) {
      res.json(data);
    })
    .catch(function(err) {
      next(err);
    });
  });

/*
* This function returns an aggregate value of a variable.
* Example:
*   /osuna/variables/wt_soilhumidity?start=20160601T00:00&finish=20160621T00:00&agg=MAX&bbox=-5.11170,37.24000,-5.10818,37.24303
*/
router.get('/:id',
  parseTimeParameters,
  auth.validateVariables('id'),
  function(req, res, next) {
    var opts = {
      scope: req.scope,
      id_var: req.params.id,
      start: req.query.start,
      finish: req.query.finish,
      agg: req.query.agg.startsWith('[') ? JSON.parse(req.query.agg) : req.query.agg,
      bbox: req.query.bbox
    };
    var model = new VariablesModel();
    model.getVariableAgg(opts,function(err,r) {
      if (err) {
        log.error('Variables AGG: Error when selecting data');
        next(err);
      } else {
        res.json(r);
      }
    });
  });

var variablesDevicesGroupTimeserieValidator = function(req, res, next) {
  if (req.method === 'POST') {
    // Sync validators
    req.checkBody('agg', 'required').notEmpty();
    req.checkBody('time.start', 'date required').notEmpty().isDate();
    req.checkBody('time.finish', 'date required').notEmpty().isDate();
    req.checkBody('time.step', 'required').notEmpty();
    req.checkBody('groupagg', 'boolean required').optional().isBoolean();
    req.checkBody('filters.bbox', 'array required').optional().isArray();
    req.checkBody('filters', 'required').optional().notEmpty();
  } else {
    // Sync validators
    req.checkQuery('agg', 'required').notEmpty();
    req.checkQuery('start', 'date required').notEmpty().isDate();
    req.checkQuery('finish', 'date required').notEmpty().isDate();
    req.checkQuery('step', 'required').notEmpty();
    req.checkQuery('groupagg', 'boolean required').optional();
    req.checkQuery('bbox', 'array required').optional();
    req.checkQuery('filters', 'required').optional().notEmpty();
  }

  return next();
}

/*
* This function returns a time serie of a variable grouped by devices.
*/
router.post('/:id/devices_group_timeserie',
  variablesDevicesGroupTimeserieValidator,
  responseValidator,
  auth.validateVariables('id'),
  function(req, res, next) {

    var opts = {
      scope: req.scope,
      id_var: req.params.id,
      agg: req.body.agg,
      start: req.body.time.start,
      finish: req.body.time.finish,
      step: req.body.time.step || '1d',
      groupagg: req.body.groupagg || false,
      filters: {bbox: req.body.filters.bbox}
    };

    var model = new VariablesModel();
    model.getVariableDevicesGroupTimeSerie(opts)
    .then(function(data) {
      res.json(data);
    })
    .catch(function(err) {
      next(err);
    });
  });

/*
* This function returns a time serie of a variable grouped by devices.
* With GET method if for retrocompatibility.
*/
router.get('/:id/devices_group_timeserie',
  variablesDevicesGroupTimeserieValidator,
  responseValidator,
  auth.validateVariables('id'),
  function(req, res, next) {

    var opts = {
      scope: req.scope,
      id_var: req.params.id,
      agg: req.query.agg,
      start: req.query.start,
      finish: req.query.finish,
      step: req.query.step || '1d',
      groupagg: (req.query.groupagg === 'true'),
      filters: {bbox: req.query.bbox.split(',')}
    };

    var model = new VariablesModel();
    model.getVariableDevicesGroupTimeSerie(opts)
    .then(function(data) {
      res.json(data);
    })
    .catch(function(err) {
      next(err);
    });
  });


// Filters
/*

  filters:{
    bbox:[lx,ly,ux,uy],
    column1:{
      type: 'in',
      values: []
    },
    column2:{
      type:'range',
      '>=': 10,
      '<=': 30
    }
  }
*/


var histogramDiscreteNowValidator = function(req, res, next) {

  // Sync validators
  req.checkBody('filters', 'required').optional().notEmpty();
  req.checkBody('ranges', 'required').notEmpty();
  req.checkBody('totals', 'boolean required').optional().isBoolean();
  req.checkBody('filters.bbox', 'array required').optional().isArray();

  // Master async validator for filters
  req.checkBody('ranges', 'invalid ranges').validRanges(req.params.scope,req.params.id);

  return next();
}


// HISTOGRAMS
router.post('/:id/histogram/discrete/now',
  histogramDiscreteNowValidator,
  responseValidator,
  auth.validateVariables('id'),
  function(req, res, next) {


    var opts = {
      id: req.params.id,
      scope: req.scope,
      ranges: req.body.ranges,
      filters: req.body.filters || {},
      totals: req.body.totals || false
    }

    var model = new VariablesModel();
    model.getVariablesDiscreteHistogramNow(opts)
    .then(function(data) {
      res.json(data);
    })
    .catch(function(err) {
      log.error(err);
      res.status(400).json(err);
    });
  });


var histogramContinuousNowValidator = function(req, res, next) {
    // Sync validators
  req.checkBody('filters', 'required').optional().notEmpty();
  req.checkBody('ranges', 'required').notEmpty();
  req.checkBody('totals', 'boolean required').optional().isBoolean();
  req.checkBody('filters.bbox', 'array required').optional().isArray();
    // Master async validator for filters
  req.checkBody('ranges','invalid ranges').validRanges(req.scope, req.params.id);

  return next();

}
router.post('/:id/histogram/continuous/now',
  histogramContinuousNowValidator,
  responseValidator,
  auth.validateVariables('id'),
  function(req, res, next) {

    var opts = {
      id: req.params.id,
      scope: req.scope,
      ranges: req.body.ranges,
      filters: req.body.filters || {},
      totals: req.body.totals || false
    }

    var model = new VariablesModel();
    model.getVariablesContinuousHistogramNow(opts)
    .then(function(data) {
      res.json(data);
    })
    .catch(function(err) {
      next(utils.error(err, 400));
    });

  });

var histogramTimeserieContinuosValidator = function(req, res, next) {
  // Sync validators
  req.checkBody('filters', 'required').optional();
  req.checkBody('ranges', 'required').notEmpty();
  req.checkBody('totals', 'boolean required').optional().isBoolean();
  req.checkBody('time.start', 'required').notEmpty();
  req.checkBody('time.finish', 'required').notEmpty();
  req.checkBody('time.step', 'required').notEmpty();
  req.checkBody('filters.bbox', 'array required').optional().isArray();

  return next();
}

router.post('/:id/histogram/timeserie/continuous',
  histogramTimeserieContinuosValidator,
  responseValidator,
  auth.validateVariables('id'),
  function(req, res, next) {


    var opts = {
      id: req.params.id,
      scope: req.scope,
      ranges: req.body.ranges,
      filters: req.body.filters || { 'condition': {}},
      time: req.body.time,
      totals: req.body.totals || false,
      timeColumn: req.body.time_column || 'TimeInstant'
    }

    var model = new VariablesModel();
    model.getVariablesContinuousHistogramTimeserie(opts)
  .then(function(data) {
    res.json(data);
  })
  .catch(function(err) {
    next(utils.error(err, 400));
  });

  })


/*
* Middleware function. Parse time parameters for services.
* Parsed params:
* - start: should follow the ISO format (although it accepts any valid JS date format)
*           YYYY-MM-DDT00:00:00. No default.
* - finish: should follow the ISO format (although it accepts any valid JS date format)
*           YYYY-MM-DDT00:00:00. No default.
*/
function parseTimeParameters(req,res,next) {
  var start = req.query.start || req.body.time.start;
  var finish = req.query.finish || req.body.time.finish;

  if (!start) {
    return next(utils.error('Missing time parameter [start] (mandatory)',400));
  } else if (new Date(start) === 'Invalid Date') {
    return next(utils.error('Wrong time parameter [start] (mandatory). Format: YYYY-MM-DDT00:00:00',400));
  }

  if (!finish) {
    return next(utils.error('Missing time parameter [finish] (mandatory)',400));
  } else if (new Date(finish) === 'Invalid Date') {
    return next(utils.error('Wrong time parameter [finish] (mandatory). Format: YYYY-MM-DDT00:00:00',400));
  }

  // req.start = new Date(start).toISOString();
  // req.finish = new Date(finish).toISOString();

  next();

}

/*
* It returns the outers of an aggregation. It's used to build dynamic choropleth legends.
*/
router.get('/:id/outers',
  parseTimeParameters,
  auth.validateVariables('id'),
  function(req, res, next) {
    var opts = {
      scope: req.scope,
      id_var: req.params.id,
      start: req.query.start,
      finish: req.query.finish,
      agg: req.query.agg
    };

    var model = new VariablesModel();
    model.getOuters(opts,function(err,r) {
      if (err)
        next(err);
      else
      res.json(r);
    });
  });

var nowHistoricAggregatorValidator = function(req, res, next) {
  // Sync validators
  req.checkBody('agg', 'aggregation required').notEmpty();
  req.checkBody('filters', 'required').optional();
  req.checkBody('filters.bbox', 'array required').optional().isArray();
  // TODO: Check what happens with 'bbox' if 'filters' doesn't exist

  return next();
};

/*
 * It returns an aggregate value of a variable for the current situation
 */
router.post('/:id/now',
  nowHistoricAggregatorValidator,
  responseValidator,
  auth.validateVariables('id'),
  function(req, res, next) {
    var opts = {
      scope: req.scope,
      idVar: req.params.id,
      agg: req.body.agg,
      filters: req.body.filters || {'condition': {}},
      bbox: req.body.filters ? req.body.filters.bbox : undefined,
      tableSuffix: '_lastdata'
    };

    var model = new VariablesModel();
    model.getVariableHistoric(opts)
    .then(function(data) {
      res.json(data);
    })

    .catch(function(err) {
      next(utils.error(err, 400));
    });
  });

/*
 * It returns an aggregate value of a variable
 */
router.post('/:id/historic',
  nowHistoricAggregatorValidator,
  timesValidator,
  responseValidator,
  auth.validateVariables('id'),
  function(req, res, next) {
    var opts = {
      scope: req.scope,
      idVar: req.params.id,
      agg: req.body.agg,
      start: req.body.time.start,
      finish: req.body.time.finish,
      filters: req.body.filters || {'condition': {}},
      bbox: req.body.filters ? req.body.filters.bbox : undefined
    };

    var model = new VariablesModel();
    model.getVariableHistoric(opts)
  .then(function(data) {
    res.json(data);
  })

  .catch(function(err) {
    next(utils.error(err, 400));
  });
  });


var variablesDailyAggValidator = function(req, res, next) {
  req.checkBody('agg', 'array, required').notEmpty().isArray();
  req.checkBody('vars', 'array, required').notEmpty().isArray();
  req.checkBody('time.step', 'valid values: 1h,2h,4h,6h,8h,12h')
    .notEmpty().optional().validDailyStep();
  req.checkBody('filters.bbox', 'array, required').optional().isArray();
  req.checkBody('filters', 'required').optional().notEmpty();
  req.checkBody('findTimes', 'boolean').optional().isBoolean();

  return next();
};

/*
 * This function returns a daily agg of a variable (or a set of variables).
 */
router.post('/dailyagg',
  variablesDailyAggValidator,
  timesValidator,
  responseValidator,
  auth.validateVariables('vars'),
  function(req, res, next) {

    var opts = {
      scope: req.scope,
      start: req.body.time.start,
      finish: req.body.time.finish,
      step: req.body.time.step || '1h',
      agg: req.body.agg,
      id_vars: req.body.vars,
      filters: req.body.filters || {},
      findTimes: req.body.findTimes || false
    };

    var model = new VariablesModel();
    model.getVariablesDailyAgg(opts)
  .then(function(data) {
    res.json(data);
  })

  .catch(function(err) {
    next(utils.error(err, 400));
  });
  });


var variablesWeeklyAggValidator = function(req, res, next) {
  req.checkBody('agg', 'required').notEmpty();
  req.checkBody('filters.bbox', 'array, required').optional().isArray();
  req.checkBody('filters', 'required').optional().notEmpty();
  req.checkBody('findTimes', 'boolean').optional().isBoolean();

  return next();
};

/*
 * This function returns a weekly agg of a variable (or a set of variables).
 */
router.post('/:id/weekserie',
  variablesWeeklyAggValidator,
  timesValidator,
  responseValidator,
  auth.validateVariables('id'),
  function(req, res, next) {

    var opts = {
      scope: req.scope,
      idVar: req.params.id,
      agg: req.body.agg,
      start: req.body.time.start,
      finish: req.body.time.finish,
      filters: req.body.filters || {'condition': {}},
      bbox: req.body.filters ? req.body.filters.bbox : undefined
    };

    var model = new VariablesModel();
    model.weekSerie(opts)
  .then(function(data) {
    res.json(data);
  })
  .catch(function(err) {
    next(utils.error(err, 400));
  });
  });

var boundingBoxValidator = function(req, res, next) {
  req.checkBody('filters.bbox', 'array').optional().isArray();
  return next();
};

var groupedValidator = function(req, res, next) {
  req.checkBody('filters.limit', 'A number').optional().isNumber();
  req.checkBody('filters.order', 'ASC or DESC').optional().isIn(['ASC', 'DESC', 'asc', 'desc']);
  req.checkBody('filters.perc', 'A boolean').optional().isBoolean();
  return next();
};

/*
 * This service counts the rows of a table grouped by a column.
 */
router.post('/:id/histogram/discrete/grouped', boundingBoxValidator, groupedValidator, responseValidator,
  auth.validateVariables('id'), function(req, res, next) {
    var opts = {
      scope: req.scope,
      idVar: req.params.id,
      start: req.body.time ? req.body.time.start : undefined,
      finish: req.body.time ? req.body.time.finish : undefined,
      bbox: req.body.filters ? req.body.filters.bbox : undefined,
      limit: req.body.filters ? req.body.filters.limit : undefined,
      order: req.body.filters ? req.body.filters.order : undefined,
      filters: req.body.filters || {'condition': {}},
      perc: req.body.filters ? req.body.filters.perc : undefined
    };

    new VariablesModel().grouped(opts)
  .then(data => {
    res.json(data);
  })
  .catch(err => {
    next(utils.error(err, 400));
  });
  });

/*
 * This service returns the unique values of a variable.
 */
router.post('/:id/unique', boundingBoxValidator, responseValidator,
  auth.validateVariables('id'), function(req, res, next) {
    var opts = {
      scope: req.scope,
      idVar: req.params.id,
      start: req.body.time ? req.body.time.start : undefined,
      finish: req.body.time ? req.body.time.finish : undefined,
      filters: req.body.filters || {'condition': {}},
      bbox: req.body.filters ? req.body.filters.bbox : undefined
    };

    new VariablesModel().unique(opts)
  .then(data => {
    res.json(data);
  })
  .catch(err => {
    next(utils.error(err, 400));
  });
  });

/*
 * This service returns bounding box of a variable.
 */
router.post('/:id/bounding_box', auth.validateVariables('id'), function(req, res, next) {
  var opts = {
    scope: req.scope,
    idVar: req.params.id,
    start: req.body.time ? req.body.time.start : undefined,
    finish: req.body.time ? req.body.time.finish : undefined,
    filters: req.body.filters || {'condition': {}}
  };

  new VariablesModel().boundingBox(opts)
  .then(data => {
    res.json(data);
  })
  .catch(err => {
    next(utils.error(err, 400));
  });
});

module.exports = router;
