const builder = require('electron-builder');

const buildConfig = {
  nsis: {
    installerHeader: './dist-assets/installerHeader.bmp',
    installerHeaderIcon: './dist-assets/installerIcon.ico',
    installerIcon: './dist-assets/installerIcon.ico',
    oneClick: false,
    perMachine: false,
    uninstallDisplayName: 'Uninstall StarVPN',
    differentialPackage: false,
  },
};
function packWin() {
  return builder.build({
    config: buildConfig,
    targets: builder.Platform.WINDOWS.createTarget(),
  });
}

function packWinX64() {
  return builder.build({
    config: buildConfig,
    win: ['nsis:x64'],
  });
}

function packWinIa32() {
  return builder.build({
    config: buildConfig,
    win: ['nsis:ia32'],
  });
}

function packMac() {
  return builder.build({
    config: buildConfig,
    targets: builder.Platform.MAC.createTarget(),
  });
}

function packLinux() {
  return builder.build({
    config: buildConfig,
    targets: builder.Platform.LINUX.createTarget(),
  });
}

function publishWinX64() {
  return builder.build({
    config: buildConfig,
    win: ['nsis:x64'],
    publish: 'always',
  });
}

packWin.displayName = 'builder-win';
packWinIa32.displayName = 'builder-win-ia32';
packWinX64.displayName = 'builder-win-x64';
packMac.displayName = 'builder-mac';
packLinux.displayName = 'builder-linux';
publishWinX64.displayName = 'publish-win-x64';

exports.packWin = packWin;
exports.packWinIa32 = packWinIa32;
exports.packWinX64 = packWinX64;
exports.packMac = packMac;
exports.packLinux = packLinux;
exports.publishWinX64 = publishWinX64;
