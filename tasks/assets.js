const { src, dest } = require('gulp');

function copyHtml() {
  src('app/renderer/styles/icons/*').pipe(dest('build/renderer/styles/icons/'));
  return src('app/renderer/index.html').pipe(dest('build/renderer'));
}

copyHtml.displayName = 'copy-html';

exports.copyHtml = copyHtml;
