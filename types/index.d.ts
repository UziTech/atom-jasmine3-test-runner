import type { TestRunner } from "atom"
//@ts-ignore
import type { Reporter } from "jasmine"


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
