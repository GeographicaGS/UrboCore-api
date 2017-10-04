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

var AVG = 'AVG';
var SUM = 'SUM';
var MIN = 'MIN';
var MAX = 'MAX';
var NOAGG = 'NOAGG';

module.exports.AVG = AVG;
module.exports.SUM = SUM;
module.exports.MAX = MAX;
module.exports.MIN = MIN;
module.exports.NOAGG = NOAGG;
module.exports.VALIDAGGS = [MAX,MIN,AVG,SUM,NOAGG];
module.exports.PUBLISHED = -1;

module.exports.DYNAMIC_RANGE_COLOR_PALETTE = [
  '#ade6f9', '#51c4ed', '#15a2df', '#017fca', '#0063a8'];
