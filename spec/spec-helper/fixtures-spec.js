/** @babel */

import path from "path";

describe("fixtures", function () {
	it("should set paths to the fixtures folder", function () {
		expect(atom.project.getPaths()).toContain(path.resolve(__dirname, "../fixtures"));
	});

	it("should resolve this package to this path", function () {
		var packagePath = atom.packages.resolvePackagePath("atom-jasmine3-test-runner");
		expect(path.resolve(packagePath)).toBe(path.resolve(__dirname, "../../"));
	});

	it("should resolve a regular package", function () {
		expect(_ => { path.resolve(atom.packages.resolvePackagePath("tree-view")); }).not.toThrow();
	});
});
