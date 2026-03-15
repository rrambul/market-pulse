const { createRemoteConfig } = require('../../tools/rspack-remote.cjs');

module.exports = createRemoteConfig({
  name: 'tradeStream',
  port: 3004,
  dirname: __dirname,
  exposes: {
    './TradeStream': './src/trade-stream.ts',
  },
});
