const { src, dest } = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const inject = require('gulp-inject-string');
const sass = require('gulp-sass');

function build() {
  return src('app/**/*.js')
    .pipe(babel())
    .pipe(inject.replace('process.env.NODE_ENV', '"production"'))
    .pipe(dest('build'));
}

function developBuild() {
  return src('app/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write())
    .pipe(dest('build'));
}

function buildStyles() {
  return src('app/renderer/styles/main.scss')
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(dest('build/renderer/styles/'));
}

function developStyles() {
  return src('app/renderer/styles/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(sourcemaps.write('./maps'))
    .pipe(dest('build/renderer/styles/'));
}

build.displayName = 'build-scripts';
developBuild.displayName = 'dev-build-scripts';
buildStyles.displayName = 'build-styles';
developStyles.displayName = 'dev-build-styles';

exports.build = build;
exports.developBuild = developBuild;
exports.buildStyles = buildStyles;
exports.developStyles = developStyles;
