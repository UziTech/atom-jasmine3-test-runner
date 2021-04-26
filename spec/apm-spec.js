"use babel";
import { spawnSync } from "child_process";

describe("apm", () => {
	it("installs the dependencies in the correct test path", function () {
		spawnSync("apm install atom-ide-base", { shell: true, stdio: "inherit", encoding: "utf8" });
		const allPackages = atom.packages.getAvailablePackageNames();
		expect(allPackages.includes("atom-ide-base")).toBeTruthy();
	});
});
