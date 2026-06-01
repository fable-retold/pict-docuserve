# How to upgrade module docs so every code block runs in the playground

Working notes from upgrading fable-uuid.  Use this as a checklist + cookbook
when bringing fable-log, fable-settings, fable-serviceproviderbase, fable,
meadow, etc. through the same exercise.

## Goal

Every code block tagged ```` ```javascript ```` (and ```` ```js ````) in a
module's docs gets a "play Try in Playground" button.  Clicking that button
loads the snippet into the editor and runs it.  After this upgrade, **none
of those clicks should throw** in the playground.  JSON blocks should be
valid JSON.

## Setup: stand up a per-module dev server

Add an entry to `.claude/launch.json`:

```json
{
    "name": "<module-name>-via-docuserve",
    "runtimeExecutable": "node",
    "runtimeArgs": [
        "/Users/steven/Code/retold/modules/pict/pict-docuserve/source/cli/Docuserve-CLI-Run.js",
        "serve",
        "/Users/steven/Code/retold/modules/<group>/<module>/docs",
        "-p",
        "<unused-port>"
    ],
    "port": <unused-port>
}
```

Then:

1. Copy a fresh `pict-docuserve.min.js` into the module's `docs/` folder:
   `cp /Users/steven/Code/retold/modules/pict/pict-docuserve/dist/pict-docuserve.min.js <module>/docs/`
2. Edit the module's `docs/index.html` and swap the jsdelivr `<script src="https://cdn.jsdelivr.net/npm/pict-docuserve@0/...">`
   for `<script src="./pict-docuserve.min.js">` so the dev server uses the
   local build instead of the published one.
3. Drop an opt-in `_playground.json` next to `_sidebar.md` listing the
   `require()` names the playground should expose for this module.  Bare
   minimum for a fable family module:
   ```json
   {
       "Imports":
       [
           { "Name": "fable",       "Source": "bundled" },
           { "Name": "<module>",    "Source": "bundled" }
       ]
   }
   ```
4. Add a `- [Code Playground](playground.md)` entry to `_sidebar.md` and
   write a short `docs/playground.md` (use the fable-uuid one as a template).

Then `preview_start("<module-name>-via-docuserve")` and navigate to each
doc page in turn.

## The playground execution contract

User code is wrapped in:

```javascript
(async () => {
    // user code here
})()
```

...and invoked with four parameters:

| Name | What it is |
|---|---|
| `fable`   | A fresh `Fable` instance preconfigured with the capture logger. |
| `pict`    | The live docuserve Pict instance. |
| `require` | A curated shim - only names listed in the current module's `_playground.json` (or fable's bundled fallback) resolve.  Anything else throws a friendly error. |
| `console` | A per-run shim that pipes `console.log/info/warn/error/debug/trace` calls into the log panel AND forwards to the real browser dev-console. |

Anything the snippet pushes into `fable.log.*` after the synchronous run
ends still gets captured (the capture logger holds a closure over the
records array).  The finish banner is deferred until the records array
sits quiet for 200ms (capped at 10s) - so `setTimeout`/Promise/fetch
chains have time to land before the banner emits.

## Gotcha checklist

Walk every ```` ```javascript ```` and ```` ```js ```` block in the
module's docs and check each item:

### 1. JSON-like blocks that aren't valid JS

A bare object literal at the top of a script is parsed as a **block**,
not an object - the property names become labels.  `UUIDLength: 8,` is a
labeled statement followed by an invalid trailing comma -> syntax error.

**Wrong:**

````markdown
```javascript
{
    UUIDModeRandom: false,
    UUIDLength: 8,
    UUIDDictionary: "..."
}
```
````

