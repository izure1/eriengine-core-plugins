const path = require('path')
const tsTransformPaths = require('@zerollup/ts-transform-paths')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const mode = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'production'

module.exports = {
    mode,
    entry: {
        'eriengine-core-plugin-dialogue': path.resolve(__dirname, 'src', 'eriengine-core-plugin-dialogue.ts')
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'dialogue', 'src'),
        filename: '[name].js',
        library: 'eriengine-core-plugin-dialogue',
        libraryTarget: 'umd'
    },
    externals: {
        phaser: 'phaser'
    },
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|gif|svg|woff2?)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    esModule: false
                }
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                    getCustomTransformers: (program) => {
                        const transformer = tsTransformPaths(program)
            
                        return {
                            before: [transformer.before], // for updating paths in generated code
                            afterDeclarations: [transformer.afterDeclarations] // for updating paths in declaration files
                        }
                    }
                }
            },
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            esModule: false
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.json', '.jpg', '.jpeg', '.png', '.gif', '.svg'],
        alias: {
            '@common': path.resolve(__dirname, '../@common'),
            '@assets': path.resolve(__dirname, 'src', 'Components', 'Assets')
        },
        modules: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../', '@common', 'node_modules')
        ]
    },
    plugins: [
        new VueLoaderPlugin
    ]
}