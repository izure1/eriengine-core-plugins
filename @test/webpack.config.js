const path = require('path')
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
                loader: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../', '@common', 'node_modules')
        ]
    },
    devServer: {
        port: 8002
    },
    plugins: [
        new HtmlWebpackPlugin({ template: 'template.html' }),
        new AddAsset({ filepath: 'assets/**/*.*' })
    ]
}