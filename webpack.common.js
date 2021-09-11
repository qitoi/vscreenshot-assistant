const path = require('path');
const glob = require('glob');
const CopyPlugin = require('copy-webpack-plugin');

const tsContents = glob.sync(path.resolve(__dirname, 'src', 'js', 'contents-!(twitter)*.ts'));
const tsOthers = glob.sync(path.resolve(__dirname, 'src', 'js', '*.ts')).filter(file => !tsContents.includes(file));
const tsx = glob.sync(path.resolve(__dirname, 'src', 'js', '*.tsx'));

const entries = (files) => files.reduce((acc, file) => {
    const name = path.basename(file, path.extname(file));
    acc[name] = file;
    return acc;
}, {});

const commonConfig = {
    output: {
        path: path.resolve(__dirname, 'build', 'vscreenshot-assistant'),
        filename: 'js/[name].js',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename]
        }
    },
    performance: {
        hints: false,
    },
};

module.exports = [
    {
        ...commonConfig,
        entry: entries(tsContents),
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendor-contents',
                        chunks: 'initial',
                        minChunks: 2,
                    },
                },
            },
        },
    },
    {
        ...commonConfig,
        entry: entries(tsOthers),
    },
    {
        ...commonConfig,
        entry: entries(tsx),
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/](?!@chakra-ui[\\/]theme)/,
                        name: 'vendor',
                        chunks: 'initial',
                    },
                },
            },
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
    },
];
