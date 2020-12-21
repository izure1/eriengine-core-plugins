const path = require('path')
const tsTransformPaths = require('@zerollup/ts-transform-paths')
const mode = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'production'

module.exports = {
    mode,
    entry: {
        'eriengine-core-plugin-actor': path.resolve(__dirname, 'src', 'eriengine-core-plugin-actor.ts')
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'actor', 'src'),
        filename: '[name].js',
        library: 'eriengine-core-plugin-actor',
        libraryTarget: 'umd'
    },
    externals: {
        phaser: 'Phaser'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    getCustomTransformers: (program) => {
                        const transformer = tsTransformPaths(program)
                        return {
                            afterDeclarations: [transformer.afterDeclarations] // for updating paths in declaration files
                        }
                    }
                }
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