var path = require("path");

module.exports = {
	resolve: {
		extensions: [".ts", ".js"],
	},
	entry: "./src/main.ts",
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist"),
		publicPath: "/",
	},
	module: {
		rules: [{ test: /\.ts?$/, loader: "ts-loader" }],
	},
	devtool: "inline-source-map",
	devServer: {
		host: "0.0.0.0",
		contentBase: path.join(__dirname, "src"),
		stats: {
			assets: false,
			hash: false,
			chunks: false,
			errors: true,
			errorDetails: true,
		},
		overlay: true,
	},
};
