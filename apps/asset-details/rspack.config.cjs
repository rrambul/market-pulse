const { createRemoteConfig } = require('../../tools/rspack-remote.cjs');

module.exports = createRemoteConfig({
  name: 'assetDetails',
  port: 3003,
  dirname: __dirname,
  exposes: {
    './AssetDetails': './src/asset-details.ts',
  },
});
