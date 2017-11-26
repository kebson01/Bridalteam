var path = require('path');
var DashboardPlugin = require('webpack-dashboard/plugin');

module.exports = {
    entry: "./src/index.js",
    output: {
        path: "../public/js/react",
        filename: "reactui.js"
    },
    
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: [
                    path.resolve(__dirname, "./src"),
                ], 
                loader: "babel-loader",
                options: {
                    presets: ['es2015', 'react'],
                    plugins: ['transform-runtime', 'transform-decorators-legacy', 'transform-class-properties']
                }
            }
        ]
    },
    plugins:[
        new DashboardPlugin()
    ],
    watch: true
};