const path = require("path");


module.exports = {
  mode: "none",
  entry:"./src/index.tsx",
  devtool: "",
  output: {
    library: "libx",
    libraryTarget: "umd",
    auxiliaryComment: "https://github.com/wubostc/virtualized-table-for-antd",
    filename: "index.js",
    path: path.resolve(__dirname, "lib"),
    
  },
  externals: [/react/i, /antd/i, /router/i],
  resolve: {
    extensions: [".wasm",".mjs", ".ts", ".js", ".json", ".tsx", ".less"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        enforce: "pre",
        use: [{
          loader: "ts-loader"
        }, {
          loader: "tslint-loader",
          options: {
            configFile: "./tslint.yaml",
            tsConfigFile: "tsconfig.json"
          }
        }],
        exclude: /node_modules/
      }
    ]
  },

};