**Right (if it's meant as JSON):**

````markdown
```json
{
    "UUIDModeRandom": false,
    "UUIDLength": 8,
    "UUIDDictionary": "..."
}
```
````

JSON blocks don't get the play button - they're display-only - so quote
the keys and you're done.

**Right (if it's meant as a JS value):**

````markdown
```javascript
const config = {
    UUIDModeRandom: false,
    UUIDLength: 8,
    UUIDDictionary: "..."
};
console.log(config);
```
````

### 2. Missing `require()`

The first block on a docs page typically declares `const libXxx = require('xxx');`.
Subsequent blocks reuse `libXxx` from "implicit context" the reader is
expected to remember.  The playground has no implicit context - each
block runs in its own fresh async IIFE.

**Fix:** every block that references a `lib*` identifier needs its own
`require()` line at the top.

```javascript
// At the top of EVERY js block that uses the lib:
const libFableUUID = require('fable-uuid');

const u = new libFableUUID();
console.log(u.getUUID());
```

### 3. `const` redeclaration

Snippets that wanted to show "with config" and "without config" side by
side often do:

```javascript
const uuid = new libFableUUID();             // standard
const uuid = new libFableUUID({ ... });      // with config - RE-DECLARE!
```

Two `const`s with the same name in the same scope -> `SyntaxError: Identifier 'uuid' has already been declared`.

**Fix:** rename the second one (`uuidRandom`, `uuidWithConfig`, ...) and add
`console.log` calls so the user sees both outputs in the panel.

### 4. Undeclared variables

Snippets that show "...and then format the buffer:" jump in mid-flow,
referencing variables (`buffer`, `bytes`) the docs reader was expected
to have in scope.  In the playground those throw `ReferenceError`.

**Fix:** declare the variable at the top of the snippet.  If the snippet
is "fill the buffer with values", a zeros-filled `new Uint8Array(16)` is
a fine stand-in - the output is just `00000000-0000-...` which is
actually informative.

### 5. Node-only APIs

`require('crypto')`, `require('fs')`, `require('path')`, etc.  The
playground's `require` shim doesn't expose these, so the call throws
with the friendly "not available in this playground" error.

**Pattern:** wrap as a `console.info` reference snippet instead of a
runnable one.  Keeps the doc value of showing the Node-side code without
crashing the playground:

```javascript
// Node.js reference - won't run in the browser playground.
console.info("In Node.js: const crypto = require('crypto'); crypto.randomBytes(16);");
```

### 6. Browser-only APIs that aren't universal

`window.msCrypto`, deprecated globals, vendor prefixes.  Modern browsers
won't have them, so naked access throws or returns undefined.

**Pattern:** feature-check with `typeof X !== 'undefined'` and print a
friendly note in the else branch:

```javascript
const buffer = new Uint8Array(16);
if (typeof window !== 'undefined' && window.msCrypto)
{
    window.msCrypto.getRandomValues(buffer);
    console.log('Filled via msCrypto:', Array.from(buffer));
}
else
{
    console.info('window.msCrypto is not present in this browser (only IE11 had it).');
}
```

### 7. `module.exports` / commonjs config blobs

Webpack configs, jest configs, etc. use `module.exports = {...}`.  In
the playground the `(async () => {...})()` wrapper means `module` isn't
defined - throws `ReferenceError`.

**Pattern:** assign to a local const and `console.info` it:

```javascript
// webpack.config.js - build-time config, shown as reference text.
const webpackConfig = {
    entry: './app.js',
    output: { filename: 'bundle.js' }
};
console.info('Webpack config:', webpackConfig);
```

### 8. Test-framework / style examples

Mocha's `suite`/`test`, Chai's `expect`/`Expect`, or stylistic prose
snippets that reference made-up helpers (`doSomething()`, `transform()`,
`myFeature`).  All throw `ReferenceError` in the playground.

**Pattern:** stub the helpers at the top of the snippet so the
demonstration runs and prints something useful.  Mocha + Chai shim
example:

```javascript
const suite  = (pName, pBody) => { console.log('suite:', pName); pBody(); };
const test   = (pName, pBody) => { console.log('  test:', pName); pBody(); };
const Expect = (pActual) => ({ to: { equal: (pExpected) =>
    console.log('    expect', pActual, '===', pExpected, '->', pActual === pExpected ? 'PASS' : 'FAIL')
}});
const myFeature = { process: (pInput) => ({ success: pInput.value === 42 }) };

// ...then the snippet you actually want to demonstrate.
```

### 9. `// =>` comment-only outputs

Lots of docs use `// => "f47ac10b-..."` to show what a previous expression
returns.  The playground doesn't evaluate comments, so the user sees no
visible result unless you also explicitly print.

**Fix:** add a `console.log(...)` call right before the comment, so the
playground panel actually shows the value:

```javascript
const id = uuid.getUUID();
console.log(id);                                       // <- added
// => "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

### 10. Async work without a sentinel

Snippets with `setTimeout` / `setInterval` / `fetch` may finish their
sync portion in 3ms but keep emitting records for seconds afterwards.
The settle-window watcher handles this automatically - don't bolt on
your own timer.  Just write the natural async code; the finish banner
will appear once the records array goes quiet.

If a snippet REALLY needs to wait, use `await new Promise(r => setTimeout(r, n))`
and the IIFE will sit on the await.

## Verification recipe

For each module, after editing:

1. `cp /Users/steven/Code/retold/modules/pict/pict-docuserve/dist/pict-docuserve.min.js <module>/docs/`
   (refresh the local bundle whenever you rebuild pict-docuserve)
2. Hard-reload the dev server's tab in the preview.
3. Install a helper in the preview console:
   ```javascript
   window._runSnippet = (label, code) => new Promise(resolve => {
       _Pict.views['Docuserve-Fable-Playground'].loadCode(code);
       setTimeout(() => {
           _Pict.views['Docuserve-Fable-Playground'].run();
           setTimeout(() => {
               const recs = _Pict.views['Docuserve-Fable-Playground']._currentRunRecords || [];
               resolve({
                   label,
                   ok: recs.filter(r => r.level === 'error').length === 0,
                   recordCount: recs.length,
                   errors: recs.filter(r => r.level === 'error').map(e => e.message)
               });
           }, 1500);
       }, 100);
   });
   _Pict.views['Docuserve-Layout'].expandPlayground();
   ```
4. Run each block's exact source through `_runSnippet('file:line label', `...`)`.
   Failures appear as `ok: false` with the error message.
5. Iterate on the doc source until every block returns `ok: true`.

## When to ship

A module passes when:

- Every ```` ```javascript ```` and ```` ```js ```` block in the docs
  runs to completion in the playground with zero `error`-level records.
- Every ```` ```json ```` block parses as valid JSON.
- The docs still read naturally in plain Markdown - adding `console.log`
  or stubbed helpers shouldn't make the prose worse.  If a snippet got
  weirder, prefer wrapping it in the `// Reference - won't run` pattern
  over contorting it to fit the playground.
