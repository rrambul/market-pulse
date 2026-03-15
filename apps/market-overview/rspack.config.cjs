const { createRemoteConfig } = require('../../tools/rspack-remote.cjs');

module.exports = createRemoteConfig({
  name: 'marketOverview',
  port: 3001,
  dirname: __dirname,
  exposes: {
    './MarketOverview': './src/market-overview.ts',
  },
});
