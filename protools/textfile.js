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
