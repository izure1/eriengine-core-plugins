const path = require('path')
const tsTransformPaths = require('@zerollup/ts-transform-paths')
const mode = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'production'

module.exports = {
    mode,
    entry: {
        'eriengine-core-plugin-fog-of-war': path.resolve(__dirname, 'src', 'eriengine-core-plugin-fog-of-war.ts')
    },
    output: {
        path: path.resolve(__dirname, 'dist', 'fog-of-war', 'src'),
        filename: '[name].js',
        library: 'eriengine-core-plugin-fog-of-war',
        libraryTarget: 'umd'
    },
    externals: {
        phaser: 'phaser'
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