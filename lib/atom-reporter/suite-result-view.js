/** @babel */
/** @jsx etch.dom */

import etch from "etch";

/* eslint-disable no-unused-vars */
import ResultsView from "./results-view";
import DeprecationView from "./deprecation-view";
import ExpectationView from "./expectation-view";
/* eslint-enable no-unused-vars */

const defaultProps = {
	suite: {},
	folded: false,
};

export default class SuiteResultView {
	constructor(props) {
		this.props = Object.assign({}, defaultProps, props);

		etch.initialize(this);
	}

	update(props) {
		this.props = Object.assign({}, this.props, props);

		return etch.update(this);
	}

	onToggle() {
		this.update({
			folded: !this.props.folded
		});
	}

	destroy() {
		return etch.destroy(this);
	}

	render() {
		const shouldFail = this.props.suite.shouldFail && this.props.suite.failedExpectations.length === 0;

		let expectations = [];
		if (!shouldFail) {
			expectations = this.props.suite.failedExpectations;
		} else if (this.props.suite.shouldFail) {
			expectations = this.props.suite.passedExpectations;
		}

		const hasFailures = expectations.length > 0 || this.props.suite.deprecationWarnings > 0;

		let { description } = this.props.suite;
		if (description === "Jasmine__TopLevel__Suite") {
			description = "";
		}
		return (
			<div id={`suite-view-${this.props.suite.id}`} className={`suite ${shouldFail ? "should-fail" : ""}`}>
				<div className="suite-exceptions">
					{ hasFailures
						? <div className={`j3-suite-toggle ${this.props.folded ? "icon-unfold" : "icon-fold"}`} on={{ click: this.onToggle }}></div>
						: ""
					}
					<div class="description">{description}</div>
					<div className={`suite-failures ${this.props.folded ? "hidden" : ""}`}>
						{this.props.suite.deprecationWarnings.map(deprecation =>
							<DeprecationView deprecation={deprecation} />
						)}
						{expectations.map(expectation =>
							<ExpectationView expectation={expectation} specDirectory={this.props.suite.specDirectory} />
						)}
					</div>
				</div>
				<ResultsView results={this.props.suite.children} />
			</div>
		);
	}
}
