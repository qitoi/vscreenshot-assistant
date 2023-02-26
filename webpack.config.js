/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const Package = require('./package.json');

// サポートするブラウザ
const browsers = ['chrome', 'firefox', 'edge', 'opera'];
const browsersPattern = browsers.join('|');

const ENV = process.env?.NODE_ENV ?? 'development';
const BROWSER = process.env?.BROWSER ?? 'chrome';

const entries = (files) => files.reduce((acc, file) => {
    const name = path.basename(file, path.extname(file));
    acc[name] = file;
    return acc;
}, {});

const reactAppScripts = glob.sync('./src/js/*.tsx');
const contentsScripts = glob.sync('./src/js/contents-!(twitter)*.ts');
const otherScripts = glob.sync('./src/js/*.ts').filter(file => !contentsScripts.includes(file));

const outputPath = path.resolve(__dirname, 'build', BROWSER);

const commonConfig = {
    output: {
        path: outputPath,
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
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.EnvironmentPlugin(['BROWSER']),
    ],
};

const envConfig = (ENV === 'production') ? {
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
} : {
    mode: 'development',
    devtool: 'inline-source-map',
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename]
        }
    },
};

module.exports = [
    // アルバム・オプション画面用のスクリプトのコンパイル
    merge(
        commonConfig,
        envConfig,
        {
            entry: entries(reactAppScripts),
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
        },
    ),
    // プラットフォーム用のコンテンツスクリプトのビルド
    merge(
        commonConfig,
        envConfig,
        {
            entry: entries(contentsScripts),
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
    ),
    // その他のスクリプトのビルド
    merge(
        commonConfig,
        envConfig,
        {
            entry: entries(otherScripts),
        },
    ),
    // staticファイルのコピー
    {
        mode: ENV,
        output: {
            path: outputPath,
        },
        entry: {},
        plugins: [
            new CopyPlugin({
                patterns: [
                    'LICENSE',
                    'THIRD-PARTY-NOTICES',
                    'CHANGELOG.md',
                    {
                        from: '**/*.*',
                        context: 'src',
                        globOptions: {
                            ignore: [
                                '**/src/js',
                                `**/*.(${browsersPattern}).[!.]+`,
                            ],
                        },
                    },
                    {
                        from: `**/*.${BROWSER}.*`,
                        to: ({ context, absoluteFilename }) => {
                            const filename = path.relative(context, absoluteFilename);
                            return filename.replace(new RegExp(`(${browsersPattern})\\.(?<ext>[^.]+)$`), '$<ext>');
                        },
                        context: 'src',
                        transform: (input, absoluteFilename) => {
                            if (path.extname(absoluteFilename) === '.json') {
                                const content = input.toString('utf-8');
                                const replaced = content.replaceAll('__EXTENSION_VERSION__', Package.version);
                                return Buffer.from(replaced);
                            }
                            return input;
                        },
                    },
                ],
            }),
        ],
    },
];
