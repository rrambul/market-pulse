const { ModuleFederationPlugin, HtmlRspackPlugin } = require('@rspack/core').container ? 
  { ModuleFederationPlugin: require('@rspack/core').container.ModuleFederationPlugin, HtmlRspackPlugin: require('@rspack/core').HtmlRspackPlugin } :
  {};
const rspack = require('@rspack/core');
const path = require('path');

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: 'http://localhost:3000/',
    uniqueName: 'shell',
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
    new rspack.HtmlRspackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
    }),
    new rspack.container.ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        marketOverview: 'marketOverview@http://localhost:3001/remoteEntry.js',
        watchlist: 'watchlist@http://localhost:3002/remoteEntry.js',
        assetDetails: 'assetDetails@http://localhost:3003/remoteEntry.js',
        tradeStream: 'tradeStream@http://localhost:3004/remoteEntry.js',
        alerts: 'alerts@http://localhost:3005/remoteEntry.js',
      },
      shared: {
        'lit': { singleton: true, eager: true },
        '@lit-labs/signals': { singleton: true, eager: true },
        'signal-polyfill': { singleton: true, eager: true },
        '@market-pulse/contracts': { singleton: true, eager: true },
        '@market-pulse/state': { singleton: true, eager: true },
        '@market-pulse/ui': { singleton: true, eager: true },
        '@market-pulse/utils': { singleton: true, eager: true },
        '@market-pulse/market-client': { singleton: true, eager: true },
      },
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    static: {
      directory: path.resolve(__dirname, 'public'),
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    historyApiFallback: true,
  },
};
