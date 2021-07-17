const { merge } = require('webpack-merge');
const config = require('./webpack.common');

module.exports = config.map(c => merge(c, {
    mode: 'development',
    devtool: 'inline-source-map',
}));
