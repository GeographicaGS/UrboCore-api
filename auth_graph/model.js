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

var util = require('util');
var PGSQLModel = require('../models/pgsqlmodel.js');

function AuthModel() {
  PGSQLModel.call(this,[]);
}

util.inherits(AuthModel, PGSQLModel);

AuthModel.prototype.getUser = function (email,cb) {
  this.query('SELECT * FROM users WHERE email=$1::text',[email],cb);
}

AuthModel.prototype.getUserByEmail = function (email,cb) {
  this.query('SELECT * FROM users WHERE email=$1::text',[email],cb);
}

AuthModel.prototype.getUser = function (users_id,cb) {
  this.query('SELECT * FROM users WHERE users_id=$1::bigint',[users_id],cb);
}

AuthModel.prototype.addToken = function (data,cb) {
  this.query('INSERT INTO users_tokens VALUES ($1::int,$2::text,to_timestamp($3))',
    [data.user,data.token,data.expires/1000],cb);
};

/*
  opts = {
    node_id : <node_id>,
    user_id: <user_id>
    mode: read|write,
    op: add|rm
  }
*/
AuthModel.prototype.nodeGrantForUser = function (opts,cb) {

  var op = opts.op;
  var mode = opts.mode || 'read';

  if (mode!=='read' && mode!=='write')
    return cb(new Error('Unsupported mode'));

  if (op!=='add' && op!=='rm')
    return cb(new Error('Unsupported operation'));

  this.query('select users_graph_node_op($1,$2,$3,$4)',[opts.node_id,opts.user_id,mode,op],cb);

};

AuthModel.prototype.getNode = function(node_id, cb) {
  this.query('SELECT * FROM users_graph where id=$1::int',[node_id],function(err,data) {
    if (err)
      return cb(err);

    return cb(null,data.rows.length>0 ? data.rows[0]: null);
  });
}

AuthModel.prototype.getNodes = function(node_ids, cb) {
  this.query('SELECT * FROM users_graph where id IN ($1)',[node_ids.join(',')],
    function(err, data) {
      if (err)
        return cb(err);

      return cb(null,data.rows);
    });
}

AuthModel.prototype.findByName = function (name, node_id, cb) {

  node_id = node_id||1; // ROOT NODE has ID 1.;

  var query = ['WITH RECURSIVE search_graph(id,name,read_users,write_users) AS (',
    'select id,name,read_users,write_users from users_graph where id=$1',
    'UNION ALL',
    'SELECT ug.id,ug.name,ug.read_users,ug.write_users',
    'FROM search_graph sg',
    'INNER JOIN users_graph ug ON ug.parent=sg.id',
    ') select * from search_graph where name=$2'
  ];

  this.query(query.join(' '),[node_id, name], function(err,data) {
    if (err) {
      return cb(err);
    }
    cb(null,data.rows);

  });
}

AuthModel.prototype.findByNames = function (names, node_id, cb) {

  node_id = node_id||1; // ROOT NODE has ID 1.;

  var query = ['WITH RECURSIVE search_graph(id,name,read_users,write_users) AS (',
    'select id,name,read_users,write_users from users_graph where id=$1',
    'UNION ALL',
    'SELECT ug.id,ug.name,ug.read_users,ug.write_users',
    'FROM search_graph sg',
    'INNER JOIN users_graph ug ON ug.parent=sg.id',
    util.format(') select * from search_graph where name IN (\'%s\')',names.join('\',\''))

  ];

  this.query(query.join(' '), [node_id], function(err, data) {
    if (err) {
      return cb(err);
    }
    cb(null,data.rows);

  });
}

AuthModel.prototype.findByNamesL1 = function (names, node_id, cb) {

  node_id = node_id||1; // ROOT NODE has ID 1.;

  var jnames = names.join('\',\'');
  var query =
    `SELECT
      id,
      name,
      read_users,
      write_users
    FROM users_graph
    WHERE parent=$1 AND name IN ('${jnames}')`;

  this.query(query, [node_id], function(err, data) {
    if (err) {
      return cb(err);
    }
    cb(null, data.rows);

  });
}


AuthModel.prototype.getTreeByName = function (name, cb) {

  // Scope or children if multi
  var query = `
    WITH RECURSIVE search_graph(id,name,read_users,write_users) AS
    (
      SELECT
        id,
        name,
        read_users,
        write_users
      FROM users_graph WHERE id IN (
        SELECT
          g.id
        FROM metadata.scopes s JOIN public.users_graph g
        ON s.id_scope=g.name
        WHERE (
          s.parent_id_scope IS NOT NULL
          AND s.parent_id_scope!='orphan'
          AND parent_id_scope='${name}')
        OR g.name='${name}')
      UNION ALL
      SELECT
        ug.id,
        ug.name,
        ug.read_users,
        ug.write_users
        FROM search_graph sg
        INNER JOIN users_graph ug ON ug.parent=sg.id
    )
    SELECT * FROM search_graph order by id`;

  this.query(query, null, function(err, data) {
    if (err) {
      return cb(err);
    }

    cb(null, data.rows);

  });
}


AuthModel.prototype.getUserNodes = function (user_id,cb) {
  var query = [
    'SELECT id,name,$1::int=any(read_users) as read,$1::int=any(write_users) as write',
    ' FROM users_graph',
    ' WHERE $1::int=any(read_users) or  $1::int=any(write_users)'
  ];

  this.query(query.join(' '),[user_id], function(err,data) {
    if (err)
      return cb(err);

    return cb(null,data.rows);
  });
}

