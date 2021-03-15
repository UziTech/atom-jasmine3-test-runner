// The known examples that must work

import { createRunner } from "./index";

// Test 1

createRunner({
	testPackages: [],
	timeReporter: true,
	specHelper: true,
});

// Test 2

// optional options to customize the runner
const extraOptions = {
	suffix: "-spec",
	legacySuffix: "-spec-v1",
};

const optionalConfigurationFunction = function () {
	// If provided, atom-jasmine3-test-runner will call this function before jasmine is started
	// so you can do whatever you'd like with the global variables.
	// (i.e. add custom matchers, require plugins, etc.)
	require("some-jasmine-plugin");

	beforeEach(function () {
		jasmine.addMatchers({
			toBeTheAnswerToTheUltimateQuestionOfLifeTheUniverseAndEverything: function (util, customEqualityTesters) {
				return {
					compare: function (actual: unknown) {
						let result: {pass: boolean, message?: string} = {pass: true};
						result.pass = util.equals(actual, 42, customEqualityTesters);
						const toBeOrNotToBe = result.pass
							? "not to be"
							: "to be"; // that is the question.
						result.message = `Expected ${actual} ${toBeOrNotToBe} the answer to the ultimate question of life, the universe, and everything.`;
						return result;
					}
				};
			}
		});
	});
};

createRunner(extraOptions, optionalConfigurationFunction);
