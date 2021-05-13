/** @babel */

import Grim from "grim";
import glob from "glob";
import path from "path";
import fs from "fs-plus";
import util from "util";
import { exec } from "child_process";
import { ipcRenderer } from "electron";
import _ from "underscore-plus";
import temp from "temp";
import Jasmine from "jasmine";
import TimeReporter from "./time-reporter/time-reporter";
import AtomReporter from "./atom-reporter/atom-reporter";
import SetupView from "./setup-view";

temp.track();

const async = {
	exists: (f) => new Promise(r => fs.access(f, (err) => r(!err))),
	makeTree: (f) => new Promise(r => fs.makeTree(f, r)),
	symlink: util.promisify(fs.symlink),
	open: util.promisify(fs.open),
	exec: util.promisify(exec),
	isDirectory: (f) => new Promise(r => fs.isDirectory(f, r)),
	glob: (p, o) => new Promise((r, err) => glob(p, o, (e, m) => e ? err(e) : r(m)))
};

async function findPackageRoot(dir) {
	if (await async.exists(path.join(dir, "package.json"))) {
		return dir;
	}
	const parent = path.dirname(dir);
	if (parent === dir) {
		return null;
	}
	return findPackageRoot(parent);
}

async function logToTerminal(logFile) {
	let logStream;
	if (logFile) {
		logStream = await async.open(logFile, "w");
	}
	const log = logStream
		// This needs to be sync so the process doesn't close before the log is written.
		// eslint-disable-next-line no-sync
		? () => (str) => fs.writeSync(logStream, str)
		: (stream) => (str) => ipcRenderer.send(`write-to-${stream}`, str);

	return {
		stdout: log("stdout"),
		stderr: log("stderr"),
	};
}

function setSpecProperties(suite, specDirectory) {
	suite.specDirectory = specDirectory;
	for (const child of suite.children) {
		if (child.children) {
			setSpecProperties(child, specDirectory);
		} else {
			if (!child.specType) {
				child.suite = suite;
				child.specDirectory = specDirectory;
				child.specType = "user";
			}
		}
	}
}

function isFocused(suite) {
	for (const child of suite.children) {
		if (child.priority > 0 || (child instanceof jasmine.Suite && isFocused(child))) {
			return true;
		}
	}
	return false;
}

const defaults = {
	reporter: null,
	timeReporter: false,
	specHelper: false,
	showColors: true,
	htmlTitle: "",
	suffix: "-spec",
	legacySuffix: "-spec-v1",
	showEditor: false,
	testPaths: null,
	testPackages: [],
	random: false,
	seed: null,
	silentInstallation: false,
	buildCommand: null,
};

