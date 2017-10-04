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

var gulp = require('gulp');
var batch = require('gulp-batch');
var watch = require('gulp-watch');
var spawn = require('child_process').spawn;
var node;

gulp.task('start', function() {
  if (node) {
    node.kill('SIGKILL');
  }
  node = spawn('node', ['./bin/www'], {stdio: 'inherit'});
  node.on('close', function(code) {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...');
    }
  });
});

gulp.task('start-dev', ['start'], function () {
  watch('./**/*.js', batch(function(events, done) {
    gulp.start('start', done);
  }));
});

gulp.task('default', ['start']);

// clean up if an error goes unhandled.
process.on('exit', function() {
  if (node) {
    node.kill()
  }
});
