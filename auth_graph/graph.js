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
module.exports.deleteNodeByName = deleteNodeByName;
