const path = require('path');
const cssModulesScopedName = '[path]___[name]__[local]___[hash:base64:5]';

module.exports = {
  devtool: 'source-map',
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: './src/settings/settings.ts',
  output: {
    path: path.resolve(__dirname, 'dist/settings'),
    filename: 'main.js'
  },

  module: {
    rules: [
      {
        // 拡張子 .ts .tsx の場合
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
              'transform-react-jsx',
              ['react-css-modules', { generateScopedName: cssModulesScopedName }],
            ]
          }
          },
          // TypeScript をコンパイルする
          'ts-loader'
        ]
      },
      {
        test: /\.css$/,
        use: {
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: cssModulesScopedName,
            },
            importLoaders: 1,
            sourceMap: false,
          }
        },
      }
    ]
  },
  // import 文で .ts ファイルを解決するため
  resolve: {
    extensions: [
      '.ts',
	    '.tsx',      
	    '.js' // node_modulesのライブラリ読み込みに必要
    ],
    modules: [
	    'node_modules', // node_modules 内も対象とする
    ],
  }
};
