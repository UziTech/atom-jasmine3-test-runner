describe("package-deps", () => {
	const deps = [
		"atom-ide-markdown-service",
		"atom-ide-datatip",
		// no need to wait for all of them
		// "atom-ide-signature-help",
		// "atom-ide-hyperclick",
		// "atom-ide-definitions",
		// "atom-ide-outline",
		// "linter",
		// "linter-ui-default",
	];

	beforeAll(async () => {
		// Trigger deferred activation
		atom.packages.triggerDeferredActivationHooks();
		// Activate activation hook
		atom.packages.triggerActivationHook("core:loaded-shell-environment");
		// Activate the package
		await atom.packages.activatePackage("atom-ide-base");
		// wait until package-deps installs the deps
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, 10000);
		});
	}, 11000);

	it("installs the dependencies in the correct test path", function () {
		const allPackages = atom.packages.getAvailablePackageNames();
		deps.forEach((dep) => {
			expect(allPackages.includes(dep)).toBeTruthy();
		});
	});
});
