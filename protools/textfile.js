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

const fs = require('fs');

let _removeFromFile = function (filePath, text) {
  let data = fs.readFileSync(filePath, 'utf8');
  let pattern = new RegExp(text, 'g');

  data = data.replace(pattern, '');
  fs.writeFileSync(filePath, data, 'utf8')
};

let _addToFileAfter = function (filePath, text, after) {
  _removeFromFile(filePath, text);

  let data = fs.readFileSync(filePath, 'utf8');
  let pattern = new RegExp(`(${ after })`, 'g');

  data = data.replace(pattern, `$1${ text }`);
  fs.writeFileSync(filePath, data, 'utf8')
};

let _capitalizeFirstLetter = function(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

module.exports.removeFromFile = _removeFromFile;
module.exports.addToFileAfter = _addToFileAfter;
module.exports.capitalizeFirstLetter = _capitalizeFirstLetter;
