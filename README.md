# Atom Jasmine 2.x Test Runner

By default, Atom runs your tests with Jasmine 1.3 (for more information on testing packages in Atom, please [see the Atom Flight Manual](http://flight-manual.atom.io/hacking-atom/sections/writing-specs/#running-specs)). Atom allows you to specify a custom test runner using the `atomTestRunner` field in your `package.json`, but implementing a custom test runner is not straightforward. This module allows you to run your specs using Jasmine 2.x with minimal fuss.

## Installation

```
$ apm install [--save-dev] atom-jasmine2-test-runner
```

## Usage

### Default Test Runner

If you want to use all the default options, simply pass the module name as the `atomTestRunner` value in your `package.json`:

```javascript
{
  "name": "my-package",
  // ...
  "atomTestRunner": "atom-jasmine2-test-runner"
}
```

Note that your `package.json` may be cached by Atom's compile cache when running tests with Atom's GUI test runner, so if adding or changing that field doesn't seem to work, try quitting and restarting Atom.

### Programmatic Usage

If you'd like to perform more customization of your testing environment, you can create a custom runner while still utilizing atom-jasmine2-test-runner for most of the heavy lifting. First, set `atomTestRunner` to a *relative* path to a file:

```javascript
{
  "name": "my-package",
  // ...
  "atomTestRunner": "./spec/custom-runner"
}
```

Then export a test runner created via the atom-jasmine2-test-runner from `test/custom-runner.js`:

```javascript
var createRunner = require('atom-jasmine2-test-runner').createRunner

// optional options to customize the runner
var extraOptions = {
  glob: "**/*-spec.js"
}

var optionalConfigurationFunction = function (jasmine) {
  // If provided, atom-jasmine2-test-runner will pass the jasmine instance
  // to this function, so you can do whatever you'd like to it.
}

module.exports = createRunner(extraOptions, optionalConfigurationFunction)
```

#### API

**`createRunner([options,] [callback])`**

Returns a test runner created with the given `options` and `callback`. Both parameters are optional. The returned value can be exported from your `atomTestRunner` script for Atom to consume.

*   `options` - An object specifying customized options:

    *   `reporter [default: the default reporter]` - Which reporter to use on the terminal
    *   `globalAtom [default: true]` - Whether or not to assign the created Atom environment to `global.atom`
    *   `glob [default: "**/*-spec.js"]` - File extensions that indicate that the file contains tests
    *   `colors [default: true]` - Whether or not to colorize output on the terminal
    *   `htmlTitle [default: '']` - The string to use for the window title in the HTML reporter

### Writing Tests

[Jasmine 2.5 documentation](https://jasmine.github.io/2.5/introduction)

```javascript
describe('Testing', function () {
  it('works', function () {
    expect(answerToLifeUniverseAndEverything).toBe(42);
  });
});
```
