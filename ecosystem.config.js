module.exports = {
  apps : [{
    name: 'JRRagonGameWeb',
    script: './build/index.js',
    watch: [ 'build' ],
    env: {
      'NODE_ENV': 'production',
      'PATH_TO_STATIC_WWW': '../'
    }
  }]
};
