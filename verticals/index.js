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

const fs = require('fs');
const publishedOrLogged = require('../auth.js').publishedOrLogged;
const utils = require('../utils');

const log = utils.log();

let verticalsLoader = function(app) {
  let thisDir = '.';
  let verticalsDirName = `${thisDir}/verticals`;
  let routesFileName = 'routes.js';
  let configFileName = 'config.js';

  // For each things inside 'verticals'
  for (let vertical of fs.readdirSync(verticalsDirName)) {
    let verticalDir = `${verticalsDirName}/${vertical}`;
    let routesFile = `${verticalDir}/${routesFileName}`;
    let configFile = `${verticalDir}/${configFileName}`;

    // Checking that 'routes.js' exists
    if (fs.lstatSync(verticalDir).isDirectory() && fs.existsSync(routesFile)
        && fs.lstatSync(routesFile).isFile()) {
      let importVerticalString = `${thisDir}/${vertical}/${routesFileName}`;
      let verticalModule = require(importVerticalString);

      // Looking for a 'config.js'
      if (fs.existsSync(configFile) && fs.lstatSync(configFile).isFile()) {
        let importConfigString = `${thisDir}/${vertical}/${configFileName}`;
        let config = require(importConfigString);

        app.use(config.path, publishedOrLogged, config.specialAuth, verticalModule);
        log.info(`Loading '${vertical}' special vertical`);

      // Without 'config.js'
      } else {
        let pathString = `/:scope/${vertical}`;
        app.use(`/:scope/${vertical}`, publishedOrLogged, verticalModule);
        log.info(`Loading '${vertical}' vertical`);
      }
    }
  }
};

module.exports = verticalsLoader;
