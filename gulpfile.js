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
