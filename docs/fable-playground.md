# Fable Playground

The Fable Playground is a live editor + sandbox that lives in a sliding
drawer at the bottom of every docuserve page.  Click the **Playground**
tab at the bottom edge of the viewport (or use the button below) to
expand it; write JavaScript that receives a fresh `fable` instance;
press **Run** and the log records emitted by your code show up in the
panel to the right - colored by level, with relative timestamps and
serialized data payloads.

<button onclick="_Pict.views['Docuserve-Layout'].expandPlayground()" style="padding: 0.6em 1.2em; font-size: 1em; font-weight: 600; background: var(--theme-color-brand-primary, #2E7D74); color: var(--theme-color-background-panel, #FFFFFF); border: 1px solid var(--theme-color-brand-primary, #2E7D74); border-radius: 4px; cursor: pointer;">▲ Open the Fable Playground drawer</button>

The drawer is **draggable** - pull the handle up to give it more room
or push it back down to almost nothing.  It stays expanded as you
navigate between doc pages, so you can keep tinkering while reading.
Collapse the drawer (click the tab at the bottom) to recover the full
viewport for reading.

## What the playground does

Every press of **Run** creates a fresh Fable instance with **no default
log streams**, then attaches a capture logger at the `trace` level -
which cascades to every higher level, so `trace`, `debug`, `info`,
`warn`, `error`, and `fatal` all flow into the log pane.  The
playground-provided `fable` global is that instance.  The capture
logger pushes each record into a per-run array, scheduling a debounced
(~60ms) re-render so that **asynchronous** log calls (`setTimeout`,
`Promise.then`, `fetch().then`, ...) surface as they arrive instead of
being silently dropped after the synchronous portion of your code
returns.

You can also instantiate your own Fable via the `require` shim:

```javascript
const Fable = require('fable');
const app = new Fable({ Product: 'DocExample' });
fable.log.info('two Fables, one capture pane', {
  appUUID: app.UUID.getUUID(),
  appProduct: app.SettingsManager.settings.Product
});
```

(Note: the example above logs via the playground-provided `fable`,
which has the capture logger attached.  A standalone `app.log.info(...)`
call would go to whatever streams `app` was constructed with - typically
the default `console` stream at `info` level, which the playground
panel doesn't see.)

Your code runs inside a `new Function('fable', 'pict', 'require', code)` -
so:

- `fable` is the fresh instance with the capture logger attached
- `pict` is the live docuserve Pict instance (handy for poking at views
  / AppData, but you can ignore it)
- `require` is a curated shim that recognizes a small set of module
  names and returns the matching class/instance off the live page.
  Anything outside the set throws a clear "module X not available"
  error.

Recognized names today: `'fable'`, `'pict'`, `'fable-uuid'`,
`'fable-settings'`, `'fable-log'`.  Add more in the playground view's
`_buildRequireShim()` as needed.

If your code throws, the error message is captured as a final `error`
record so failures are visible without opening the browser console.

## Pulling examples from the docs

Every `language-javascript` code block in the docs gets a small play
play button next to its **Copy** / **Fullscreen** action buttons.
Click it and the code is loaded into the playground drawer (which
slides up if it was collapsed), ready to **Run**.

Not every example will run as-is - some assume a Node runtime, some
reference variables from earlier in the page, some pull in modules
the `require` shim doesn't know about.  That's expected; the error
becomes a captured `error` record in the log pane and you (or the
doc's author) can adjust the snippet.  Particularly broken examples
should carry a short prose disclaimer in the docs themselves so
readers know what to expect before they press Run.

## Why a fresh Fable each Run?

Stability of output is the whole point.  Re-running the same code
produces the same record sequence - no leftover state, no log streams
that the previous run attached, no settings drift.  This is what makes
the playground viable as a documentation tool: snippets in the docs can
demonstrate behavior reliably, and you can edit them and re-Run as many
times as you want with deterministic results.

## Anatomy of a log line

Each rendered record carries four pieces:

| Column | Source |
|---|---|
| Time | `Date.now() - runStart` at the moment the record was emitted (relative to Run press) |
| Level | The Fable log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| Message | First arg to `fable.log.<level>(msg, datum)` |
| Datum | Second arg, serialized via `JSON.stringify` and shown in the property color |

For the `fatal` level, the badge inverts (white on red) instead of just
coloring the text - it's the only level loud enough to demand visual
escalation past the surrounding monospace flow.

## Persistence

Edits in the editor are debounced (500ms) and written to
`localStorage` under the key `docuserve-fable-playground-code`.  A
reload restores the most recent edit.  **Reset code** wipes both the
session AppData and the localStorage entry, so the default sample
returns on the next reload too.

The drawer's collapse state and resized height are persisted by
pict-section-modal's shell - the next page load remembers what you set.

## How it's wired up

The playground is registered as a `pict-view`
(`Docuserve-Fable-Playground`) and mounted into a bottom shell panel
that the Layout view registers at boot via
`pict-section-modal`'s `shell().addPanel({ Side: 'bottom', Mode:
'resizable', Collapsed: true, ContentDestinationId:
'Docuserve-Playground-Drawer-Content' })`.  The panel's `OnExpand`
callback lazy-mounts the playground view the first time the drawer is
opened - until then, only the labeled tab strip is rendered.

The editor pane inside the playground is itself a sub-view: a
`pict-section-code` subclass (`FablePlaygroundCodeEditor`) registered in
the playground view's constructor so that pict-application's boot-time
AutoInitialize sweep catches it alongside every other view.  CodeJar is
lazy-loaded from jsDelivr via a `new Function('u','return
import(u)')(url)` dynamic import (CodeJar 4.x is ESM-only and would
otherwise trip the browserify bundle) and wired into the editor sub-view
on first mount.

The playground exposes three public methods worth knowing:

- `mountIntoDrawer()` - mounts into the layout's bottom panel; called
  by the shell's `OnExpand` callback
- `mountInto(containerElement)` - same template / editor flow, but
  mounts into any DOM element (useful for set-piece doc pages that
  want an inline playground)
- `loadCode(code)` - replaces the editor content and slides the drawer
  open.  This is the handoff path for "Try in playground" buttons that
  ship code from a doc page's fenced code example straight into the
  drawer
