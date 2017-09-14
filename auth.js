'use strict';

var auth = require('./auth_graph');
var config = require('./config');
var check = auth.check;
var graph = auth.graph;
var utils = require('./utils');
var log = utils.log();
var _ = require('underscore');

function protect(elements,ops){

  return function(req,res,next){
    if (req.method == 'OPTIONS'){
      return next();
    }

    if (!req.scope){
      if (!elements || !elements.length){
          return check.token(req,res,next);
      }
      else{
        var error = new Error('No scope provided');
        error.status = 403;
        return next(error);
      }
    }

    // find scopenode
    graph.getTreeByName(req.scope,function(err,nodes){
      if (err)
        return next(err);

        // if (!element || element==req.scope){
        //   // Check if users can see the scope
        //   return check.node(nodes[0],ops)(req,res,next);
        // }
        // else{
        //   // check the element inside the scope
        //   graph.findByName(element,nodes[0].id,function(err,nodes){
        //     if (err)
        //       return next(err);
        //
        //     return check.node(nodes[0],ops)(req,res,next);
        //   });
        // }


        // get nodes to analyze
        var rnodes = [];
        // remove nodes not requested
        for (var i in nodes){
          if (elements.indexOf(nodes[i].name)!=-1){
            rnodes.push(nodes[i]);
          }
        }

        check.checkNodesMiddleware(rnodes,ops)(req,res,next);

    });
  }
}

function protectScopes(scopes,ops,opts){

  opts = _.defaults(opts||{},{'notfound_action': 'forbidden'});

  return function(req,res,next){

    if(isSuperAdmin(res.user)){
      return next();
    }

    if (req.method == 'OPTIONS'){
      return next();
    }

    // find scopenode
    graph.findByNames(scopes,function(err,nodes){
      if (err)
        return next(err);

      if (!nodes.length && opts.notfound_action == 'notfound'){
        var error = new Error('Not found');
        error.status = 404;
        return next(error);
      }
      else{
        check.checkNodesMiddleware(nodes,ops)(req,res,next);
      }


    });
  }
}

/**
  - opts{
    scope: <scope>,
    user_id: <user_id>
    elements: [element1,element2]
    ops: ['read','write']. Default to ['read']
  }
*/
function validElements(opts,cb){
  opts.ops = opts.ops || ['read'];

  // find scopenode
  graph.getTreeByName(opts.scope,function(err,nodes){
    if (err)
      throw new Error(err);
    nodes = nodes.filter(function(n){
        return opts.elements.indexOf(n.name) != -1;
    });

    check.checkNodesFN({
      nodes: nodes,
      user_id: opts.user_id,
      ops: opts.ops
    },function(err,data){
      if (err)
        return cb(err);

      cb(null,data.map(function(n){
        return n.name;
      }));
    });

  });
}

/**
  - opts{
    scopes: [<scope>]
    user_id: <user_id>
    ops: ['read','write']. Default to ['read']
  }
*/
function validScopes(opts,cb){
  opts.ops = opts.ops || ['read'];

  // find scopenode
  graph.findByNames(opts.scopes,function(err,nodes){
    if (err)
      throw new Error(err);

    check.checkNodesFN({
      nodes: nodes,
      user_id: opts.user_id,
      ops: opts.ops
    },function(err,data){
      if (err)
        return cb(err);

      cb(null,data.map(function(n){
        return n.name;
      }));

    });

  });
}

function protectSuperAdmin(req,res,next){

  if(req.method === 'OPTIONS'){
    return next();
  }

  if (!isSuperAdmin(res.user))
    next(utils.error('forbidden',403));
  else
    next();
}

function protectUserId(user_id){
  return function(req,res,next){

    if (isSuperAdmin(res.user) || res.user.id==user_id)
      next();
    else
      next(utils.error('forbidden',403));
  }
}

function isSuperAdmin(user){
  return  !(!user || !user.superadmin);
}

function findByNamesInScope(id_scope,names,cb){
  graph.findByNamesL1([id_scope],function(err,nodes){
    if (err)
      return cb(err);
    if (!nodes || !nodes.length)
      return cb(null,null);
    graph.findByNames(names,nodes[0].id,cb);
  });
}


module.exports.validateVariables = function(ident){
  return function(req, res, next){

    var variables;
    var placeholder;
    if(req.body[ident]){
      placeholder = 'body';
      variables = req[placeholder][ident];
    } else if (req.query[ident]){
      placeholder = 'query';
      variables = req[placeholder][ident];
      variables = variables.split(',');
    } else if (req.params[ident]){
      placeholder = 'params';
      variables = req[placeholder][ident];
    } else {
      placeholder = null;
      variables = ident;
    }

    var scope = req.scope;

    if(res.user && res.user.id){

      var user_id = res.user.id;
      if(typeof variables !== 'object'){
        variables = [variables];
      }

      var opts = {
        scope: scope,
        user_id: user_id,
        elements: variables
      };

      validElements(opts, function(err, valids){
        if(err || !valids){
          var error = new Error('Forbidden or not found variables: ' + JSON.stringify(variables));
          error.status = 403;
          return next(error);
        }

        if(placeholder){
          if(placeholder==='query'){
            valids = valids.join(',')
            req[placeholder][ident] = valids;
            return next();
          }
          else if(placeholder==='params'){
            valids = Array.from(new Set(valids));
          }

          req[placeholder][ident] = [];
          // The very same order than requested
          _.each(variables, function(variable){
            if(valids.indexOf(variable)!=-1){
              req[placeholder][ident].push(variable);
            }
          })

        }
        else {
          if(!_.isEqual(new Set(valids), new Set(variables))){
            log.warn(valids);
            log.warn(variables);
            var error = new Error('Forbidden variables: ' + JSON.stringify(variables));
            error.status = 403;
            return next(error);
          }
        }

        var logmsg = `VALIDATED: ${variables} => ${valids} @ ${placeholder}`;
        // log.warn(logmsg);

        return next();

      });

    }
    else if(res.locals.publishedWidget) {
      return next();
    }
    else {
      var error = new Error("Forbidden");
      error.status = 403;
      return next(error);
    }
  }
}


module.exports.protectSuperAdmin = protectSuperAdmin;
module.exports.protectUserId = protectUserId;
module.exports.protect = protect;
module.exports.protectScopes = protectScopes;
module.exports.validElements = validElements;
module.exports.validScopes = validScopes;
module.exports.logged = check.checkToken;
module.exports.publishedOrLogged = check.checkPublishedOrCheckToken;
module.exports.getUserGraph = graph.getUserGraph;
module.exports.findByNamesInScope = findByNamesInScope;
module.exports.findByName = graph.findByName;
module.exports.updateNode = graph.updateNode;
module.exports.createEmptyNode = graph.createEmptyNode;
module.exports.deleteNodeByName = graph.deleteNodeByName;
module.exports.routes = auth.routes;
module.exports.checkNotifierToken = check.checkNotifierToken;
