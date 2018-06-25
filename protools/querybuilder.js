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

var Condition = require('./conditions').Condition;
var Operator = require('./conditions').Operator;
var util = require('util');

var _parseCondition = function(condition) {

    // Only 1 root element per condition
  var key = Object.keys(condition)[0];
  var value = condition[key];

    // Test operator first
  var cond = new Operator(key);

  if (cond.validate()) {
        // Operator
        // For every Operator, repeat
    var values = [];
    for (var k in value) {
      var element = value[k];
      var cond = Object();
      cond[k] = element;
      values.push(function() {return _parseCondition(cond)}());
    }

        // Combine
    return '( ' + values.join(' ' + key + ' ') + ' )';
  }
  else {
        // Condition
    cond = new Condition(key, value);
    return cond.toSQL();

  }

}

function QueryBuilder(opts) {
  this.opts = opts;
  this.fields = [];
  this.plainSQL = '';
  return this;
}

// QueryBuilder.prototype.then = function(cb){
//     return Promise.resolve(this.plainSQL);
// }

QueryBuilder.prototype.validate = function() {
  return Promise.resolve(this);
}

QueryBuilder.prototype.select = function(field, as) {
  if (as) field += ' AS ' + as;
  this.fields.push(field);
  return this;
}

QueryBuilder.prototype.count = function(field, as) {
  var counter = 'count(' + field + ')';
  if (as) counter += ' AS ' + as;
  this.fields.push(counter);
  return this;
}

QueryBuilder.prototype._initSelect = function() {
  return 'SELECT ' + this.fields.join(', ') + ' FROM ';
}

QueryBuilder.prototype.from = function(table) {
  this.plainSQL = this._initSelect() + table + ' WHERE true ';
  return this;

}

QueryBuilder.prototype.join = function(table1, table2, match) {
  this.plainSQL = this._initSelect()
        + table1
        + ' JOIN '
        + table2
        + ' ON '
        +table1+'.'+match+ ' = ' +table2+'.'+match+ ' '
        + ' WHERE true ';
  return this;
}

QueryBuilder.prototype.append = function(value) {
  this.plainSQL += value;
}


QueryBuilder.prototype.group = function(that) {

  if (Array.isArray(that.opts.ranges)) {
    if (typeof that.opts.ranges[0] === 'string') {
      that.plainSQL += ' AND ' + that.opts.raw.entity_field + ' IN (\'' + that.opts.ranges.join('\', \'') + '\')';
    }
        // Complex filter to group continues ranges
    else if (typeof that.opts.ranges[0] === 'object') {
      var fullCases = [];
      var rangeCounter = 1;
      for (var range of that.opts.ranges) {
        var cases = [];
        var stringCase = 'count(CASE WHEN ';
        for (var k in range) {
          cases.push(that.opts.raw.entity_field + k + range[k]);
        }
        stringCase += cases.join(' AND ');
        stringCase += ' THEN ' + rangeCounter;
        stringCase += ' END) as ' + 'col' + rangeCounter;
        fullCases.push(stringCase);
        rangeCounter++;
      }
      var fullString = 'SELECT ' + fullCases.join(' , ') + ' FROM (' + that.plainSQL + ') AS q';

      return Promise.resolve(fullString);
    }

  } else {
    if (!(that.opts.ranges = 'all')) {
      return Promise.reject('Invalid range: ' + that.opts.ranges);
    }
  }
  that.plainSQL += ' GROUP BY (' + that.opts.raw.entity_field + ')';
  return Promise.resolve(that.plainSQL);
}

QueryBuilder.prototype.nocondition = function() {
  this.plainSQL += this.bbox();
  return Promise.resolve(this);
}



QueryBuilder.prototype.countranges = function() {
  var fullCases = [];
  if (typeof this.opts.ranges[0] === 'object') {
    var rangeCounter = 0;
    for (var range of this.opts.ranges) {
      var cases = [];
      var stringCase = 'count(CASE WHEN ';
          //TODO remove percent computation
      for (var k in range) {
        cases.push(this.opts.raw.entity_field + k + range[k]);
      }
      stringCase += cases.join(' AND ');
      stringCase += ' THEN ' + rangeCounter;
      stringCase += ' END) as ' + 'col' + rangeCounter;
      fullCases.push(stringCase);
      rangeCounter++;
    }
  }
  return fullCases.join(' , ');
}


