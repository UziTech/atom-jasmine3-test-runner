import type { TestRunner } from "atom"
//@ts-ignore
import type { Reporter } from "jasmine"

export interface SpecHelpers {
	/**
	 * This will spy on `atom.menu.sendToBrowserProcess` and add default config options:
	 *
	 * ```js
	 * atom.config.set("core.destroyEmptyPanes", false)
	 * atom.config.set("editor.fontFamily", "Courier")
	 * atom.config.set("editor.fontSize", 16)
	 * atom.config.set("editor.autoIndent", false)
	 * ```
	 *
	 * @default `true`
	 */
	atom?: boolean

	/**
	 * This will add the function `jasmine.attachToDOM(element)` to allow you to easily attach elements to the DOM and it
	 * takes care of removing the elements after every test so you don't need to worry about them messing with your other
	 * tests. If you want an element to be attached to the DOM for multiple tests you can call `jasmine.attachToDOM` in a
	 * `beforeEach` function.
	 *
	 * @default `true`
	 */
	attachToDom?: boolean

	/**
	 * This will throw an error if any focused tests are left when testing in a CI environment.
	 *
	 * This will also set `jasmine.DEFAULT_TIMEOUT_INTERVAL` to 1 minute in a CI environment.
	 *
	 * :rotating_light: This won't do anything unless `process.env.CI` is set :rotating_light:
	 *
	 * @default `true`
	 */
	ci?: boolean

	/**
	 * Uses [jasmine2-atom-matchers](https://github.com/UziTech/jasmine2-atom-matchers)
	 *
	 * This will add the [custom
	 * matchers](http://flight-manual.atom.io/hacking-atom/sections/writing-specs/#custom-matchers) from Atom:
	 *
	 * - The `toBeInstanceOf` matcher is for the `instanceof` operator
	 * - The `toHaveLength` matcher compares against the `.length` property
	 * - The `toExistOnDisk` matcher checks if the file exists in the filesystem
	 * - The `toHaveFocus` matcher checks if the element currently has focus
	 * - The `toShow` matcher tests if the element is visible in the dom
	 *
	 * This will also include the Atom custom version of
	 * [jasmine-jquery](https://github.com/atom/atom/blob/master/vendor/jasmine-jquery.js)
	 *
	 * @default `true`
	 */
	customMatchers?: boolean

	/**
	 * Uses [jasmine2-focused](https://github.com/UziTech/jasmine2-focused)
	 *
	 * This will include [jasmine-focused](https://github.com/atom/jasmine-focused#readme) (modified for Jasmine 3.x)
	 *
	 * This includes the functions `ffdescribe`, `fffdescribe`, `ffit`, and `fffit`.
	 *
	 * @default `true`
	 */
	jasmineFocused?: boolean

	/**
	 * Uses [jasmine2-json](https://github.com/UziTech/jasmine2-json)
	 *
	 * This will include [jasmine-json](https://github.com/atom/jasmine-json#readme) (modified for Jasmine 3.x)
	 *
	 * This includes the matcher `.toEqualJson(object)` and will give a detailed message on failure.
	 *
	 * @default `true`
	 */
	jasmineJson?: boolean

	/**
	 * Uses [jasmine-pass](https://github.com/UziTech/jasmine-pass)
	 *
	 * This will include a `pass()` function similar to Jasmine's `fail()` but opposite.
	 *
	 * @default `true`
	 */
	jasminePass?: boolean

	/**
	 * Uses [jasmine-should-fail](https://github.com/UziTech/jasmine-should-fail)
	 *
	 * This will include the functions `zdescribe` and `zit` to allow you to tell jasmine that these tests should fail.
	 *
	 * If these tests pass they will fail and if they fail they will pass but still output their messages as if they failed.
	 *
	 * (really only useful for testing a reporter)
	 *
	 * @default `true`
	 */
	jasmineShouldFail?: boolean

	/**
	 * Uses [jasmine2-tagged](https://github.com/UziTech/jasmine2-tagged)
	 *
	 * This will include [jasmine-tagged](https://github.com/atom/jasmine-tagged#readme) (modified for Jasmine 3.x)
	 *
	 * This includes the functions `jasmine.setIncludedTags([tags])` and `jasmine.includeSpecsWithoutTags(bool)` to allow
	 * you to filter tests easily.
	 *
	 * @default `true`
	 */
	jasmineTagged?: boolean

