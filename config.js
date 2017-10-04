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

var yaml = require('js-yaml');
var fs = require('fs');

// Logs params
var LOG_LEVELS = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF'];
var LOG_OUTPUTS = ['console', 'file', 'dailyRotatingFile', 'sizeRotatingFile'];

// Log folders structure
var LOG_DEFAULT_DIR = './logs';
var LOG_DEFAULT_FILENAME = 'the_log';
var LOG_DEFAULT_MAX_SIZE = 20;
var LOG_DEFAULT_OLD_FILES = 5;

class Config {

  constructor() {
    this._data = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
  }

  getData() {
    return this._data;
  }

  getCARTO(id_scope, id_category) {
    /*
    var cfgCartoUser = this._data.categories.find(function(data){
      return data.id ==  id_category;
    });

    var cartoUser = this._data.carto.find(function(data){
      return data.user == (cfgCartoUser.scopes ?
        cfgCartoUser.scopes.find(function(data){
          return data.id == id_scope;
        }).carto_user :
        cfgCartoUser.carto.user
      );
    });

    return Promise.resolve(cartoUser);
    */

    return new Promise((resolve, reject) => {
      var MetadataInstanceModel = require('./models/metadatainstancemodel');
      var m = new MetadataInstanceModel();
      m.getCARTOAccount(id_scope)
      .then(data => {
        if (!data.rows || !data.rows.length)
          return reject(new Error(`Not found account for scope: ${id_scope} and category ${id_category}`));

        var account = data.rows[0].account;
        var cartoUser = this._data.carto.find(function(d){
          return d.user ==  account;
        });
        if (!cartoUser)
          return reject(new Error(`Not found API KEY at config for account: ${account}`));

        resolve(cartoUser);
      })
      .catch(err => {
        reject(err);
      })
    });
  }

  getDeMA(dema_access_token) {
    if('dema' in this._data){
      return this._data.dema.orion.filter( d => { return d.secret == dema_access_token })[0];
    }
    return;

  }

  getDefaultCARTOUser() {
    return this._data.carto.find(u => {
      return u.default;
    })
  }

  createFolderSync(folder) {
    fs.existsSync(folder) || fs.mkdirSync(folder);
  }

  getLogOpt() {
    // Config vars
    var _logging = this._data.logging;
    var _file = _logging && _logging.file ? _logging.file : null;
    var _access = _logging && _logging.access ? _logging.access : null;

    // Filename vars
    var fileDir = _file && _file.dir ? _file.dir : LOG_DEFAULT_DIR;
    var suffixFilename = _file && _file.name ? _file.name : LOG_DEFAULT_FILENAME;
    suffixFilename = `${ fileDir }/${ suffixFilename }`;

    var errorFilename = `${ suffixFilename }-errors.log`;
    var filename = `${ suffixFilename }.log`;

    // Appenders definition
    var fileErrorAppender = {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: {
        type: 'file',
        filename: errorFilename
      }
    };

    var logAppenderConsole = [
      {
        type: 'console'
      }
    ];

    var logAppenderFile =  [
      {
        type: 'file',
        filename: filename
      }
    ];

    var logAppenderDailyRotatingFile = [
      {
        type: 'dateFile',
        filename: filename,
        pattern: '.yyyy-MM-dd'
      }
    ];

    var logAppenderSizeRotatingFile = [
      {
        type: 'file',
        filename: filename,
        maxLogSize: Math.pow((_file && _file.maxSize ? _file.maxSize : LOG_DEFAULT_MAX_SIZE) * 1024, 2),
        numBackups: _file && _file.oldFiles ? _file.oldFiles : LOG_DEFAULT_OLD_FILES
      }
    ];

    if (_file && _file.separateError) {
      logAppenderFile.push(fileErrorAppender);
      logAppenderDailyRotatingFile.push(fileErrorAppender);
      logAppenderSizeRotatingFile.push(fileErrorAppender);
    }

    // log4js parameters definition
    var logParams = {
      output: LOG_OUTPUTS[0],
      level: LOG_LEVELS[3],
      access: { level: LOG_LEVELS[3] },
      logappenders: logAppenderConsole
    };

    // Reading from config file
    if (_logging) {
      if (_logging.level && LOG_LEVELS.includes(_logging.level)) {
        logParams.level = _logging.level;
      }

      if (_access && _access.level && LOG_LEVELS.includes(_access.level)) {
        logParams.access.level = _access.level;
      }

      if (_access && _access.format) {
        logParams.access.format = _access.format;
      }

      if (_access && _access.nolog) {
        logParams.access.nolog = _access.nolog;
      }

      if (_logging.output && _logging.output.endsWith('ile')) {
        this.createFolderSync(fileDir);
        logParams.output = _logging.output;

        if (_logging.output === 'file') {
          logParams.logappenders = logAppenderFile;

        } else if (_logging.output === 'dailyRotatingFile') {
          logParams.logappenders = logAppenderDailyRotatingFile;

        } else if (_logging.output === 'sizeRotatingFile') {
          logParams.logappenders = logAppenderSizeRotatingFile;
        }

        // Creating a message for the console
        errorFilename = _file && _file.separateError ? ' & ' + errorFilename : '';
        logParams.consoleMessage = `Logging into files: ${ filename }${ errorFilename }`;
      }
    }

    return logParams;
  }

}

module.exports = new Config();
