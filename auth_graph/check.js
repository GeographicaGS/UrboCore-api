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
var usersmodel = require('../models/usersmodel');
var util = require('util');
var utils = require('../utils');
var log = utils.log();
var jwt = require('jwt-simple');
var _ = require('underscore');
var config = require('../config');
var LdapAuth = require('ldapauth-fork');
var ldapopts = config.getData().ldap;

function invalidUserPassword() {
  var error = new Error('Invalid user or password');
  error.status = 401;
  return error;
}

function invalidLdapUser() {
  var error = new Error('Invalid Ldap user or password');
  error.status = 401;
  return error;
}

function createdbUserFromLdapUser(ldapuser, password, email, callback) {
  var user = {};

  try {
    user.name = ldapuser.uid;
    user.surname = ldapuser.uid || '';
    user.password = 'urboldappassword';
    user.nocipher = true;
    user.email = email;
    user.superadmin = false;
    user.ldap = true;
    user.scopes = ldapopts.defaultScopes;
    var um = new usersmodel();
    um.saveUser(user, function(err, id) {

      var userid = id;
      if (err)
        return callback (new Error('Error importing user into DB'), null);

      var resUser = {
        id: userid,
        name: user.name,
        superadmin: false,
        email: email,
        ldap: true
      }

      return callback (null, resUser) ;

    });
  } catch (e) {
    var error = new Error(util.format('Something went wrong importing user from LDAP: %s', e));
    return callback(error, null);
  }

}

function authLdapUser(password, email, callback) {
  log.info('ldapopts ++++++', config.getData().ldap.searchBase);
  if (ldapopts.addEmailDomain) {
    var domainToAdd = email.replace(/.*@/, '').split('.')[0];
    var matchLastDomain = ldapopts.searchBase.match(/(([^,]+))$/g)[0];
    log.info('match', matchLastDomain);
    if (ldapopts.searchBase.match(/[,]/) != null ) {
      ldapopts.searchBase = ldapopts.searchBase.replace(/(([^,]+))$/, `dc=${domainToAdd},${matchLastDomain}`)
    } else {
      ldapopts.searchBase = `dc=${domainToAdd},${ldapopts.searchBase}`
    }
  }
  var auth = new LdapAuth(ldapopts);
  log.info('ldapuser --', ldapopts);
  auth.authenticate(email, password, function(err, user) {
    ldapopts.searchBase = ldapopts.searchBase.replace('dc=' + domainToAdd + ',', '');
    if (err) {
      log.info('ldapuser --', user);
      return callback(user, null);
    }
    else {
      log.info('ldapuser --', user);
      return callback(null, user);
    }
  });
}


module.exports.password = function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;

  // params validation
  if (!email||!password) {
    var error = new Error('Invalid parameters');
    error.status = 422;
    return next(error);
  }


  var m = new model();
  m.getUserByEmail(email,function(err, data) {

    // NO URBO USER
    if (err || !data.rows.length) {
      if (ldapopts && ldapopts.autoCreateUserByLdap === true && ldapopts.forceLdapAuthentication !== true) {
        authLdapUser(password, email, function(err, ldapuser) {
          if (err) {
            return next(invalidLdapUser());
          }
          return createdbUserFromLdapUser(ldapuser, password, email, function(err, resUser) {
            if (err) {
              return next(err);
            }
            res.user = resUser;
            return next();
          });
        });
      }
      else {
        return next(invalidUserPassword());
      }
    }

    // URBO USER
    if (data && data.rows && data.rows.length) {
      var user = data.rows[0];
      // Check LDAP USER if necessary
      if (ldapopts && ldapopts.forceLdapAuthentication === true) {
        authLdapUser(password, email, function(err, ldapuser) {
          if (err) {
            return next(invalidLdapUser());
          }
          log.info('ldapuser --', ldapuser);
          var usermail = user['email'];
          usermail = usermail.replace(/@.*$/,'');
          if (ldapuser != null && usermail === ldapuser.uid ) {
            user.id = user.users_id;
            delete user.password;
            delete user.users_id;
            res.user = user;
            return next();
          }
          else {
            return next(invalidLdapUser());
          }
        });
      } else {

        if (user.ldap && ldapopts) {

          authLdapUser(password, email, function(err, ldapuser) {
            if (err) {
              return next(invalidLdapUser());
            }
            return createdbUserFromLdapUser(ldapuser, password, email, function(err, resUser) {
              if (err) {
                return next(err);
              }
              res.user = resUser;
              return next();
            });
          });
        }

        // Check PASSWORD
        else if (user.password === password && !user.ldap) {
          user.id = user.users_id;
          delete user.password;
          delete user.users_id;
          res.user = user;
          return next();
        }

        else {
          return next(invalidUserPassword());
        }

      }

    }

  });



}

