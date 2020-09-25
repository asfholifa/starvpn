const { src, dest } = require('gulp');

function copyHtml() {
  src('app/renderer/styles/icons/*').pipe(dest('build/renderer/styles/icons/'));
  src('app/renderer/styles/icons/flags/*').pipe(dest('build/renderer/styles/icons/flags/'));
  src('app/renderer/styles/icons/flags/*').pipe(dest('build/renderer/styles/icons/flags/'));
  src('app/renderer/styles/icons/flags/1x1/*').pipe(dest('build/renderer/styles/icons/flags/1x1/'));
  src('app/renderer/styles/icons/flags/4x3/*').pipe(dest('build/renderer/styles/icons/flags/4x3/'));
  return src('app/renderer/index.html').pipe(dest('build/renderer'));
}

copyHtml.displayName = 'copy-html';

exports.copyHtml = copyHtml;
