const path = require('path')
const tsTransformPaths = require('@zerollup/ts-transform-paths')
const mode = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'production'

module.exports = {
    mode,
    entry: {
        'eriengine-core-plugin-particle': [
            '@babel/polyfill',
            path.resolve(__dirname, 'src', 'eriengine-core-plugin-particle.ts')
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'particle', 'src'),
        filename: '[name].js',
        library: 'eriengine-core-plugin-particle',
        libraryTarget: 'umd'
    },
    externals: [
        'phaser'
    ],
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|gif|svg|woff2?)(\?.*)?$/,
                exclude: path.resolve(__dirname, 'node_modules'),
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            esModule: false
                        }
                    }
                ]
            },
            {
                test: /\.ts$/,
                exclude: path.resolve(__dirname, 'node_modules'),
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-typescript'
                            ],
                            plugins: [
                                '@babel/plugin-proposal-class-properties',
                                '@babel/proposal-object-rest-spread'
                            ]
                        }
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            getCustomTransformers: (program) => {
                                const transformer = tsTransformPaths(program)
                    
                                return {
                                    before: [transformer.before], // for updating paths in generated code
                                    afterDeclarations: [transformer.afterDeclarations] // for updating paths in declaration files
                                }
                            }
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.json', '.png'],
        alias: {
            '@common': path.resolve(__dirname, '../@common'),
            '@assets': path.resolve(__dirname, 'src', 'Assets')
        },
        modules: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../', '@common', 'node_modules')
        ]
    }
}