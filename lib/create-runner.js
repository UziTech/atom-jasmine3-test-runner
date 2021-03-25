/** @babel */

import Grim from "grim";
import glob from "glob";
import path from "path";
import fs from "fs-plus";
import util from "util";
import { ipcRenderer } from "electron";
import _ from "underscore-plus";
import temp from "temp";
import Jasmine from "jasmine";
import TimeReporter from "./time-reporter/time-reporter";
import AtomReporter from "./atom-reporter/atom-reporter";
import SetupView from "./setup-view";
import symlinkDir from "symlink-dir";

temp.track();

async function logToTerminal(logFile) {
	let logStream;
	if (logFile) {
		logStream = await new Promise((resolve, reject) => {
			fs.open(logFile, "w", (err, fd) => {
				if (err) {
					reject(err);
				} else {
					resolve(fd);
				}
			});
		});
	}
	const log = logStream
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
	silentInstallation: false
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
				await fs.makeTree(path.join(atomHome, "packages"));
				for (const packName of testPackages) {
					const userPack = path.join(userHome, "packages", packName);
					const loadablePack = path.join(atomHome, "packages", packName);

					try {
						await symlinkDir(userPack, loadablePack);
					} catch (ex) {
						await fs.copy(userPack, loadablePack);
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

			await configFunc();

			let legacyTestPaths = [];
			let jasmine3TestPaths = [];
			let paths = [];
			const root = path.resolve(path.dirname(testPaths[0]));
			if (!headless && options.testPaths !== null) {
				if (!Array.isArray(options.testPaths)) {
					options.testPaths = [options.testPaths];
				}
				paths = options.testPaths.map(p => {
					const fullPath = path.resolve(root, p);
					try {
						// eslint-disable-next-line no-sync
						fs.statSync(fullPath);
					} catch (err) {
						if (err.code === "ENOENT") {
							err.message = `ENOENT: no such file or directory '${fullPath}' from testPaths`;
							setupView.error(err.toString(), "in testPaths");
						}
						throw err;
					}
					return fullPath;
				});
			} else {
				paths = testPaths;
			}
			paths.forEach(testPath => {
				// eslint-disable-next-line no-sync
				if (fs.statSync(testPath).isDirectory()) {
					const files = glob.sync(path.join(testPath, options.fileGlob)).filter(f => !f.includes("node_modules"));
					jasmine3TestPaths = jasmine3TestPaths.concat(files);
					for (const file of files) {
						jasmine.addSpecFile(file);
						require(file);
					}
					setSpecProperties(jasmine.env.topSuite(), path.resolve(testPath));
					if (options.legacySuffix) {
						legacyTestPaths = legacyTestPaths.concat(glob.sync(path.join(testPath, options.fileLegacyGlob)));
					}
				} else {
					if (options.fileRegexp.test(testPath)) {
						jasmine3TestPaths.push(testPath);
						jasmine.addSpecFile(testPath);
						require(testPath);
						setSpecProperties(jasmine.env.topSuite(), path.resolve(path.dirname(testPath)));
					} else if (options.legacySuffix && options.fileLegacyRegexp.test(testPath)) {
						legacyTestPaths.push(testPath);
					}
				}
			});
			// FIXME: Hack to prevent Jasmine v3.6.0 from loading specs again
			jasmine.loadSpecs = () => {};

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
