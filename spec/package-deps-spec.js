describe("package-deps", () => {
	const deps = [
		"atom-ide-markdown-service",
		"atom-ide-datatip",
		"atom-ide-signature-help",
		"atom-ide-hyperclick",
		"atom-ide-definitions",
		"atom-ide-outline",
		"linter",
		"linter-ui-default",
	];

	beforeAll(async () => {
		// Trigger deferred activation
		atom.packages.triggerDeferredActivationHooks();
		// Activate activation hook
		atom.packages.triggerActivationHook("core:loaded-shell-environment");
		// Activate the package
		await atom.packages.activatePackage("atom-ide-base");
	});

	it("installs the dependencies in the correct test path and activates them", function () {
		expect(atom.packages.isPackageLoaded("atom-ide-base")).toBeTruthy();
		deps.forEach(async (dep) => {
			await atom.packages.activatePackage(dep);
			expect(atom.packages.isPackageLoaded(dep)).toBeTruthy();
		});
	});
});
