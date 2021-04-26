/** @babel */

import { exec } from "child_process";
import { promisify } from "util";
import { readdir } from "fs";
import { join } from "path";

const execAsync = promisify(exec);
const readdirAsync = promisify(readdir);

describe("apm", () => {
	it("installs the dependencies in the correct test path", async () => {
		await execAsync("apm install test-engines-package");
		const packages = await readdirAsync(join(atom.configDirPath, "packages"));
		expect(packages).toContain("test-engines-package");
	}, 60000);
});