function checkToken(req,res,next) {
  if (req.method === 'OPTIONS') {
    // no check token for OPTIONS requests
    return next();
  }

  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
  if (token) {
    try {
      var decoded = jwt.decode(token, req.app.get('jwtTokenSecret'));
      if (decoded.exp <= Date.now()) {
        var error = new Error('Token expired');
        error.status = 403;
        return next(error);
      }
      var m = new model();
      m.getUser(decoded.iss,function(err, data) {
        if (err) {
          var error = new Error('Invalid token, error fetching user from DB');
          error.status = 403;
          return next(error);
        }

        if (data && data.rows && data.rows.length) {
          var user = data.rows[0];
          user.id = user.users_id;
          delete user.password;
          delete user.users_id;
          res.user = user;
          next();
        }
        else {
          error = new Error('Invalid token, cannot find user');
          error.status = 403;
          next(error);
        }
      });
    }
    catch (err) {
      error = new Error('Invalid token');
      error.status = 403;
      return next(error);
    }
  }
  else {
    error = new Error('No token provided');
    error.status = 403;
    next(error);
  }
}

function checkCallback(req, res, next) {
  if (!req.query.cb) {
    var error = new Error('Invalid parameters');
    error.status = 422;
    return next(error);
  } else {
    next();
  }
}

function checkPublishedOrCheckToken(req, res, next) {
  var publicToken = (req.body && req.body.access_token_public) || (req.query && req.query.access_token_public) || req.headers['x-access-token-public'];
  if (publicToken) {
    var host = req.headers['x-custom-host'] || (req.protocol + '://' + req.get('host'));
    var requested = {
      'url': host + req.originalUrl,
      'data': req.body
    }

    var m = new model();
    m.getWidgetByToken(publicToken).then(function(data) {
      return m.promiseRow(data);
    }).then(function(stored) {
      // Only first ocurrence per widget (url)
      // var stored = data.rows[0];
      var validRequest = _.findWhere(stored.payload, {'url': requested.url});

      if (validRequest) {
        if (_.isEqual(validRequest.data, requested.data)) {

          res.locals.publishedWidget = true;
          return next();

        } else {
          var error = new Error('Invalid payload');
          error.status = 403;
          return next(error);
        }
      }
      else {
        var error = new Error('Something went wrong checking token, url or payload');
        error.status = 403;
        return next(error);
      }

    }).catch(function(err) {
      var error = new Error('Invalid token');
      error.status = 403;
      return next(error);
    });
  }
  // It not public token, continue to standard token validation
  else {
    return checkToken(req, res, next);
  }
}

function processNode(user,node,ops) {

  for (var i in ops) {
    if (ops[i] === 'read' || ops[i] === 'write') {
      if (!user.superadmin && node[ops[i] + '_users'].indexOf(user.id)===-1) {
        return false;
      }
    }
    else {
      throw new Error('Unsupported operation');
    }
  }
  return true;
}

