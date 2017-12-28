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

const GeoJSONFormatter = require('../protools/geojsonformatter.js');
const MetadataInstanceModel = require('./metadatainstancemodel');
const PGSQLModel = require('./pgsqlmodel.js');
const QueryBuilder = require('../protools/querybuilder.js');
const utils = require('../utils.js');

const log = utils.log();

class MapsModel extends PGSQLModel {
  constructor(cfg) {
    super(cfg);
  }

  get this() {
    return this;  // Because parent is not a strict class
  }

  entitiesNow(opts) {
    return new MetadataInstanceModel()
    .getEntitiesForDevicesMapByEntity(opts.scope, opts.entity)
    .then((data) => {
      if (!data.rows.length) {
        return Promise.reject('No rows returned from query');
      }

      let qb = new QueryBuilder(opts);
      let bbox = qb.bbox();
      let filter = qb.filter();

      data = data.rows[0]
      let schema = data.dbschema;
      let table = data.table_name;
      let columns = ['id_entity', 'ST_AsGeoJSON(position) AS geometry',
                     '"TimeInstant"', ...data.vars];

      let sql = `SELECT ${ columns.join(', ') }
          FROM ${ schema }.${ table }_lastdata
          WHERE TRUE
          ${ bbox }
          ${ filter }`;

      // TODO: Last (using `now()`) value of the aggregated variables

      return this.promise_query(sql, null);
    })
    .then((data) => {
      data = new GeoJSONFormatter().featureCollection(data.rows);
      return Promise.resolve(data);
    })
    .catch((err) => {
      return Promise.reject(err);
    });
  }

}

module.exports = MapsModel;
