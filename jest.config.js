module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	testPathIgnorePatterns: ["node_modules", "dist"],
	collectCoverageFrom: [
		"src/**/*.ts",
		"!**/*mock.ts",
		"!**/public-api.ts",
		"!**/query-repo.ts"
	]
};
