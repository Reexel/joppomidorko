const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
    const isProd = env && env.joplin && env.joplin.env === 'prod';
    return {
        mode: isProd ? 'production' : 'development',
        entry: './src/index.ts',
        target: 'node',
        module: {
            rules: [
                { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
            libraryTarget: 'commonjs2',
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: 'src/manifest.json', to: '.' },
                    { from: 'src/webview.js', to: '.' },
                    { from: 'src/webview.css', to: '.' },
                    { from: 'src/i18n-data.js', to: '.' },
                ],
            }),
        ],
    };
};
