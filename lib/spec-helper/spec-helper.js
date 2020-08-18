/** @babel */
// converted from https://github.com/atom/atom/blob/master/spec/spec-helper.coffee

const specHelpersMap = {
	atom: "./atom",
	attachToDom: "./attach-to-dom",
	attachToDOM: "./attach-to-dom",
	customMatchers: "jasmine2-atom-matchers",
	jasmineJson: "jasmine2-json",
	jasminePass: "jasmine-pass",
	jasmineShouldFail: "jasmine-should-fail",
	jasmineTagged: "jasmine2-tagged",
	jasmineFocused: "jasmine2-focused",
	mockClock: "./clock",
	mockLocalStorage: "jasmine-local-storage",
	profile: "./profile",
	set: "./set",
	unspy: "jasmine-unspy",
	ci: "./ci"
};

export default async function (options, setupView) {
	if (options === false) {
		return;
	}
	const all = (options === true);

	try {
		for (const helper in specHelpersMap) {
			if (all || options[helper]) {
				setupView.install(specHelpersMap[helper]);
				await require(specHelpersMap[helper]);
			}
		}
	} catch (ex) {
		setupView.error(ex.toString());

		throw ex;
	}
};
