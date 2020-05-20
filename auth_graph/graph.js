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

var model = require('./model.js');

function findByNames(names,node_id,cb) {
  var fn = arguments[arguments.length -1];
  if (typeof(fn) === 'function') cb = fn;

  if (node_id === fn)
    node_id = null;

  var m = new model();
  m.findByNames(names,node_id,cb);

}

/*
  opts = {
    node_id : <node_id>,
    user_id: <user_id>
    mode: read|write,
    op: add|rm
  }
*/
function updateNode(opts,cb) {
  var m = new model();
  m.nodeGrantForUser(opts,cb);
}

function getUserGraph(user_id,cb) {
  var m = new model();
  m.getUserGraph(user_id,cb);
}

function getTreeByName(name,cb) {
  var m = new model();
  m.getTreeByName(name,cb);
}

function findByNamesL1(names,node_id,cb) {
  var fn = arguments[arguments.length -1];
  if (typeof(fn) === 'function') cb = fn;

  if (node_id === fn)
    node_id = null;

  var m = new model();
  m.findByNamesL1(names,node_id,cb);

}

function findByName(name, node_id, cb) {
  var m = new model();
  return m.findByName(name, node_id, cb);
}

function createEmptyNode(name, parent, cb) {
  var m = new model();
  return m.addEmptyNode(name, parent, cb);
}

function createNodeIfNotExist(name, root_ancestor_name, parent_name, cb) {
  var m = new model();
  return m.addEmptyNodeIfNotExist(name, root_ancestor_name, parent_name, cb);
}

function deleteNodeByName(name, cb) {
  var m = new model();
  return m.deleteNodeByName(name, cb);
}

module.exports.findByName = findByName;
module.exports.findByNames = findByNames;
module.exports.findByNamesL1 = findByNamesL1;
module.exports.updateNode = updateNode;
module.exports.getUserGraph = getUserGraph;
module.exports.getTreeByName = getTreeByName;
module.exports.createEmptyNode = createEmptyNode;
module.exports.createNodeIfNotExist = createNodeIfNotExist;
module.exports.deleteNodeByName = deleteNodeByName;
