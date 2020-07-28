const path = require('path');
const { mainModule } = require('process');

module.exports = {
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
        // TypeScript をコンパイルする
        use: 'ts-loader'
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
