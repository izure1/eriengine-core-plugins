const path = require('path')
const tsTransformPaths = require('@zerollup/ts-transform-paths')
const mode = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'production'

module.exports = {
    mode,
    entry: {
        'eriengine-core-plugin-isometric-scene': [
            '@babel/polyfill',
            path.resolve(__dirname, 'src', 'eriengine-core-plugin-isometric-scene.ts')
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'isometric-scene', 'src'),
        filename: '[name].js',
        library: 'eriengine-core-plugin-isometric-scene',
        libraryTarget: 'umd'
    },
    externals: [
        'phaser'
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
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
                ],
                exclude: path.resolve(__dirname, 'node_modules')
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            '@common': path.resolve(__dirname, '../@common')
        },
        modules: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../', '@common', 'node_modules')
        ]
    }
}