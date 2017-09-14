'use strict';

var PGSQLModel = require('./pgsqlmodel.js');
var utils = require('../utils');
var log = utils.log();

class FramesModel extends PGSQLModel {
  get this () {
    return this;
  }

  getFramesList (opts) {
    var sql = `SELECT id, url, title, description, source, datatype
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

  getFrame (opts) {
    var sql = `SELECT id, url, title, description, source, datatype
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
    var sql = `INSERT INTO public.frames_scope (title, url, description, source, datatype, scope_id)
      VALUES ('${opts.title}', '${opts.url}', '${opts.description}', '${opts.source}', '${opts.datatype}', '${opts.scope}')`;

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
    var sql = `UPDATE public.frames_scope SET
      title = '${opts.title}',
      url = '${opts.url}',
      description = '${opts.description}',
      source = '${opts.source}',
      datatype = '${opts.datatype}',
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
