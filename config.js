
var buble = require('rollup-plugin-buble');
import uglify from 'rollup-plugin-uglify';

var config = {
  entry: 'src/main.js',
  dest: 'dist/bundle.js',
  format: 'umd',
  plugins: [
    buble()
  ]
}

var env = process.env.NODE_ENV;
if(env=="prd"){
  config.plugins.push(uglify());
  config.dest = "dist/bundle.min.js";
}

export default config;

