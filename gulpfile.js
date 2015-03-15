'use strict';

var gulp = require('gulp'),
		$ = require('gulp-load-plugins')(),
		minifyCss = require('gulp-minify-css'),
		paths = {
			css: 'public/css/*.css',
			css_dist: 'dict/*.css',
			dist: 'public/dist/',
			js: 'public/js/*.js'
		};

gulp.task('css', function () {
  return gulp.src(paths.css)
    .pipe(minifyCss())
    .pipe($.concat('showlist.min.css'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('js', function () {
  return gulp.src(paths.js)
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
	gulp.watch(paths.css, ['css'])
	gulp.watch(paths.js, ['jshint', 'js'])
});

gulp.task('build', ['js', 'css']);

gulp.task('default', ['build', 'watch']);
