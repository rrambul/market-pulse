const { createRemoteConfig } = require('../../tools/rspack-remote.cjs');

module.exports = createRemoteConfig({
  name: 'alerts',
  port: 3005,
  dirname: __dirname,
  exposes: {
    './AlertsPanel': './src/alerts-panel.ts',
  },
});
