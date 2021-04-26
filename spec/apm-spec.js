"use babel";
import { spawnSync } from "child_process";
import { readdirSync } from "fs";
import { join } from "path";

describe("apm", () => {
	it("installs the dependencies in the correct test path", function () {
		spawnSync("apm install atom-ide-base", { shell: true, stdio: "inherit", encoding: "utf8" });
		let packages = readdirSync(join(atom.configDirPath, "packages));
		expect(packages).toContain("atom-ide-base");
	});
});