	/**
	 * This will mock the `setTimeout` and `setInterval` functions, as well as a few others, so you can test a process
	 * that happens on a timer with the `advanceClock` function.
	 *
	 * When this is enabled you will need to call `jasmine.useRealClock()` if you want to use `setTimeout` or
	 * `setInterval` like usual.
	 *
	 * This is similar to calling [jasmine.clock().install()](https://jasmine.github.io/2.9/introduction#section-Jasmine_Clock)
	 *
	 * @default `true`
	 */
	mockClock?: boolean

	/**
	 * Uses [jasmine-local-storage](https://github.com/UziTech/jasmine-local-storage)
	 *
	 * This includes the functions `mockLocalStorage()` and `unmockLocalStorage()` to allow you to mock localStorage.
	 *
	 * You will have to call the `mockLocalStorage()` function in-order to start mocking localStorage.
	 *
	 * @default `true`
	 */
	mockLocalStorage?: boolean

	/**
	 * This will include the functions `measure(description, function)` and `profile(description, function)` which will
	 * write the time the function takes to `console.log`
	 *
	 * @default `true`
	 */
	profile?: boolean

	/**
	 * This will include the methods `.jasmineToString()` and `.isEqual(Set)` to the `Set` prototype.
	 *
	 * @default `true`
	 */
	set?: boolean

	/**
	 * Uses [jasmine-unspy](https://github.com/UziTech/jasmine-unspy)
	 *
	 * This will include the function `jasmine.unspy(object, method)` to allow you to restore the original function to a spy
	 *
	 * @default `true`
	 */
	unspy?: boolean
}

export interface RunnerOptions {

	/**
	 * Array of packages to include for testing. This will usually be the same packages listed in
	 * [`APM_TEST_PACKAGES`](https://github.com/atom/ci#how-do-i-install-other-atom-packages-that-my-package-build-depends-on)
	 * if using atom/ci for continuous integration
	 *
	 * @default `[]`
	 */
	testPackages?: Array<string>

	/**
	 * The `specHelper` option can be set to `true` to enable the spec-helper or you can specify an object enabling only
	 * the parts of the spec-helper that you want.
	 *
	 * @default `false` {@link [Spec Helpers](#spec-helpers)}
	 */
	specHelper?: boolean | SpecHelpers

	/**
	 * Add a reporter that logs the time for each spec/suite.
	 *
	 * @default `false` {@link [TimeReporter](https://github.com/atom/atom/blob/master/spec/time-reporter.coffee)}
	 */
	timeReporter: boolean

	/**
	 * File extension that indicates that the file contains tests
	 *
	 * @default `"-spec"`
	 */
	suffix?: string

	/**
	 * File extension that indicates that the file contains Jasmine v1.x tests
	 *
	 * @default `"-spec-v1"`
	 */
	legacySuffix?: string

	/**
	 * Which reporter to use on the terminal
	 *
	 * @default `the Default reporter`
	 */
	reporter?: Reporter


	/**
	 * Colorize output on the terminal.
	 *
	 * @default `true`
	 */
	showColors?: boolean

	/**
	 * The string to use for the window title in the HTML reporter
	 *
	 * @default `The Name of the package`
	 */
	htmlTitle?: string

	/**
	 * Add a "Show Editor" tab to minimize the specs so you can see the editor behind it
	 *
	 * @default `false`
	 */
	showEditor?: boolean

	/**
	 * This can be an array of files to test or folders to search for files ending with the `suffix`. This does not apply
	 * to headless testing using `atom --test ./spec`
	 *
	 * @default `'./spec' Or './test'`
	 */
	testPaths?: Array<string>

	/**
	 * Run your tests in semi-random order
	 *
	 * @default `false`
	 */
	random?: boolean

	/**
	 * Sets the randomization seed if randomization is turned on
	 *
	 * @default `Math.random()`
	 */
	seed?: number

	/**
	 * Suppresses the spec helper installation messages
	 *
	 * @default `false`
	 */
	silentInstallation?: boolean
}

/**
 * Returns a Jasmine3 test runner. The returned value can be exported from your `atomTestRunner` script for Atom to
 * consume. Both parameters are optional.
 *
 * @param options An object specifying customized options
 * @param optionalConfigurationFunction If provided, atom-jasmine3-test-runner will call this function before jasmine is
 *   started so you can do whatever you'd like with the global variables. (i.e. add custom matchers, require plugins, etc.)
 * @returns Returns a test runner created with the given `options` and `callback`.
 */
export function createRunner(options?: RunnerOptions, optionalConfigurationFunction?: Function): TestRunner