AuthModel.prototype.getUserGraph = function (user_id,cb) {

  var query = ['WITH RECURSIVE search_graph(id,name,parent,read_users,write_users) AS (',
    'select id,name,parent,read_users,write_users from users_graph where id=1',
    'UNION ALL',
    'SELECT ug.id,ug.name,ug.parent,ug.read_users,ug.write_users',
    'FROM search_graph sg',
    'INNER JOIN users_graph ug ON ug.parent=sg.id',
    ') select id,name,parent,$1::int=any(read_users) as read,$1::int=any(write_users) as write from search_graph order by id'
  ];

  this.query(query.join(' '), [user_id], function(err, data) {
    if (err) {
      return cb(err);
    }
    cb(null,data.rows);

  });
}


AuthModel.prototype.addEmptyNode = function( name, parent , cb) {


  var read_users = `
      SELECT read_users FROM users_graph WHERE id IN (
        SELECT
          g.id
        FROM metadata.scopes s RIGHT JOIN users_graph g
        ON s.id_scope=g.name
        WHERE (
          s.parent_id_scope IS NOT NULL
          AND s.parent_id_scope!='orphan'
          AND parent_id_scope=(select name from users_graph where id=${parent}))
        OR (g.id=${parent} AND g.id!=1))`;


  var write_users = `
      SELECT write_users FROM users_graph WHERE id IN (
        SELECT
          g.id
        FROM metadata.scopes s RIGHT JOIN users_graph g
        ON s.id_scope=g.name
        WHERE (
          s.parent_id_scope IS NOT NULL
          AND s.parent_id_scope!='orphan'
          AND parent_id_scope=(select name from users_graph where id=${parent}))
        OR (g.id=${parent} AND g.id!=1))`;


  // Permissions inheritance, when not root
  var q = `
    WITH node AS
    (INSERT INTO users_graph (name, parent, read_users, write_users)
     VALUES ('${name}','${parent}',
     coalesce( (${read_users})::bigint[], array[]::bigint[]),
     coalesce( (${write_users})::bigint[], array[]::bigint[]))
     RETURNING id)
    SELECT id from node`;

  return this.uq(q, cb);
}

AuthModel.prototype.addEmptyNodeIfNotExist = function( name, root_ancestor_name, parent_name, cb) {

  var q = `
    WITH _full_graph AS (
      WITH RECURSIVE users_graph_cte AS (
        SELECT * FROM public.users_graph
        WHERE (name = '${root_ancestor_name}')
        UNION
        SELECT ug.* FROM public.users_graph ug
        INNER JOIN users_graph_cte c ON ug.parent = c.id
      )
      SELECT *
      FROM users_graph_cte 
    ), _parent AS (
      SELECT * 
      FROM _full_graph 
      WHERE name = '${parent_name}'
      LIMIT 1
    )
    INSERT INTO public.users_graph (name, parent, read_users, write_users)
    SELECT 
      '${name}' AS name,
      (SELECT id FROM _parent) AS parent,
      coalesce((SELECT read_users FROM _parent)::bigint[], array[]::bigint[]) AS read_users,
      coalesce((SELECT write_users FROM _parent)::bigint[], array[]::bigint[]) AS write_users
    WHERE NOT EXISTS (SELECT id FROM _full_graph WHERE name = '${name}') 
    AND EXISTS (SELECT * FROM _parent)
    RETURNING id`;

  return this.uq(q, cb);
}

AuthModel.prototype.clearOrphanNodes = function(cb) {
  var q = 'DELETE from public.users_graph where id in (select id from public.users_graph where parent not in (select id from public.users_graph))';
  this.query(q, null, (function(err, d) {
    if (d.rowCount) {
      this.clearOrphanNodes(cb);
    }
    else {
      return cb(null, d);
    }
  }).bind(this));
}

AuthModel.prototype.deleteNodeByName = function(name, cb) {
  var q = 'DELETE from public.users_graph where name=\''+name+'\'';
  return this.uq(q, (function(err, d) {
    return this.clearOrphanNodes(cb);
  }).bind(this));
}

AuthModel.prototype.publishWidget = function(opts) {
  var q = `
    WITH w AS
    (INSERT INTO metadata.scope_widgets_tokens
    (id_scope, id_widget, publish_name, token, payload, description)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *)
    SELECT * from w`;

  return this.promise_query(q, [opts.scope, opts.widget, opts.publish_name, opts.token, JSON.stringify(opts.payload), opts.description ]);

}

AuthModel.prototype.unpublishWidget = function(id) {
  var sql = 'DELETE FROM metadata.scope_widgets_tokens WHERE id=$1';
  return this.promise_query(sql, [id]);
}


AuthModel.prototype.getWidgetByToken = function(token) {
  var sql = 'SELECT * FROM metadata.scope_widgets_tokens WHERE token=$1';
  return this.promise_query(sql, [token]);
}

AuthModel.prototype.getWidgetByName = function(name) {
  var sql = 'SELECT * FROM metadata.scope_widgets_tokens WHERE publish_name=$1';
  return this.promise_query(sql, [name]);
}

AuthModel.prototype.getWidgetsForScope = function(id_scope) {

  var sql = `
    SELECT
    json_build_object('widget', id_widget, 'published', json_agg(json_build_object('name',publish_name, 'token',token)))
    FROM metadata.scope_widgets_tokens WHERE id_scope=$1 GROUP BY id_widget`;
  return this.promise_query(sql, [id_scope]);
}

AuthModel.prototype.getWidgetsByTypeAndScope = function(id_scope, widget) {
  var sql = `
    SELECT
      id,
      id_scope as scope,
      id_widget as widget,
      publish_name as name,
      description,
      token as token,
      payload,
      created_at
    FROM metadata.scope_widgets_tokens WHERE id_scope=$1 AND id_widget=$2`;
  return this.promise_query(sql, [id_scope, widget]);
}

module.exports = AuthModel;
