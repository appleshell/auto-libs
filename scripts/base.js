const gulp = require('gulp');
const ts = require('gulp-typescript');
const del = require('del');
const sass = require('gulp-sass');
const merge = require('merge2');
const tsConfig = ts.createProject('tsconfig.build.json');

// set const path var
const paths = {
  styles: {
    src: 'lib/**/*.scss',
  },
  scripts: {
    src: ['lib/**/*.ts', 'lib/**/*.tsx', '!lib/__tests__/*', 'types/**/*.ts'],
  },
  dest: 'build/',
};

// clear dest dir
function clean() {
  return del(paths.dest);
}

// compile ts
function scripts() {
  const result = gulp
    .src(paths.scripts.src)
    .pipe(tsConfig(ts.reporter.fullReporter()))
    .on('error', () => {});

  return merge([result.js.pipe(gulp.dest(paths.dest)), result.dts.pipe(gulp.dest(paths.dest))]);
}

// compile scss
function styles() {
  return gulp
    .src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.dest));
}

// copy some files for build
function copy() {
  return gulp.src(['lib/**/*.css', 'lib/**/*.js', '!lib/__tests__/*']).pipe(gulp.dest(paths.dest));
}

// start watch files
function watch() {
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.styles.src, styles);
}

// build compile
const build = gulp.series(clean, gulp.parallel(copy, styles, scripts));

exports.watch = watch;
exports.build = build;
exports.copy = copy;
exports.scripts = scripts;
