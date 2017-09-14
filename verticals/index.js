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
