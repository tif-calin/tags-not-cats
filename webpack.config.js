const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const { HotModuleReplacementPlugin } = require("webpack");
const ReactRefreshTypeScript = require("react-refresh-typescript").default;

const isDevelopment = true; // TODO(culi): Set this based on your environment

module.exports = [
  {
    mode: isDevelopment ? "development" : "production",
    entry: "./src/electron.ts",
    target: "electron-main",
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          resolve: { extensions: [".ts", ".js"] },
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
              options: {
                getCustomTransformers: () => ({
                  before: [isDevelopment && ReactRefreshTypeScript()].filter(Boolean),
                }),
                transpileOnly: isDevelopment,
              },
            },
          ],
        },
      ],
    },
    output: {
      devtoolModuleFilenameTemplate: "[absolute-resource-path]",
      path: __dirname + "/dist",
      filename: "electron.js",
    },
    plugins: [isDevelopment && new ReactRefreshWebpackPlugin()].filter(Boolean),
    node: {
      __dirname: false,
    },
  },
  {
    mode: "production",
    entry: "./src/preload.ts",
    target: "electron-preload",
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          resolve: {
            extensions: [".ts", ".js"],
          },
          use: [{ loader: "ts-loader" }],
        },
      ],
    },
    output: {
      path: __dirname + "/dist",
      filename: "preload.js",
    },
  },
  {
    mode: "production",
    entry: "./src/index.tsx",
    target: "web",
    devtool: "source-map",
    performance: {
      hints: false,
    },
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          include: /src/,
          resolve: {
            extensions: [".ts", ".tsx", ".js"],
          },
          use: [{ loader: "ts-loader" }],
        },
      ],
    },
    output: {
      path: __dirname + "/dist",
      filename: "index.js",
    },
    plugins: [
      new NodePolyfillPlugin(),
      new HtmlWebpackPlugin({
        template: "./src/index.html",
      }),
    ],
  },
];
