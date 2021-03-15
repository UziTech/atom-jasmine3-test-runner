import type { TestRunner } from "atom"
//@ts-ignore
import type { Reporter } from "jasmine"

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
