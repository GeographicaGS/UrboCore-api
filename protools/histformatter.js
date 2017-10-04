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

var _ = require('underscore');

function assign(store, arr, key) {
  _.each(arr, function(row) {
    var previous = _.findWhere(store, {category: row.category});
    if (typeof previous === 'undefined') {
      var previous = {
        category: row.category,
        value: 0,
        total: 0
      }
      store.push(previous);
    }
    previous[key] = row[key];
  });
}

function HistFormatter() {
  return this;
}


HistFormatter.prototype.formatDiscrete = function(data) {

  if (data.ranges==='all') {

    // Not totals
    if (data.results.length===1) return Promise.resolve(data.results[0].rows);

    var values = data.results[0].rows;
    var totals = data.results[1].rows;

    if ('total' in values[0]) {
      var values = data[1].rows;
      var totals =  data[0].rows;
    }

    var combined = [];
    _.each(values, function(value) {
      var total = _.findWhere(totals, {category: value.category});
      value.total = total.total;
      combined.push(value);
    });

    return Promise.resolve(combined);
  }

  else {
    var values = data.results[0].rows;
    if (data.results.length===2) {
      var totals = data.results[1].rows;
    }

    // pre-populate with received ranges
    var fulldata = []
    _.each(data.ranges, function(range) {
      fulldata.push({
        category: range,
        value: 0,
        total: 0
      });

    })
    if (totals) {
      assign(fulldata, totals, 'total');
    }
    assign(fulldata, values, 'value');

    return Promise.resolve(fulldata);

  }

}


HistFormatter.prototype.formatContinuous = function(data) {

  if (data.results.length===1) {
    var proc = [];
    for (var col in data.results[0].rows[0]) {
      proc.push({
        'value': data.results[0].rows[0][col]
      });
    }
    return Promise.resolve(proc);
  }

    // With totals
  var values = data.results[0].rows[0];
  var totals = data.results[1].rows[0];
  var combined = [];
  for (var col in values) {
    combined.push({
      'value': values[col],
      'total': totals[col]
    });
  }
  return Promise.resolve(combined);

}

// Include num_ranges into data
HistFormatter.prototype.formatTimeserie = function(data) {

    // Preprocessing
  var values = data.results[0].rows;
    // With totals
  if (data.results.length > 1) {
    var totals = data.results[1].rows;
  }


  function assign(store, arr, key) {
    _.each(arr, function(row) {

      var previous = _.findWhere(store, {rawtime: new Date(row.time).getTime()});
        // First hit
      if (typeof previous === 'undefined') {

        var populated = [];
          // Initialize number of ranges
        for (var i=0;i<data.ranges_length;i++) {
          populated.push({ 'value': 0, 'total': 0});
        }

        var previous = {
          time: row.time,
          rawtime: new Date(row.time).getTime(),
          data: populated
        }
        store.push(previous);
      }

      if (row.position !== null) {
        previous.data[row.position][key] = row.value;
      }

    });
  }

  var fulldata = [];
  if (totals) {
    assign(fulldata, totals, 'total');
  }
  assign(fulldata, values, 'value');

    // Destroy rawtime keys
  _.map(fulldata, function(entry) {
    delete entry.rawtime;
    return entry;
  });

  return Promise.resolve(fulldata);
}

/*
 * From:
 * {
 *   available: 100,
 *   occupied: 200
 * }
 * to:
 * [
 *   {
 *     category: 'available',
 *     value: 100
 *   },
 *   {
 *     category: 'occupied',
 *     value: 200
 *   }
 * ]
 */
HistFormatter.prototype.keysToCategoires = function(data) {
  var result = [];
  for (var key in data) {
    result.push({
      'category': key,
      'value': data[key]
    });
  }

  return result;
};

HistFormatter.prototype.waterDailyHistog = function(data, basestep) {

  var keys = data.map(d =>{ return d.step}).sort();
  for (var i=0;i<_.max(keys); i+=basestep) {
    if (keys.indexOf(i) === -1) {
      data.push({
        step: i,
        elements: []
      });
    }
  }

  return data.sort( (x, y)  => { return x.step > y.step });
}


module.exports = HistFormatter;
