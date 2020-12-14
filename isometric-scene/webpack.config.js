const path = require('path')
const mode = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'production'

module.exports = {
    mode,
    entry: {
        'eriengine-core-plugin-isometric-scene': path.resolve(__dirname, 'src', 'eriengine-core-plugin-isometric-scene.ts')
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: 'eriengine-core-plugin-isometric-scene',
        libraryTarget: 'umd'
    },
    externals: {
        phaser: 'Phaser'
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
        alias: {
            '@common': path.resolve(__dirname, '../common')
        },
        modules: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../', 'common', 'node_modules')
        ]
    }
}