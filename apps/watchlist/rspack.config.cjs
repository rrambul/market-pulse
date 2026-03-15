const { createRemoteConfig } = require('../../tools/rspack-remote.cjs');

module.exports = createRemoteConfig({
  name: 'watchlist',
  port: 3002,
  dirname: __dirname,
  exposes: {
    './WatchlistPanel': './src/watchlist-panel.ts',
  },
});
