/** @babel */
// converted from https://github.com/atom/atom/blob/master/spec/atom-reporter.coffee

/* eslint-disable no-unused-vars */
import SpecResultView from "./spec-result-view";
import TabsView from "./tabs-view";
import J3ReporterView from "./j3-reporter-view";
/* eslint-enable no-unused-vars */

export default class AtomReporter {

	constructor(options) {
		this.specs = {};
		this.j1TestsAvailable = options.legacyTestsAvailable;
		this.j3TestsAvailable = false;
		this.topSuite = jasmine.getEnv().topSuite();

		this.tabs = new TabsView({
			minimizeHidden: !options.showEditor,
			j1TestsHidden: !this.j1TestsAvailable,
			j3TestsHidden: !this.j3TestsAvailable,
		});

		this.j3Reporter = new J3ReporterView({
			title: options.title,
			topSuite: this.topSuite,
		});

		this.buildComponent(options.title);
	}

	buildComponent(title) {
		// Allow document.title to be assigned in specs without screwing up spec window title
		let documentTitle = document.title;
		document.title = title;
		Object.defineProperty(document, "title", {
			get() {
				return documentTitle;
			},
			set(newTitle) {
				documentTitle = newTitle;
			},
			configurable: true
		});

		// Allow ctrl-c to copy selected text
		document.addEventListener("keydown", function (e) {
			if (e.ctrlKey = true && e.code === "KeyC") {
				console.log(e);
				const selection = getSelection().toString();
				if (selection.length > 0) {
					atom.clipboard.write(selection);
				}
			}
		}, { passive: true, capture: true });

		document.querySelector("html").style.overflow = "auto";
		document.body.style.overflow = "auto";

		const jasmineStyle = document.createElement("style");
		jasmineStyle.textContent = atom.themes.loadStylesheet(atom.themes.resolveStylesheet(require.resolve("./css/jasmine.less")));
		document.head.appendChild(jasmineStyle);

		document.body.appendChild(this.tabs.element);
		document.body.appendChild(this.j3Reporter.element);
	}

	specSuites(spec) {
		const suites = [];

		let { suite } = spec;
		while (suite.parentSuite) {
			suites.unshift({
				id: suite.id,
				description: suite.description,
			});
			suite = suite.parentSuite;
		}

		return suites;
	}

	specTitle(spec) {
		const parentDescriptions = [];
		let { suite } = spec;
		while (suite.parentSuite) {
			parentDescriptions.unshift(suite.description);
			suite = suite.parentSuite;
		}

		let suiteString = "";
		let indent = "";
		for (const description of parentDescriptions) {
			suiteString += `${indent + description}\n`;
			indent += "  ";
		}

		return `${suiteString}${indent}it ${spec.description}`;
	}

	getSpecs(suite, specs = {}) {
		for (const child of suite.children) {
			if (child.children) {
				// eslint-disable-next-line no-param-reassign
				specs = this.getSpecs(child, specs);
			} else {
				child.suites = this.specSuites(child);
				child.title = this.specTitle(child);
				specs[child.id] = child;
			}
		}
		return specs;
	}

	jasmineStarted(suiteInfo) {
		this.j3TestsAvailable = suiteInfo.totalSpecsDefined > 0;
		if (this.j3TestsAvailable) {
			this.specs = this.getSpecs(this.topSuite);

			this.j3Reporter.update({
				specs: this.specs,
				startedAt: Date.now()
			});
			this.tabs.update({
				active: "j3-tab",
				j3TestsHidden: false,
			});
		}
	}

	jasmineDone() {
		if (this.j3TestsAvailable) {
			this.j3Reporter.update({
				endedAt: Date.now(),
				currentSpec: null,
			});
		}
		if (this.j1TestsAvailable) {
			this.tabs.update({
				active: "j1-tab",
				j1TestsAvailable: true,
			});
		}
	}

	suiteStarted() {}

	suiteDone() {}

	specStarted(spec) {
		this.specs[spec.id].startedAt = Date.now();
		this.j3Reporter.update({
			specs: this.specs,
			currentSpec: this.specs[spec.id],
		});
	}

	specDone(spec) {
		this.specs[spec.id].endedAt = Date.now();
		this.j3Reporter.update({
			specs: this.specs,
		});
	}
}