QueryBuilder.prototype.ranges_length = function() {
  return this.opts.ranges.length;
}

QueryBuilder.prototype.ranges = function() {
  var fullCases = [];
  if (typeof this.opts.ranges[0] === 'object') {
    var rangeCounter = 0;
    for (var range of this.opts.ranges) {
      var cases = [];
      var stringCase = 'WHEN ';
      for (var k in range) {
        cases.push(this.opts.raw.entity_field + k + range[k]);
      }
      stringCase += cases.join(' AND ');
      stringCase += ' THEN ' + '\'' + rangeCounter + '\'';
      fullCases.push(stringCase);
      rangeCounter++;
    }
  }
  return fullCases.join(' ');
}

QueryBuilder.prototype.bbox = function() {
  var ret = '';
  if ('filters' in this.opts && this.opts.filters!=null) {
    if ('bbox' in this.opts.filters && this.opts.filters.bbox!=null) {
      ret += ' AND position && ' + util.format('ST_MakeEnvelope(%s,4326)', this.opts.filters.bbox);
    }
  }
  return ret;
}

QueryBuilder.prototype.CARTObbox = function() {
  var ret = '';
  if ('filters' in this.opts && this.opts.filters!=null) {
    if ('bbox' in this.opts.filters && this.opts.filters.bbox!=null) {
      ret += ' AND the_geom && ' + util.format('ST_MakeEnvelope(%s,4326)', this.opts.filters.bbox);
    }
  }
  return ret;
}

QueryBuilder.prototype.the_geom = function(srid=4326) {
  var ret = '';
  var geom_filter = '';
  var sql = [];
  if ('filters' in this.opts && this.opts.filters!=null) {
    if ('the_geom' in this.opts.filters && this.opts.filters.the_geom!=null) {
      var tgeom = this.opts.filters.the_geom
      if ('&&' in tgeom && tgeom['&&'] != null && Array.isArray(tgeom['&&']) && tgeom['&&'].length === 4) {
        geom_filter = util.format('ST_MakeEnvelope(%s,4326)', tgeom['&&']);
        if (srid !== 4326) {
          geom_filter = util.format('ST_Transform(%s, %s)', geom_filter, srid);
        }
        sql.push(util.format('position && %s', geom_filter));
      }

      if ('id' in tgeom && tgeom.id != null) {
        sql.push(util.format('id IN (%s)', tgeom.id));
      }

      if ('ST_Intersects' in tgeom && tgeom.ST_Intersects != null) {
        var geom = '';
        if (typeof(tgeom.ST_Intersects) === 'string') {
          geom = util.format('%s::geometry', tgeom.ST_Intersects);
        } else {
          geom = util.format('ST_GeomFromGeoJSON(\'%s\')', JSON.stringify(tgeom.ST_Intersects));
        }
        geom_filter = util.format('ST_SetSRID(%s,4326)', geom);
        if (srid !== 4326) {
          geom_filter = util.format('ST_Transform(%s, %s)', geom_filter, srid);
        }
        sql.push(util.format('ST_Intersects(position,%s)', geom_filter));
      }
    }
  }

  if (sql.length !== 0) {
    ret = util.format(' AND ((%s))', sql.join(') AND ('));
  }
  return ret;
}

QueryBuilder.prototype.filter = function() {
  var ret = '';
  var opts = this.opts;
  if ('filters' in opts && opts.filters !=null) {
    if ('condition' in opts.filters && opts.filters.condition!==null) {
      if (Object.keys(this.opts.filters.condition).length!==1) return ret;
      ret += ' AND ' + _parseCondition(opts.filters.condition);
    }
  }
  return ret;
}

QueryBuilder.prototype.condition = function() {
    // Only ONE root element allowed
  this.plainSQL += this.bbox();
  this.plainSQL += this.the_geom();
  this.plainSQL += this.filter();
  return Promise.resolve(this);
}

module.exports = QueryBuilder;
