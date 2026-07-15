module.exports = {
    testMatch: ["**/__tests__/**/*.test.js"],
    testEnvironment: "node",
    collectCoverageFrom: [
        "src/services/**/*.js",
        "src/routes/**/*.js",
        "src/utils/**/*.js",
        "!src/db/database.js",
    ],
    coverageDirectory: "coverage",
    verbose: true,
};
