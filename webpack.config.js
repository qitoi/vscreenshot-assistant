const path = require('path');
const glob = require('glob');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const ts = path.resolve(__dirname, 'src', 'js', '*.{ts,tsx}');

const entries = glob.sync(ts).reduce((acc, file) => {
    const name = path.basename(file, path.extname(file));
    acc[name] = file;
    return acc;
}, {});

module.exports = {
    mode: 'production',
    entry: entries,
    output: {
        path: path.resolve(__dirname, 'build', 'vscreenshot-assistant'),
        filename: 'js/[name].js',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                'LICENSE',
                'THIRD-PARTY-NOTICES',
                {
                    from: '**/*.*',
                    context: 'src',
                    globOptions: {
                        ignore: [
                            '**/src/js',
                        ],
                    },
                    info: {
                        minimized: true,
                    },
                },
            ]
        }),
    ],
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename]
        }
    },
    optimization: {
        minimize: false,
        /*
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ]
         */
    },
    performance: {
        hints: false,
    },
};
