const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
        icon: path.join(__dirname, 'favicon.ico'),
    // windows:既定のProgram Filesにインストールされます
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
            config: {
                name: 'Kuawase',
                authors: 'blackstraysheep',
                exe: 'Kuawase.exe',
                setupExe: 'Kuawase-2.0.1.exe',
                description: 'The Kuawase system is a software program that supports the implementation of haiku matching and tanka matching style battles.',
                iconUrl: 'https://raw.githubusercontent.com/blackstraysheep/Kuawase/main/favicon.ico',
                setupIcon: './favicon.ico',
                noMsi: true,
                // licenseUrl: 'https://raw.githubusercontent.com/blackstraysheep/Kuawase/main/LICENSE.txt'
              },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'blackstraysheep',
          name: 'Kuawase',
        },
        prerelease: false,
        draft: true
      },
    },
  ],
};
