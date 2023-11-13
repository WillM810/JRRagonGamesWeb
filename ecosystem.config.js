module.exports = {
  apps : [{
    name: 'JRRagonGameWeb',
    script: './build/index.js',
    watch: [ 'build' ],
    env: {
      'NODE_ENV': 'production'
    }
  }]
};
