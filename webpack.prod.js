const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const config = require('./webpack.common');

module.exports = config.map(c => merge(c, {
    mode: 'production',
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        defaults: false,
                        unused: true,
                    },
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ]
    },
}));
