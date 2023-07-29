/*
 *  Copyright 2023 qitoi
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as path from 'path';
import { globSync } from 'glob';
import * as webpack from 'webpack';
import { merge } from 'webpack-merge';
import * as CopyPlugin from 'copy-webpack-plugin';
import * as TerserPlugin from 'terser-webpack-plugin';
import * as ZipPlugin from 'zip-webpack-plugin';

import * as Package from './package.json';


function glob(pattern: string): string[] {
    return globSync(pattern)
        .map(p => './' + path.relative(__dirname, p))
        .map(p => p.replace(/\\/g, '/'));
}


const ENV = (process.env?.NODE_ENV === 'development' || process.env?.NODE_ENV === 'production') ? process.env?.NODE_ENV : 'development';
const BROWSER = process.env?.BROWSER ?? 'chrome';


// サポートするブラウザ
const browsers = ['chrome', 'firefox', 'edge', 'opera'];
const browsersPattern = browsers.join('|');


const entries = (prefix: string, files: string[]): Record<string, string> => files.reduce<Record<string, string>>((acc, file) => {
    const name = path.basename(file, path.extname(file));
    acc[prefix + name] = file;
    return acc;
}, {});


const reactAppPrefix = 'react-app:';
const reactAppEntries = entries(reactAppPrefix, glob('./src/js/*.tsx'));
const contentsPrefix = 'contents:';
const contentsScripts = glob('./src/js/contents-!(twitter)*.ts');
const contentsEntries = entries(contentsPrefix, contentsScripts);
const otherPrefix = ':';
const otherEntries = entries(otherPrefix, glob('./src/js/*.ts').filter(file => !contentsScripts.includes(file)));


const envConfig: Partial<webpack.Configuration> = (ENV === 'production') ? {
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
    devtool: 'inline-source-map',
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename]
        }
    },
};

const config: webpack.Configuration = {
    mode: ENV,
    entry: {
        ...reactAppEntries,
        ...contentsEntries,
        ...otherEntries,
    },
    output: {
        path: path.resolve(__dirname, 'build', BROWSER),
        filename(pathData) {
            const key = pathData.chunk?.name ?? '';
            const index = key.indexOf(':');
            const name = key.substring(index + 1);
            return `js/${name}.js`;
        },
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
        // twitter-text で古い core-js が使われており CSP の unsafe-eval の違反のためエラーになる
        // 対象としているブラウザではこれらの polyfill は不要なので import させない
        alias: {
            'core-js': false,
        }
    },
    performance: {
        hints: false,
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks(chunk) {
                        return chunk.name?.startsWith(reactAppPrefix) ?? false;
                    },
                    minChunks: 2,
                },
                vendorContents: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor-contents',
                    chunks(chunk) {
                        return chunk.name?.startsWith(contentsPrefix) ?? false;
                    },
                    minChunks: 2,
                },
            },
        },
    },
    plugins: [
        new webpack.EnvironmentPlugin(['BROWSER']),
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
                        const filename = path.relative(context, absoluteFilename ?? '');
                        return filename.replace(new RegExp(`(${browsersPattern})\\.(?<ext>[^.]+)$`), '$<ext>');
                    },
                    context: 'src',
                    transform: (input, absoluteFilename) => {
                        if (path.extname(absoluteFilename) === '.json') {
                            const content = input.toString('utf-8');
                            const replaced = content.replace(/__EXTENSION_VERSION__/g, Package.version);
                            return Buffer.from(replaced);
                        }
                        return input;
                    },
                },
            ],
        }),
        // @ts-ignore
        new ZipPlugin({
            path: path.join(__dirname, 'dist'),
            filename: `${Package.name}-${BROWSER}-v${Package.version}.zip`,
        }),
    ],
};

export default merge(envConfig, config);
