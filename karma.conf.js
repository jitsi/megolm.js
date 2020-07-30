module.exports = function(config) {
    config.set({
        frameworks: ["jasmine", "karma-typescript"],
        files: [
            "src/**/*.ts",
            {
                pattern: "node_modules/olm/*.wasm",
                included: false,
                served: true,
                type: "wasm"
            }
        ],
        preprocessors: {
            "**/*.ts": "karma-typescript"
        },
        mime: {
            'application/wasm': ['wasm']
        },
        proxies: {
            "/base/node_modules/karma-typescript/dist/client/olm.wasm": "/base/node_modules/olm/olm.wasm"
        },
        reporters: ["progress", "karma-typescript"],
        browsers: ["Chrome"],
        singleRun: true,
        karmaTypescriptConfig: {
            compilerOptions: {
                lib: ["es2017", "dom"],
                target: "ES2016",
            },
        },
    });
};
