/** @babel */
// converted from https://github.com/atom/atom/blob/master/spec/atom-reporter.coffee

import SpecResultView from "./spec-result-view";
import TabsView from "./tabs-view";
import J3ReporterView from "./j3-reporter-view";

export default class AtomReporter {

	constructor(options) {
		this.specs = {};
		this.j1TestsAvailable = options.legacyTestsAvailable;
		this.j3TestsAvailable = false;

		this.tabs = new TabsView({
			minimizeHidden: !options.showEditor,
			j1TestsHidden: !this.j1TestsAvailable,
			j3TestsHidden: !this.j3TestsAvailable,
		});

		this.j3Reporter = new J3ReporterView({
			title: options.title,
		});

		this.buildComponent(options.title);
	}

	buildComponent(title) {
		// Allow document.title to be assigned in specs without screwing up spec window title
		let documentTitle = document.title;
		document.title = title;
		Object.defineProperty(document, "title", {
			get() { return documentTitle; },
			set(title) { documentTitle = title; },
			configurable: true
		});

		document.querySelector("html").style.overflow = "auto";
		document.body.style.overflow = "auto";

		const jasmineStyle = document.createElement("style");
		jasmineStyle.textContent = atom.themes.loadStylesheet(atom.themes.resolveStylesheet(require.resolve("./css/jasmine.less")));
		document.head.appendChild(jasmineStyle);

		document.body.appendChild(this.tabs.element);
		document.body.appendChild(this.j3Reporter.element);
	}

	specSuites(spec) {
		let suites = [];

		let suite = spec.suite;
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
		let parentDescriptions = [];
		let suite = spec.suite;
		while (suite.parentSuite) {
			parentDescriptions.unshift(suite.description);
			suite = suite.parentSuite;
		}

		let suiteString = "";
		let indent = "";
		for (let description of parentDescriptions) {
			suiteString += indent + description + "\n";
			indent += "  ";
		}

		return `${suiteString}${indent}it ${spec.description}`;
	}

	getSpecs(suite, specs = {}) {
		// TODO: deal with spec order if random?
		for (let child of suite.children) {
			if (child instanceof jasmine.Spec) {
				child.suites = this.specSuites(child);
				child.title = this.specTitle(child);
				specs[child.id] = child;
			} else {
				specs = this.getSpecs(child, specs);
			}
		}
		return specs;
	}

	jasmineStarted(suiteInfo) {
		this.j3TestsAvailable = suiteInfo.totalSpecsDefined > 0;
		if (this.j3TestsAvailable) {
			this.specs = this.getSpecs(jasmine.getEnv().topSuite());

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

	jasmineDone(suiteInfo) {
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

	suiteStarted(suite) {}

	suiteDone(suite) {}

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
