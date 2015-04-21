var gulpfile = require('./gulpfile.js'),
  gulp = require('gulp'),
  prettyTime = require('pretty-hrtime'),
  tasks = ['all'];

if (process.argv.length > 2) {
  tasks = [process.argv[2]];
};

gulp.on('task_start', function(e) {
  log('Running \'' + e.task + '\'....');
});

gulp.on('task_stop', function(e) {
  var time = prettyTime(e.hrDuration);
  log('Finished \'' + e.task + '\' in ' + time);
});

gulp.on('task_err', function(e) {
  var msg = formatError(e);
  var time = prettyTime(e.hrDuration);
  log('Errored\'' + e.task + '\' in ' + time + '  ' + msg);
});

gulp.on('task_not_found', function(e) {
  log('Task \'' + e.task + '\' was not defined in your gulpfile but you tried to run it.');
  log('Please check the documentation for proper gulpfile formatting.');
  process.exit(1);
});


gulp.start.apply(gulp, tasks);


function log(s) {
  console.log(' [gulp] ' + s);
}

function formatError(e) {
  if (!e.err) return e.message;
  if (e.err.message) return e.err.message;
  return JSON.stringify(e.err);
}
