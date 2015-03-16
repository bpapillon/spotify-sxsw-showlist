'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    minifyCss = require('gulp-minify-css'),
    paths = {
      css: 'public/css/*.css',
      dist: 'public/dist/',
      js: ['public/js/*.js', 'app.js', 'lib/*.js'],
      js_public: 'public/js/*.js'
    };

gulp.task('css', function () {
  return gulp.src(paths.css)
    .pipe(minifyCss())
    .pipe($.concat('showlist.min.css'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('js', function () {
  return gulp.src(paths.js_public)
    .pipe($.uglify())
    .pipe($.concat('showlist.min.js'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('jshint', function () {
  return gulp.src(paths.js)
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('watch', function() {
  gulp.watch(paths.css_main, ['css:main'])
  gulp.watch(paths.css_print, ['css:print'])
  gulp.watch(paths.js, ['jshint'])
  gulp.watch(paths.js_public, ['js'])
});

gulp.task('build', ['js', 'css']);

gulp.task('default', ['build', 'watch']);
