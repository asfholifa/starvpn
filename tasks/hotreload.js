const { series, src, dest } = require('gulp');
const inject = require('gulp-inject-string');
const fs = require('fs');
const path = require('path');

const browserSync = require('browser-sync').create();

function startBrowserSync(done) {
  browserSync.init(
    {
      ui: false,
      localOnly: true,
      port: 35829,
      ghostMode: false,
      open: false,
      notify: false,
      logSnippet: false,
      // https: {
      //   key: path.join(__dirname, '/key.pem'),
      //   cert: path.join(__dirname, '/certificate.pem')
      // }
    },
    function(error) {
      done(error);
    },
  );
}

function injectBrowserSync() {
  return src('app/renderer/index.html')
    .pipe(inject.before('</body>', browserSync.getOption('snippet')))
    .pipe(
      inject.after('script-src', " 'unsafe-eval' " + browserSync.getOption('urls').get('local')),
    )
    .pipe(dest('build/renderer'));
}

function reloadBrowser(done) {
  browserSync.reload();
  done();
}

startBrowserSync.displayName = 'start-hotreload';
injectBrowserSync.displayName = 'inject-hotreload';
reloadBrowser.displayName = 'reload-hotreload';

exports.start = series(startBrowserSync, injectBrowserSync);
exports.inject = injectBrowserSync;
exports.reload = reloadBrowser;
