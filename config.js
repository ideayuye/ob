
var buble = require('rollup-plugin-buble');
var uglify = require('rollup-plugin-uglify');
var replace = require('rollup-plugin-replace');

var config = {
  entry: 'src/main.js',
  dest: 'dist/bundle.js',
  format: 'umd',
  moduleName: 'Ob',
  plugins: [
    buble()
  ]
}

var env = process.env.NODE_ENV;
if(env=="prd"){
  config.plugins.push(replace({
    'process.env.NODE_ENV': JSON.stringify('production')
  }))
  config.plugins.push(uglify());
  config.dest = "dist/ob.min.js";
}else if(env=="dev"){
  config.plugins.push(replace({
    'process.env.NODE_ENV': JSON.stringify('dev')
  }))
  config.dest = "dist/ob.dev.js";
}

export default config;