function processNodes(user,ops,nodes) {
  var resp = [];

  for (var i in nodes) {
    if (processNode(user,nodes[i],ops))
      resp.push(nodes[i]);
  }
  return resp;
}
/*
// function node(node,ops){
//   ops = ops || ['read'];
//   return function(req,res,next){
//     // First check the token
//     token(req,res,function(error){
//       if (error)
//         return next(error);
//
//       // valid token.
//       // if (!node)
//       //   // No parameters. Just check the token
//       //   return next();
//
//       if (typeof node === 'object'){
//         // Node already fetched
//         if (processNode(res.user.id,ops,node)){
//           return next();
//         }
//         else{
//           var error = new Error('Forbidden');
//           error.status = 403;
//           return next(error);
//         }
//       }
//       else{
//         var m = new model();
//         m.getNode(node,function(err,node){
//           if (err){
//             var error = new Error('Cannot check users_grap node');
//             console.error(err);
//             return next(error);
//           }
//
//           if (node){
//             if (processNode(res.user.id,ops,node)){
//               return next();
//             }
//             else{
//               var error = new Error('Forbidden');
//               error.status = 403;
//               return next(error);
//             }
//           }
//           else{
//             var error = new Error('Graph node not found');
//             error.status = 403;
//             next(error);
//           }
//         });
//       }
//     });
//   }
// }
*/

/*
For a list of nodes it returns the nodes who are actually allowed for the current user.
Params:
  - opts: {
    nodes : "could be a list of node ids or a list of nodes. If you've both options choose the list of nodes",
    user_id: user_id,
    ops: ["read","write"]
  }
  - cb: callback function
*/
function checkNodesFN(opts,cb) {
  if (!opts || !opts.nodes || !opts.nodes.length)
    return cb(null,[]);

  opts.ops = opts.ops||['read'];
  //Check if nodes are a list of ids or objects

  if (typeof opts.nodes[0] === 'object') {
    // It's a list of objects
    cb(null,processNodes(opts.user,opts.ops,opts.nodes));
  }
  else {
    // It's a list of node ids. Let's recover it from DB.
    var m = new model();
    m.getNodes(opts.nodes,function(err,nodes) {
      if (err)
        return cb(err);
      var resp = processNodes(opts.user,opts.ops,nodes);
      resp = resp.map(function(n) {
        return n.id;
      });
      cb(null,resp);
    });
  }
}

function checkNodesMiddleware(nodes,ops) {
  ops = ops || ['read'];

  return function(req,res,next) {

    if (!res.user) {
      var error = new Error('Forbidden');
      error.status = 403;
      return next(error);
    }

    checkNodesFN({
      nodes: nodes,
      user: res.user,
      ops : ops
    },function(err,allow_nodes) {

      if (allow_nodes.length > 0) {
        req.auth = {
          'allow_nodes' : allow_nodes
        };
        next();
      }
      else {
        var error = new Error('Forbidden');
        error.status = 403;
        next(error);
      }
    });
  }
}

function checkNotifierToken(req, res, next) {
  if (req.method === 'OPTIONS') {
    // No need to check token for OPTIONS requests
    return next();
  }

  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
  if (token) {
    try {
      var decoded = jwt.decode(token, req.app.get('jwtNotifierTokenSecret'));
      if (decoded.exp <= Date.now()) {
        var error = new Error('Token expired');
        error.status = 403;
        return next(error);
      }

      return next();

    } catch (err) {
      error = new Error('Invalid token');
      error.status = 403;
      return next(error);
    }

  } else {
    error = new Error('No token provided');
    error.status = 403;
    return next(error);
  }
}

module.exports.checkToken = checkToken;
module.exports.checkPublishedOrCheckToken = checkPublishedOrCheckToken;
module.exports.checkNodesFN = checkNodesFN;
module.exports.checkNodesMiddleware = checkNodesMiddleware;
module.exports.checkNotifierToken = checkNotifierToken;
module.exports.checkCallback = checkCallback;

module.exports.invalidUserPassword = invalidUserPassword;
