/**
 * Shared Rspack configuration factory for remote microfrontends.
 * Each remote calls this with its name, port, and exposed modules.
 */
const { ModuleFederationPlugin } = require('@rspack/core').container;
const path = require('path');

function createRemoteConfig({ name, port, exposes, dirname }) {
  return {
    entry: './src/index.ts',
    output: {
      path: path.resolve(dirname, 'dist'),
      filename: '[name].js',
      publicPath: `http://localhost:${port}/`,
      uniqueName: name,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name,
        filename: 'remoteEntry.js',
        exposes,
        shared: {
          'lit': { singleton: true },
          '@lit-labs/signals': { singleton: true },
          'signal-polyfill': { singleton: true },
          '@market-pulse/contracts': { singleton: true },
          '@market-pulse/state': { singleton: true },
          '@market-pulse/ui': { singleton: true },
          '@market-pulse/utils': { singleton: true },
          '@market-pulse/market-client': { singleton: true },
        },
      }),
    ],
    devServer: {
      port,
      hot: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  };
}

module.exports = { createRemoteConfig };
