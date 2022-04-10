import { Configuration } from 'webpack'
import path from 'path'
import { VueLoaderPlugin }  from "vue-loader";
import webpack  from 'webpack';
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

export default (env: any, argv: Configuration) => {
  const MAIN = !!(env && env.main)
  const PRELOAD = !!(env && env.preload)
  const PROD = !!(argv.mode && argv.mode === 'production')
  if (PROD) {
    process.env.NODE_ENV = 'production'
  }

  return {
    target: MAIN || PRELOAD ? 'electron-main' : 'electron-renderer',
    entry: MAIN
      ? './src/main/AppMain.ts'
      : PRELOAD
      ? {"preload":'./src/common/Preload.ts'}
      // : './src/renderer/AppRenderer.tsx',
      : './src/renderer/App.ts',
    output: {
      path: PROD ? `${__dirname}/dist/src/assets` : `${__dirname}/src/assets`,
      filename: MAIN ? 'main.js' : PRELOAD ? '[name].js' : 'renderer.js'
    },
    devtool: PROD ? undefined : 'inline-source-map',
    node: {
      __dirname: false,
      __filename: false
    },
    resolve: {
      // extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
      extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
      alias: {
        // '@': path.resolve(__dirname, "./src/renderer"),
        // vue: "vue/dist/vue.js",
        // 'vue': 'vue/dist/vue.runtime.esm-bundler.js',
        'vue$': 'vue/dist/vue.runtime.esm.js',
      }
    },
    module: {
      rules: [
        // {
        //   test: /\.tsx?$/,
        //   loader: 'ts-loader',
        //   exclude: /node_modules/,
        //   options: {
        //     //Then there are settings for a ts-loader, which helps load the TypeScript with Vue.
        //     //We also specified the appendTsSuffixTo: [/\.vue$/], option to ts-loader in our webpack.config.js file,
        //     //which allows TypeScript to process the code extracted from a single file component.
        //     //https://github.com/TypeStrong/ts-loader#appendtssuffixto
        //     // appendTsSuffixTo: [/\.vue$/],
        //   },
        // },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              // options: { url: false }
            }
          ]
        },

        /*{
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },

        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[contenthash].[ext]',
                useRelativePath: true,
                esModule: false // <- here
              }
            }
          ],
        },*/

        {
          test: /\.vue$/,
          use: 'vue-loader'
        },
        {
          // test: /\.(ts|js)?$/,
          test: /\.(tsx|ts)?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                appendTsSuffixTo: [/\.vue$/]
              }
            },
            {
              loader: 'ifdef-loader',
              options: {
                env: PROD ? 'PRODUCTION' : 'DEBUG'
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [
          // 'main.js',
          // 'preload.js',
          // 'renderer.js',
          'inject.js',
          // 'assets/*'
        ],
      }),
      new MiniCssExtractPlugin(),
      new webpack.DefinePlugin({
        "__VUE_OPTIONS_API__": true,
        "__VUE_PROD_DEVTOOLS__": false
      }),
      new VueLoaderPlugin(),
      new CopyPlugin({
        patterns: [
          { from: "./src/inject.js", to: "inject.js" },
          { from: "./index.html", to: "index.html" },
          // { from: "./src/attr_config.json", to: "attr_config.json" },
          // { from: "./src/common/remote-debugger-interface", to: "remote-debugger-interface" },
          // { from: "./src/renderer/assets/css", to: "css" },
          // { from: "./src/renderer/assets/fonts", to: "fonts" },
        ],
      }),
    ],
    externals: MAIN || PRELOAD ? [] : ['electron']
  }
}
