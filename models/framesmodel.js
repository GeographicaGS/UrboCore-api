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

var PGSQLModel = require('./pgsqlmodel.js');
var utils = require('../utils');
var log = utils.log();

class FramesModel extends PGSQLModel {
  get this () {
    return this;
  }

  getFramesList (opts) {
    var sql = `SELECT id, url, title, description, source, datatype, type, vertical
      FROM public.frames_scope
      WHERE scope_id = '${opts.scope}'
      ORDER BY id`;

    return this.promise_query(sql)
      .then(function (data) {
        return Promise.resolve(data.rows);  // TODO: Think of returning a 404 if it fails
      }.bind(this))
      .catch(function (error) {
        log.error(error);
        return Promise.reject(error);
      });
  }

  getFramesByVertical (opts) {

    if (opts.vertical) {
      var vertical = `'${opts.vertical}'`;
    } else {
      var vertical = `NULL`;
    }

    var sql = `SELECT id, url, title, description, source, datatype, type, vertical
      FROM public.frames_scope
      WHERE scope_id = '${opts.scope}' AND type=${opts.type} AND vertical=${vertical}
      ORDER BY id`;

    return this.promise_query(sql)
      .then(function (data) {
        return Promise.resolve(data.rows);  // TODO: Think of returning a 404 if it fails
      }.bind(this))
      .catch(function (error) {
        log.error(error);
        return Promise.reject(error);
      });
  }

  getFrame (opts) {
    var sql = `SELECT id, url, title, description, source, datatype, type, vertical
      FROM public.frames_scope
      WHERE id = '${opts.id}'`;

    return this.promise_query(sql)
      .then(function (data) {
        return Promise.resolve(data.rows[0]);  // TODO: Think of returning a 404 if it fails
      }.bind(this))
      .catch(function (error) {
        log.error(error);
        return Promise.reject(error);
      });
  }

  createFrame (opts) {

    if (opts.vertical) {
      var vertical = `'${opts.vertical}'`;
    } else {
      var vertical = `NULL`;
    }

    var sql = `INSERT INTO public.frames_scope (title, url, description, source, datatype, type, vertical, scope_id)
      VALUES ('${opts.title}', '${opts.url}', '${opts.description}', '${opts.source}', '${opts.datatype}', ${opts.type}, ${vertical}, '${opts.scope}')`;

    return this.promise_query(sql)
      .then(function (data) {
        return Promise.resolve(data);
      }.bind(this))
      .catch(function (error) {
        log.error(error);
        return Promise.reject(error);
      });
  }

  updateFrame (opts) {

    if (opts.vertical) {
      var vertical = `'${opts.vertical}'`;
    } else {
      var vertical = `NULL`;
    }

    var sql = `UPDATE public.frames_scope SET
      title = '${opts.title}',
      url = '${opts.url}',
      description = '${opts.description}',
      source = '${opts.source}',
      datatype = '${opts.datatype}',
      type = ${opts.type},
      vertical = ${vertical},
      scope_id = '${opts.scope}'
      WHERE id = ${opts.id}`;

    return this.promise_query(sql)
      .then(function (data) {
        return Promise.resolve(data);
      }.bind(this))
      .catch(function (error) {
        log.error(error);
        return Promise.reject(error);
      });
  }

  deleteFrame (opts) {
    var sql = `DELETE FROM public.frames_scope
      WHERE id = ${opts.id}`;

    return this.promise_query(sql)
      .then(function (data) {
        return Promise.resolve(data);
      }.bind(this))
      .catch(function (error) {
        log.error(error);
        return Promise.reject(error);
      });
  }
}

module.exports = FramesModel;
