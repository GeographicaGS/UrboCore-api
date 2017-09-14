'use strict';

var _ = require('underscore');
var utils = require('../utils');
var log = utils.log();


function ScatterFormatter() {
  return this;
}


var _formatCoordinates = function(data) {
  var coords = _.map(data, function(xy) {
    return {'x': xy[0], 'y': xy[1]};
  });

  return coords;
}

ScatterFormatter.prototype.getEmptFreqCategories = function(data) {

  var cts = {
    'ok': _formatCoordinates(_.compact(_.flatten(data.ok, true))),
    'warning': _formatCoordinates(_.compact(_.flatten(data.warn, true))),
    'error': _formatCoordinates(_.compact(_.flatten(data.error, true)))
  };

  return Promise.resolve(cts);
};

ScatterFormatter.prototype.mergeJsonArrays = function(data, startMidDay) {
  var midDay = 43200;
  var result = {};

  _.each(data, function(row) {
    _.each(row.data, function(value, key) {
      if (!(key in result)) {
        result[key] = [];
      }

      value = _.map(value, function(point) {
        point.x = point.x >= midDay ? point.x - midDay : point.x + midDay;
        return point;
      });

      result[key] = result[key].concat(value);
    });
  });

  return result;
};


// Documented at the bottom
ScatterFormatter.prototype.fromCategoryPoints = function(data, startMidDay) {
  var midDay = 43200;
  var result = {};

  _.each(data, function(cat) {
    if (startMidDay) {
      cat.points = cat.points.map(function(point) {
        point.x = point.x >= midDay ? point.x - midDay : point.x + midDay;
        return point;
      });
    }

    if (!(cat.category in result)) {
      result[cat.category] = [];
    }

    result[cat.category] = result[cat.category].concat(cat.points);
  });

  return result;
};

ScatterFormatter.prototype.withOk = function(data) {
  return Promise.resolve({ 'ok': data })
}


module.exports = ScatterFormatter;

/*
 * TODO: This doc is too big, change it somehow :(
 *
 * fromCategoryPoints
 * ==================
 *
 * From:
 *    [
 *      {
 *        'category': 'category_1',
 *        'points': [
 *          {
 *            x: 45,
 *            y: 19
 *          },
 *          {...}
 *        ]
 *      },
 *      {
 *        'category': 'category_2',
 *        'points': [...]
 *      }
 *    ]
 *
 *  To:
 *    [
 *      {
 *        'category_1': [
 *          {
 *            x: 45,
 *            y: 19
 *          },
 *          {...}
 *        ]
 *      },
 *      {
 *        'category_2': [...]
 *      }
 *    ]
 */