export default function createRunner(options = {}, configFunc) {
	if (typeof options === "function") {
		// eslint-disable-next-line no-param-reassign
		configFunc = options;
		// eslint-disable-next-line no-param-reassign
		options = defaults;
	} else {
		// eslint-disable-next-line no-param-reassign
		options = { ...defaults, ...options };
		if (typeof configFunc !== "function") {
			// eslint-disable-next-line no-param-reassign
			configFunc = function () {};
		}
	}
	if (/\.(js|coffee|ts)$/.test(options.suffix)) {
		options.fileGlob = `**/*${options.suffix}`;
		options.fileRegexp = new RegExp(options.suffix);
	} else {
		options.fileGlob = `**/*${options.suffix}.+(js|coffee|ts)`;
		options.fileRegexp = new RegExp(`${options.suffix}\\.(js|coffee|ts)`);
	}
	if (/\.(js|coffee|ts)$/.test(options.legacySuffix)) {
		options.fileLegacyGlob = `**/*${options.legacySuffix}`;
		options.fileLegacyRegexp = new RegExp(options.legacySuffix);
	} else {
		options.fileLegacyGlob = `**/*${options.legacySuffix}.+(js|coffee|ts)`;
		options.fileLegacyRegexp = new RegExp(`${options.legacySuffix}\\.(js|coffee|ts)`);
	}

	return async ({ testPaths, buildAtomEnvironment, buildDefaultApplicationDelegate, logFile, headless, legacyTestRunner }) => {
		let resolveWithResult;
		const promise = new Promise(resolve => {
			resolveWithResult = resolve;
		});
		const setupView = new SetupView({ headless, silentInstallation: options.silentInstallation });

		try {
			const jasmine = new Jasmine();

			for (const key in jasmine) {
				window[key] = jasmine[key];
			}

			window.headless = headless;

			const userHome = process.env.ATOM_HOME || path.join(fs.getHomeDirectory(), ".atom");
			const atomHome = await temp.mkdir({ prefix: "atom-test-home-" });
			if (options.testPackages.length > 0) {
				let { testPackages } = options;
				if (typeof testPackages === "string") {
					testPackages = testPackages.split(/\s+/);
				}
				await async.makeTree(path.join(atomHome, "packages"));
				for (const packName of testPackages) {
					const userPack = path.join(userHome, "packages", packName);
					const loadablePack = path.join(atomHome, "packages", packName);

					try {
						const type = process.platform === "win32" ? "junction" : "dir";
						async.symlink(userPack, loadablePack, type);
					} catch (ex) {
						// eslint-disable-next-line no-sync
						fs.copySync(userPack, loadablePack);
					}
				}
			}

			const applicationDelegate = buildDefaultApplicationDelegate();
			window.atom = buildAtomEnvironment({
				applicationDelegate,
				window,
				document,
				enablePersistence: false,
				configDirPath: atomHome
			});
			// used by apm, package-deps, and other headless tools
			const atomHomeBackup = process.env.ATOM_HOME;
			process.env.ATOM_HOME = atomHome;

			let print;
			if (headless) {
				const { stdout, stderr } = await logToTerminal(logFile);
				console.debug = console.log = function (...args) {
					const output = `${util.format(...args)}\n`;
					stdout(output);
				};

				console.error = function (...args) {
					const output = `${util.format(...args)}\n`;
					stderr(output);
				};

				print = function (str) {
					stdout(str);
				};
			}

			require("./spec-helper/reset-atom");
			await require("./spec-helper/spec-helper")(options.specHelper, setupView);
			require("./spec-helper/deprecations");
			require("./spec-helper/fixtures");
			require("./spec-helper/yield");

			if (!headless && options.buildCommand) {
				try {
					setupView.log(options.buildCommand);
					console.log(">", options.buildCommand);
					const { stdout } = async.exec(options.buildCommand, { cwd: await findPackageRoot(testPaths[0]) });
					console.log(stdout);
				} catch (err) {
					setupView.error(err.toString(), "building tests");
					throw err;
				}
			}

			await configFunc();
			let paths = [];
			const root = path.resolve(path.dirname(testPaths[0]));
			if (!headless && options.testPaths !== null) {
				if (!Array.isArray(options.testPaths)) {
					options.testPaths = [options.testPaths];
				}
				paths = await Promise.all(options.testPaths.map(async (p) => {
					const fullPath = path.resolve(root, p);

					if (!await async.isDirectory(fullPath)) {
						const err = new Error(`No such file or directory '${fullPath}' from testPaths`);
						setupView.error(err.toString(), "in testPaths");
						throw err;
					}

					return fullPath;
				}));
			} else {
				paths = testPaths;
			}

			const testPathFiles = await Promise.all(paths.map(async (testPath) => {
				const jasmine3Files = [];
				const legacyFiles = [];

				if (await async.isDirectory(testPath)) {
					jasmine3Files.push(...(await async.glob(path.join(testPath, options.fileGlob))).filter(f => !f.includes("node_modules")));
					if (options.legacySuffix) {
						legacyFiles.push(...(await async.glob(path.join(testPath, options.fileLegacyGlob))).filter(f => !f.includes("node_modules")));
					}
				} else {
					if (options.fileRegexp.test(testPath)) {
						jasmine3Files.push(testPath);
					} else if (options.legacySuffix && options.fileLegacyRegexp.test(testPath)) {
						legacyFiles.push(testPath);
					}
				}

				return {
					testPath,
					jasmine3Files,
					legacyFiles,
				};
			}));


			const legacyTestPaths = [];
			const jasmine3TestPaths = [];
			testPathFiles.forEach(({ testPath, jasmine3Files, legacyFiles }) => {
				jasmine3TestPaths.push(...jasmine3Files);
				legacyTestPaths.push(...legacyFiles);
				for (const file of jasmine3Files) {
					jasmine.addSpecFile(file);
					require(file);
				}
				setSpecProperties(jasmine.env.topSuite(), path.resolve(testPath));
			});

			// only works if specHelper.jasmineFocused is enabled
			const focused = isFocused(jasmine.env.topSuite());

			jasmine.onComplete(function (passed) {
				if (!focused && legacyTestPaths.length > 0) {
					Grim.clearDeprecations();
					if (headless) {
						console.log("\n\nStarting Legacy Tests");
					}
					legacyTestRunner({ testPaths: legacyTestPaths, buildAtomEnvironment, buildDefaultApplicationDelegate, logFile, headless }).then(errorCode => {
						resolveWithResult((jasmine3TestPaths.length === 0 || passed) && !errorCode ? 0 : 1);
					});
				} else {
					resolveWithResult(passed ? 0 : 1);
				}
				// restore ATOM_HOME
				process.env.ATOM_HOME = atomHomeBackup;
			});

			setupView.destroy();

			if (headless) {
				if (options.reporter) {
					jasmine.env.clearReporters();
					jasmine.addReporter(options.reporter);
				} else {
					jasmine.configureDefaultReporter({
						print,
						showColors: !logFile && options.showColors,
					});
				}
			} else {
				process.on("uncaughtException", console.error.bind(console));
				jasmine.env.clearReporters();
				if (options.timeReporter) {
					jasmine.addReporter(new TimeReporter());
				}
				jasmine.addReporter(new AtomReporter({
					legacyTestsAvailable: !focused && legacyTestPaths.length > 0,
					title: options.htmlTitle || _.undasherize(_.uncamelcase(path.basename(root))),
					showEditor: options.showEditor
				}));
			}

			Grim.clearDeprecations();

			const envConfig = {};

			envConfig.random = options.random;
			if (options.seed !== null) {
				envConfig.seed = options.seed;
			}

			jasmine.env.configure(envConfig);

			jasmine.execute();

		} catch (ex) {
			console.error(ex);
			setupView.error(ex.toString(), "loading tests");
			resolveWithResult(1);
		}

		return promise;
	};
}
