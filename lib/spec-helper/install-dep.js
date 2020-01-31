/** @babel */

import { exec } from "child_process";
import semverSatisfies from "semver/functions/satisfies";

function execAsync(command, options) {
	return new Promise((resolve, reject) => {
		exec(command, options, function (err, stdout) {
			if (err) {
				return reject(err);
			}
			resolve(stdout);
		});
	});
};

async function install(pkg, version) {
	if (!version) {
		// eslint-disable-next-line no-param-reassign
		version = "*";
	}

	const commands = [
		`npm install --no-save --no-package-lock --no-audit ${pkg}@${version}`,
		`apm rebuild ${pkg}`,
	];

	for (const command of commands) {
		// console.log(`> ${command}`);
		await execAsync(command, { cwd: __dirname });
	}
}

export default async function (pkg, version = null) {
	let shouldInstall = false;

	try {
		const pkgPath = require.resolve(`${pkg}/package.json`);
		const pkgVersion = require(pkgPath).version;
		shouldInstall = !semverSatisfies(pkgVersion, version);
	} catch (ex) {
		shouldInstall = true;
	}

	if (shouldInstall) {
		await install(pkg, version);
	}
};
