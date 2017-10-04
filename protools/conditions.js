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

/*

{"OR": { "column1__in":[ 14 ], "AND": {"column2__gte": 10, "column2__lte": 30}  } }

*/

var _ = require('underscore');


function Operator(op) {
  this.op = op;
  return this;
}

Operator.prototype.validate = function() {
  return (this.op === 'AND' || this.op === 'OR');
}

Operator.prototype.getOp = function() {
  return this.op;
}


function Condition(key, value) {
  var fromIndex = 0;
  this.table = '';

  if (key.split('__').length===3) {
    this.table = key.split('__')[0];
    fromIndex = 1;
  }

  this.column = key.split('__')[fromIndex];
  this.filter = key.split('__')[fromIndex + 1];
  this.value = value;

  return this;
}

Condition.prototype.getTable = function() {
  return this.table;
}

Condition.prototype.getFullColumn = function() {
  if (this.table!=='') {
    return this.table + '.' + this.column;
  }
  else {
    return this.column;
  }

}

Condition.prototype.getOp = function() {
  if (this.filter === 'gte') {
    return '>=';
  } else if (this.filter === 'gt') {
    return '>';
  } else if (this.filter === 'lte') {
    return '<=';
  } else if (this.filter === 'lt') {
    return '<';
  } else if (this.filter === 'eq') {
    return '=';
  } else if (this.filter === 'not') {
    return '!=';
  } else if (this.filter === 'in') {
    return 'IN';
  } else if (this.filter === 'like') {
    return 'LIKE';
  } else if (this.filter === 'regex') {
    return '~';
  }
}

Condition.prototype.getValue = function() {
  return this.value;
}

Condition.prototype.toSQL = function() {

  if (this.filter === 'in') {
    if (this.getValue().length>0) {
      var values = this.getValue().join('\' , \'');
      var ret = ' ' + this.getFullColumn() + ' ' + this.getOp() + ' (\'' + values + '\') ';
      return ret;
    }
    else if (this.getValue().length===0) {
      return ' false ';
    }
    else return '';
  }
  return ' ' + this.getFullColumn() + ' ' + this.getOp() + ' \'' + this.getValue() + '\' ';
}


module.exports.Condition = Condition;
module.exports.Operator = Operator;


