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
              plugins: [
                'transform-react-jsx',
                ['react-css-modules', { generateScopedName: cssModulesScopedName }],
            ]
          }
          },
          // TypeScript をコンパイルする
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.webpack.json'
            }
          }
        ]
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            // Must use css-loader@3 because hash generator of css-loader@4 is different from that of 'react-css-modules'
            // See https://github.com/webpack-contrib/css-loader/issues/877
            loader: 'css-loader', 
            options: {
              modules: {
                localIdentName: cssModulesScopedName,
              },
              importLoaders: 1,
              sourceMap: true,
            }
          },
        ]
      }
    ]
  },
  resolve: {
    extensions: [
      '.ts',
	    '.tsx',      
	    '.js' // for node_modules
    ],
    modules: [
	    'node_modules', 
    ],
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM"
  }
};
