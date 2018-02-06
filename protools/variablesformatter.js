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
var moment = require('moment');
var utils = require('../utils');
var log = utils.log();

function VariablesFormatter() {
  return this;
}

VariablesFormatter.prototype.timeSerie = function(promisesResult) {
  var varIds = promisesResult.shift();
  var aggs = promisesResult.shift();

  var group = null;
  if (typeof promisesResult[promisesResult.length - 1] === 'string') {
    group = promisesResult.pop();
  }

  var rowsNumber = promisesResult[0].rows.length;

  var columns = _.map(_.zip(varIds, aggs), function(pair) {
    return `${pair[0]}_${pair[1]}`;
  });

  var template = {};
  for (var varId of varIds) {
    template[varId] = template[varId] === undefined ? 0 : [];
  }

  var timeColumnIndex = 0;
  var auxTime = new Date('3999-31-12T23:59:59Z');
  for (var i = 0; i < columns.length; i++) {
    var auxTime2 = promisesResult[i].rows[0].start;
    if (auxTime2 < auxTime) {
      timeColumnIndex = i;
      auxTime = auxTime2;
    }
  }

  var result = [];
  for (var i = 0; i < rowsNumber; i++) {
    var time = promisesResult[timeColumnIndex].rows[i].start;
    var yieldResult = {
      time: time,
      data: JSON.parse(JSON.stringify(template))
    };

    for (var j = 0; j < columns.length; j++) {
      if (group) {
        yieldResult.data[group] = promisesResult[j].rows[i][group];
      }

      var value;
      var times;
      if (promisesResult[j].rows[i].start.toString() !== time.toString()) {
        promisesResult[j].rows.splice(i, 0, null);
        value = null;

      } else {
        value = promisesResult[j].rows[i][columns[j]];
        times = promisesResult[j].rows[i].times;
      }

      if (yieldResult.data[varIds[j]].constructor === Array) {
        var subYieldResult = {
          agg: aggs[j],
          value: value
        };

        if (times) {
          subYieldResult.times = times;
        }

        yieldResult.data[varIds[j]].push(subYieldResult);

      } else if (times) {
        yieldResult.data[varIds[j]] = {
          value: value,
          times: times
        };

      } else {
        yieldResult.data[varIds[j]] = value;
      }

    }

    result.push(yieldResult);
  }

  if (group) {
    var auxResult = [];
    var currentTime;
    var insert;

    for (var iResult of result) {
      if (currentTime !== moment(iResult.time).toISOString()) {
        if (insert != null) {
          auxResult.push(insert);
        }

        insert = null;
        currentTime = moment(iResult.time).toISOString();
      }

      var groupValue = iResult.data[group];
      var otherKey = Object.keys(iResult.data).filter(x => x !== group)[0];

      if (insert == null) {
        insert = {
          time: moment(iResult.time).toISOString(),
          data: {}
        };
        insert.data[otherKey] = [];
      }

      insert.data[otherKey].push({
        agg: groupValue,
        value: iResult.data[otherKey]
      });
    }

    result = auxResult;
  }

  return Promise.resolve(result);
};

VariablesFormatter.prototype.timeSerieDevGroup = function(dq) {

  var dt =  _.map(dq,function(_data) {
    var time = _data.time;
    var data = {};
    var id_ent = _data.id_ent;
    var ent_avg = _data.ent_avg;
    var tot_avg = _data.tot_avg;

    for (var i in id_ent) {
      data[id_ent[i]] = ent_avg[i];
    }
    data.avg = tot_avg;

    return {
      'time': time,
      'data': data
    };
  });

  return Promise.resolve(dt);

}

VariablesFormatter.prototype.dailyagg = function(promisesResult) {
  var varIds = promisesResult.shift();
  var aggs = promisesResult.shift();
  var rowsNumber = promisesResult[0].rows.length;

  var columns = _.map(_.zip(varIds, aggs), function(pair) {
    return `${pair[0]}_${pair[1]}`;
  });

  var template = {};
  for (var varId of varIds) {
    template[varId] = template[varId] === undefined ? 0 : [];
  }

  var result = [];
  for (var i = 0; i < rowsNumber; i++) {
    var time = promisesResult[0].rows[i].time;
    var yieldResult = {
      time: time,
      data: JSON.parse(JSON.stringify(template))
    };

    for (var j = 0; j < columns.length; j++) {
      var value = promisesResult[j].rows[i][columns[j]];
      var times = promisesResult[j].rows[i].times;

      if (yieldResult.data[varIds[j]].constructor === Array) {
        var subYieldResult = {
          agg: aggs[j],
          value: value
        };

        if (times) {
          subYieldResult.times = times;
        }

        yieldResult.data[varIds[j]].push(subYieldResult);

      } else if (times) {
        yieldResult.data[varIds[j]] = {
          value: value,
          times: times
        };

      } else {
        yieldResult.data[varIds[j]] = value;
      }
    }

    result.push(yieldResult);
  }

  return Promise.resolve(result);
};

VariablesFormatter.prototype.ranking = function(data) {
  return Promise.resolve(data.rows);
};


module.exports = VariablesFormatter;
