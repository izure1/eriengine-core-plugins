const path = require('path')
const tsTransformPaths = require('@zerollup/ts-transform-paths')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const AddAsset = require('add-asset-html-webpack-plugin')
const mode = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'production'

module.exports = {
    mode: 'development',
    entry: {
        'eriengine-core-test': path.resolve(__dirname, 'src', 'index.ts')
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: 'eriengine-core-test',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: path.resolve(__dirname, 'node_modules'),
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
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../', '@common', 'node_modules')
        ],
        alias: {
            '~': path.resolve(__dirname, '../')
        }
    },
    devServer: {
        host: '192.168.0.12',
        port: 9002
    },
    plugins: [
        new HtmlWebpackPlugin({ template: 'template.html' }),
        new AddAsset({ filepath: 'assets/**/*.*' })
    ]
}