
import uglify from 'rollup-plugin-uglify';
import path from 'path';
const flow = require('rollup-plugin-flow-no-whitespace');
const buble = require('rollup-plugin-buble');

export default {
  entry: 'src/main.js',
  dest: 'dist/bundle.js',
  format: 'umd',
  plugins: [
    flow(),
    buble()
  ]
};

