
var buble = require('rollup-plugin-buble');
// import uglify from 'rollup-plugin-uglify';
// import path from 'path';

export default {
  entry: 'src/main.js',
  dest: 'dist/bundle.js',
  format: 'umd',
  plugins: [
    buble()
  ],
};

