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
