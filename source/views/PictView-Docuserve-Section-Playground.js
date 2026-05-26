const libPictView = require('pict-view');
const libPictSectionCode = require('pict-section-code');

// CodeJar (used by pict-section-code) ships as an ES module.  Browserify
// can't `require()` it, so we lazy-load from jsDelivr via dynamic import
// the same way Pict-Docuserve's Fable playground does, then hand the
// constructor to each editor via connectCodeJarPrototype().
const _CodeJarCDN = 'https://cdn.jsdelivr.net/npm/codejar@4.2.0/dist/codejar.min.js';

/**
 * Docuserve-Section-Playground — a multi-editor + iframe sandbox for
 * trying section configurations (manifests, app configs, AppData, ...)
 * against any pict-section-* UI library and seeing the result live.
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ [Manifest] [Pict] [App] [AppData]   [▶ Run]  [⤴ Reset]          │  toolbar
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │                                                                 │
 *   │   pict-section-code editor for the active tab                   │
 *   │   (one per tab; the others are display:none'd, not torn down)   │
 *   │                                                                 │
 *   ├══════════════════ resize handle ════════════════════════════════│
 *   │                                                                 │
 *   │   <iframe srcdoc=...>                                           │
 *   │     loads pict + the section's UMD + a theme picker,            │
 *   │     bootstraps an application from the user's edited configs,   │
 *   │     renders the section.  Theme switching is fully scoped to    │
 *   │     the iframe.                                                 │
 *   │                                                                 │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * The playground is configured per-module via `docs/_playground.json`
 * with `Kind: "section"`.  Each entry in the `Editors` array declares
 * one tab (Hash, Label, Language, optional DefaultPath pointing at a
 * starter JSON file under docs/playground/).
 *
 * On Run, the view:
 *   1. Pulls the latest text from each editor's CodeDataAddress.
 *   2. Validates JSON / JS as appropriate (errors surface in a toast
 *      and the Run is short-circuited so the iframe doesn't blank out
 *      on a typo).
 *   3. Builds the iframe srcdoc from the configured BootstrapTemplate
 *      with the verbatim configs inlined as JSON literals.
 *   4. Replaces the iframe's srcdoc.  Each Run is a clean slate —
 *      no in-place state to invalidate.
 *
 * Edits are persisted to localStorage scoped to `<group>/<module>` so
 * the user's session survives reloads and route navigations.
 */

// AppData root for the playground state.  Per-module: each module's
// playground reuses the same address (the view re-mounts on every
// navigation, so there's only one live instance at a time).
const _AppDataRoot         = 'AppData.Docuserve.SectionPlayground';
const _ContentDestinationId = 'Docuserve-Section-Playground-Container';

// Persistence key prefix — final key is
// `docuserve-section-playground:<group>/<module>:<editorHash>`.
const _LocalStorageKeyPrefix = 'docuserve-section-playground';

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Section-Playground",

	DefaultRenderable: "Docuserve-Section-Playground-Content",
	DefaultDestinationAddress: '#Docuserve-Content-Container',

	AutoRender: false,

	CSS: /*css*/`
		/* The content container is provisioned by the layout shell as
		   flex: 1 1 auto with min-height: 0.  Promote it to a flex
		   column so the playground inside can use flex: 1 to fill. */
		#Docuserve-Content-Container.docuserve-section-playground-host {
			display: flex;
			flex-direction: column;
			padding: 0;
		}
		.docuserve-section-playground {
			flex: 1 1 0;
			min-height: 0;
			display: flex;
			flex-direction: column;
			color: var(--theme-color-text-primary, #2A241E);
			background: var(--theme-color-background-primary, #FDFBF7);
		}

		/* Toolbar — tabs on the left, action buttons on the right. */
		.docuserve-section-playground-toolbar {
			flex: 0 0 auto;
			display: flex;
			align-items: stretch;
			justify-content: space-between;
			gap: 0.5em;
			padding: 0 0.5em;
			background: var(--theme-color-background-panel, #FFFFFF);
			border-bottom: 1px solid var(--theme-color-border-default, #DDD6CA);
		}
		.docuserve-section-playground-tabs {
			display: flex;
			gap: 0;
		}
		.docuserve-section-playground-tab {
			padding: 0.55em 0.95em;
			font-size: 0.85em;
			color: var(--theme-color-text-muted, #8A7F72);
			background: transparent;
			border: 0;
			border-bottom: 2px solid transparent;
			cursor: pointer;
			transition: color 0.12s, border-color 0.12s, background-color 0.12s;
		}
		.docuserve-section-playground-tab:hover {
			color: var(--theme-color-text-primary, #2A241E);
			background: var(--theme-color-background-hover, #EAE3D8);
		}
		.docuserve-section-playground-tab.active {
			color: var(--theme-color-brand-primary, #2E7D74);
			border-bottom-color: var(--theme-color-brand-primary, #2E7D74);
			font-weight: 600;
		}
		.docuserve-section-playground-tab-dirty::after {
			content: '*';
			margin-left: 0.25em;
			color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-section-playground-actions {
			display: flex;
			align-items: center;
			gap: 0.25em;
			padding: 0.25em 0;
		}

		/* Icon button — same visual language as the Fable playground for
		   continuity.  Run is brighter to draw the eye. */
		.docuserve-section-playground-iconbtn {
			display: inline-flex;
			align-items: center;
			gap: 0.35em;
			padding: 0.35em 0.7em;
			font-size: 0.82em;
			color: var(--theme-color-text-muted, #8A7F72);
			background: transparent;
			border: 1px solid transparent;
			border-radius: 4px;
			cursor: pointer;
			transition: color 0.12s, background-color 0.12s, border-color 0.12s, opacity 0.12s;
			opacity: 0.75;
		}
		.docuserve-section-playground-iconbtn:hover {
			opacity: 1;
			color: var(--theme-color-brand-primary, #2E7D74);
			background: var(--theme-color-background-hover, #EAE3D8);
			border-color: var(--theme-color-border-default, #DDD6CA);
		}
		.docuserve-section-playground-iconbtn svg {
			width: 1em;
			height: 1em;
			display: block;
		}
		.docuserve-section-playground-iconbtn-run {
			color: var(--theme-color-brand-primary, #2E7D74);
			opacity: 0.9;
		}
		.docuserve-section-playground-iconbtn-run:hover {
			background: var(--theme-color-brand-primary, #2E7D74);
			color: var(--theme-color-background-panel, #FFFFFF);
			border-color: var(--theme-color-brand-primary, #2E7D74);
			opacity: 1;
		}
		.docuserve-section-playground-iconbtn-run svg { fill: currentColor; stroke: none; }

		/* Body — pict-section-modal shell with the editor stack in the
		   center and the iframe sandbox as a resizable + collapsible
		   bottom panel.  Layout, drag-to-resize, collapse-tab, and
		   persistence are all owned by the shell; this view just hosts
		   it inside the playground's content area. */
		.docuserve-section-playground-shell-mount {
			flex: 1 1 0;
			min-height: 0;
			position: relative;
		}
		.docuserve-section-playground-shell-mount .pict-modal-shell-host { height: 100%; }

		/* Editor stack (the shell's center).  The tab-slot divs are
		   stacked; only the active one is display:flex.  pict-section-code
		   itself draws the editor surface. */
		.docuserve-section-playground-editor-mount {
			height: 100%;
			min-height: 0;
			display: flex;
			flex-direction: column;
			background: var(--theme-color-background-panel, #FFFFFF);
		}
		.docuserve-section-playground-editor {
			flex: 1 1 0;
			min-height: 0;
			display: none;
		}
		.docuserve-section-playground-editor.active {
			display: flex;
			flex-direction: column;
		}
		.docuserve-section-playground-editor > * {
			flex: 1 1 0;
			min-height: 0;
		}

		/* Iframe pane — the rendered section + its theme switcher.
		   Lives inside the shell's bottom panel; the panel owns its
		   own border + sizing chrome. */
		.docuserve-section-playground-iframe-pane {
			height: 100%;
			min-height: 0;
			position: relative;
			background: var(--theme-color-background-secondary, #F6F3EE);
		}
		.docuserve-section-playground-iframe {
			width: 100%;
			height: 100%;
			border: 0;
			background: var(--theme-color-background-panel, #FFFFFF);
		}
		.docuserve-section-playground-status {
			position: absolute;
			top: 0.5em;
			right: 0.7em;
			font-size: 0.7em;
			color: var(--theme-color-text-muted, #8A7F72);
			background: var(--theme-color-background-panel, #FFFFFF);
			padding: 0.15em 0.5em;
			border-radius: 4px;
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			pointer-events: none;
			opacity: 0;
			transition: opacity 0.2s;
		}
		.docuserve-section-playground-status.show { opacity: 0.85; }
		.docuserve-section-playground-status.error {
			color: var(--theme-color-status-error, #B43A2E);
			border-color: var(--theme-color-status-error, #B43A2E);
		}

		/* Empty state for the iframe pane before the first Run. */
		.docuserve-section-playground-emptystate {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			color: var(--theme-color-text-muted, #8A7F72);
			font-size: 0.9em;
			text-align: center;
			padding: 2em;
		}
		.docuserve-section-playground-emptystate-title {
			font-size: 1.1em;
			font-weight: 600;
			color: var(--theme-color-text-secondary, #5E5549);
			margin-bottom: 0.4em;
		}

		/* Wider middle-positioned collapse tab on the sandbox panel —
		   replaces the stock 28×6 right-anchored sliver with a labelled
		   "Sandbox" pill centered above the panel's top edge.  The pill
		   is wide enough to read at a glance and lives at the boundary
		   between editor and sandbox so the user's eye finds it
		   immediately. */
		.docuserve-section-playground-shell-mount .pict-modal-shell-panel-bottom > .pict-modal-shell-panel-collapse-tab
		{
			/* Geometry: wide pill positioned fully ABOVE the panel's
			   top edge (matches the section-modal default of "tab
			   entirely outside the panel"; top = -height places the
			   tab's bottom edge flush against the panel boundary). */
			width: 160px;
			height: 18px;
			left: 50%;
			right: auto;
			top: -18px;
			margin-left: -80px;
			border-radius: 5px 5px 0 0;
			border-bottom: 0;
			/* Visual: always readable, not just on hover. */
			opacity: 0.95;
			color: var(--theme-color-text-secondary, #5E5549);
			background: var(--theme-color-background-secondary, #F6F3EE);
			border-color: var(--theme-color-border-default, #DDD6CA);
			padding: 0 10px;
			gap: 6px;
			line-height: 16px;
			font-size: 10px;
			font-weight: 600;
			letter-spacing: 0.08em;
			text-transform: uppercase;
		}
		/* Title text always visible (the stock CSS only shows it when
		   collapsed); the chevron pseudo is hidden — the label carries
		   the affordance. */
		.docuserve-section-playground-shell-mount .pict-modal-shell-panel-bottom > .pict-modal-shell-panel-collapse-tab .pict-modal-shell-panel-collapse-tab-title
		{
			display: inline;
		}
		.docuserve-section-playground-shell-mount .pict-modal-shell-panel-bottom > .pict-modal-shell-panel-collapse-tab::before
		{
			display: none;
		}
		/* Keep the size stable on hover (stock CSS grows it to 36×18) —
		   only color shifts so the user knows it's interactive. */
		.docuserve-section-playground-shell-mount .pict-modal-shell-panel-bottom:hover > .pict-modal-shell-panel-collapse-tab,
		.docuserve-section-playground-shell-mount .pict-modal-shell-panel-bottom > .pict-modal-shell-panel-collapse-tab:hover
		{
			width: 160px;
			height: 18px;
			top: -18px;
			margin-left: -80px;
			opacity: 1;
			color: var(--theme-color-brand-primary, #2E7D74);
			border-color: var(--theme-color-brand-primary, #2E7D74);
		}
	`,

	CSSPriority: 500,

	Templates:
	[
		{
			Hash: "Docuserve-Section-Playground-Template",
			Template: /*html*/`
<div class="docuserve-section-playground">
	<div class="docuserve-section-playground-toolbar">
		<div class="docuserve-section-playground-tabs" id="Docuserve-Section-Playground-Tabs">
			{~TS:Docuserve-Section-Playground-Tab-Template:AppData.Docuserve.SectionPlayground.Editors~}
		</div>
		<div class="docuserve-section-playground-actions">
			<button type="button" class="docuserve-section-playground-iconbtn"
				title="Reset all editors to their starter content"
				onclick="{~P~}.views['Docuserve-Section-Playground'].resetAll()">
				{~I:Refresh~} Reset
			</button>
			<button type="button" class="docuserve-section-playground-iconbtn docuserve-section-playground-iconbtn-run"
				title="Run — reload the iframe with the current editor contents"
				onclick="{~P~}.views['Docuserve-Section-Playground'].run()">
				<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>
				Run
			</button>
		</div>
	</div>
	<!-- pict-section-modal shell mount.  _mountAndRender() calls
	     modal.shell(thisDiv) and addPanel() for the bottom sandbox
	     panel + center() for the editor stack.  The shell builds its
	     own destination divs (#Section-Playground-Editor-Mount and
	     #Section-Playground-Iframe-Mount) inside this wrapper. -->
	<div class="docuserve-section-playground-shell-mount" id="Docuserve-Section-Playground-Shell-Mount"></div>
</div>`
		},
		{
			Hash: "Docuserve-Section-Playground-Tab-Template",
			Template: /*html*/`<button type="button"
	class="docuserve-section-playground-tab{~D:Record.ActiveClass~}"
	onclick="{~P~}.views['Docuserve-Section-Playground'].selectTab('{~D:Record.Hash~}')"
>{~D:Record.Label~}</button>`
		},
		{
			Hash: "Docuserve-Section-Playground-Editor-Slot-Template",
			Template: /*html*/`<div class="docuserve-section-playground-editor{~D:Record.ActiveClass~}"
	id="Docuserve-Section-Playground-Editor-{~D:Record.Hash~}"
	data-editor-hash="{~D:Record.Hash~}"></div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Section-Playground-Content",
			TemplateHash: "Docuserve-Section-Playground-Template",
			ContentDestinationAddress: "#Docuserve-Content-Container",
			RenderMethod: "replace"
		}
	]
};

// ────────────────────────────────────────────────────────────────────────
// Iframe srcdoc — the page loaded inside the sandbox iframe.
//
// Loads the runtime pieces from jsDelivr @1 (so the playground tracks
// the same major version as the docs site), wires up an instance of
// the configured `SectionType`, mounts a theme picker, and renders.
// Configs are inlined as JSON literals at srcdoc build time — no
// postMessage required.
// ────────────────────────────────────────────────────────────────────────
function buildIframeSrcdoc(pConfig, pSpec, pBaseURL)
{
	// Defaults if the per-module _playground.json doesn't override.
	let tmpDefaults =
	{
		SectionType:        'pict-section-form',
		ApplicationGlobal:  'PictFormApplication',
		ApplicationModule:  'PictSectionForm',
		ManifestKey:        'DefaultFormManifest',
		// WrapperKind controls whether the resolved class is treated as a
		// PictApplication subclass (default) or as a PictView subclass that
		// the bootstrap will wrap in a synthesized PictApplication.
		//   - "application": `window[ApplicationModule][ApplicationGlobal]`
		//      already IS the PictApplication.  (pict-section-form's pattern.)
		//   - "view":        the resolved class is a PictView; the bootstrap
		//      synthesizes a wrapper PictApplication that registers it under
		//      `ViewName` with config from `pictConfig[ViewConfigKey]`.  This
		//      is the path most UI-control modules take — they ship a view,
		//      not an application, and don't need to author a wrapper class.
		WrapperKind:        'application',
		ViewName:           'Section-Playground-View',
		ViewConfigKey:      'ViewConfig',
		// Optional DOM id where the section should mount.  When set, the
		// iframe template includes <div id="<MountID>"></div> next to the
		// default #Section-Playground-Mount, AND the wrapper-synthesizer's
		// auto-target uses it instead of #Section-Playground-Mount.  Lets
		// sections whose DefaultDestinationAddress doesn't already match
		// either the iframe slots or #Section-Playground-Mount declare
		// their own ID without overriding Renderables by hand.
		MountID:            '',
		// Optional method on the view to call once after initialization
		// with seeded data.  Use this for sections whose data is loaded
		// imperatively (e.g. pict-editor-timeline's `loadStoryboard`,
		// pict-section-equation's `setSolveResult`) rather than via a
		// `<X>DataAddress` config option.  The value at
		// `BootstrapSeedAddress` (in `pict.AppData`) is the argument.
		BootstrapMethod:        '',
		BootstrapSeedAddress:   '',
		// Imports — each one is { Name, Source: 'cdn'|'bundled'|'local'|'esm', Version?, Path?, URL?, GlobalName?, ExportName? }.
		// Loading shapes:
		//   cdn   — <script src="https://cdn.jsdelivr.net/npm/<Name>@<Version>/dist/<Name>.min.js"></script>
		//   local — <script src="<Path>"></script>; Path resolves against the docs root
		//   esm   — <script type="module">import { <ExportName> } from "<URL>"; window["<GlobalName>"] = <ExportName>;</script>
		//           Use for ES-module-only packages (CodeJar 4.x, etc.) that
		//           can't be loaded via plain <script src>.  Bootstrap waits
		//           on `window.<GlobalName>` before running the application.
		// Order matters: pict first, then anything that depends on it
		// (pict-application before any wrapper that needs synthesis),
		// then the section module last.
		Imports: [],
		// Stylesheets — each is { Source: 'cdn'|'local', Name?, Version?, Path? }.
		// Emitted as <link rel="stylesheet"> tags in the iframe head.  Used by
		// sections that wrap external libraries with CSS (Toast UI Grid, KaTeX,
		// Mermaid pre-styled themes, …) so module authors don't have to inject
		// <link> tags from Application Code.  Local sources are staged by the
		// `stage-playground` command alongside Imports.
		Stylesheets: []
	};

	let tmpSpec = Object.assign({}, tmpDefaults, pSpec || {});

	// Default Imports if none provided — minimum needed for a pict-section-form
	// playground.  Most callers will override this in _playground.json.
	let tmpImports = (tmpSpec.Imports && tmpSpec.Imports.length > 0) ? tmpSpec.Imports :
	[
		{ Name: 'pict',                 Source: 'cdn' },
		{ Name: 'pict-application',     Source: 'cdn' },
		{ Name: 'pict-section-form',    Source: 'cdn' },
		{ Name: 'pict-section-modal',   Source: 'cdn' },
		{ Name: 'pict-section-theme',   Source: 'cdn' }
	];

	// Build script + stylesheet tags for every Import / Stylesheet.
	//
	// Imports — four sources:
	//   cdn   — jsDelivr URL built from Name + Version
	//   local — Path relative to the docs root (resolved via <base href> tag
	//           we emit below, so the iframe's about:srcdoc origin doesn't
	//           break relative paths)
	//   esm   — ES-module dynamic import emitted as <script type="module">; the
	//           bootstrap waits on `window[GlobalName]` before running the app.
	//   bundled — legacy alias, treated as cdn for compatibility.
	//
	// Stylesheets — same Source values minus 'esm' (CSS has no ESM concept).
	let tmpScriptTags = '';
	let tmpESMImports = [];
	for (let i = 0; i < tmpImports.length; i++)
	{
		let tmpImport = tmpImports[i];
		if (tmpImport.Source === 'esm')
		{
			// Defer to a single coalesced <script type="module"> at the
			// bottom so we can wait on all ESM globals before app init.
			tmpESMImports.push(tmpImport);
			continue;
		}
		let tmpSrc;
		if (tmpImport.Source === 'local')
		{
			tmpSrc = tmpImport.Path;
		}
		else
		{
			let tmpVersion = tmpImport.Version || '1';
			tmpSrc = 'https://cdn.jsdelivr.net/npm/' + tmpImport.Name + '@' + tmpVersion
				+ '/dist/' + tmpImport.Name + '.min.js';
		}
		tmpScriptTags += '<script src="' + tmpSrc + '"></script>\n';
	}

	// Stylesheet <link> tags — emitted into <head> before the script tags so
	// the section's first paint already has its external styles applied.
	let tmpStylesheets = Array.isArray(tmpSpec.Stylesheets) ? tmpSpec.Stylesheets : [];
	let tmpLinkTags = '';
	for (let i = 0; i < tmpStylesheets.length; i++)
	{
		let tmpStyle = tmpStylesheets[i];
		let tmpHref;
		if (tmpStyle.Source === 'local')
		{
			tmpHref = tmpStyle.Path;
		}
		else
		{
			let tmpVersion = tmpStyle.Version || '1';
			let tmpStylePath = tmpStyle.Path || ('dist/' + tmpStyle.Name + '.min.css');
			tmpHref = 'https://cdn.jsdelivr.net/npm/' + tmpStyle.Name + '@' + tmpVersion + '/' + tmpStylePath;
		}
		tmpLinkTags += '<link rel="stylesheet" href="' + tmpHref + '">\n';
	}

	// ESM imports — coalesced into one <script type="module"> that imports
	// each module, stamps the named export onto window[GlobalName], and
	// signals readiness via a single flag the bootstrap waits on.
	let tmpESMScript = '';
	if (tmpESMImports.length > 0)
	{
		tmpESMScript += '<script type="module">\n';
		tmpESMScript += 'window.__SectionPlaygroundESMReady = (async () => {\n';
		for (let i = 0; i < tmpESMImports.length; i++)
		{
			let tmpESM = tmpESMImports[i];
			let tmpURL = tmpESM.URL;
			if (!tmpURL && tmpESM.Name)
			{
				let tmpVersion = tmpESM.Version || '1';
				tmpURL = 'https://cdn.jsdelivr.net/npm/' + tmpESM.Name + '@' + tmpVersion + '/dist/' + tmpESM.Name + '.min.js';
			}
			let tmpExportName = tmpESM.ExportName || tmpESM.GlobalName || tmpESM.Name;
			let tmpGlobalName = tmpESM.GlobalName || tmpESM.ExportName || tmpESM.Name;
			tmpESMScript += '  try {\n';
			tmpESMScript += '    const mod = await import(' + JSON.stringify(tmpURL) + ');\n';
			tmpESMScript += '    window[' + JSON.stringify(tmpGlobalName) + '] = mod[' + JSON.stringify(tmpExportName) + '] || mod.default || mod;\n';
			tmpESMScript += '  } catch (err) {\n';
			tmpESMScript += '    console.error("ESM import failed for " + ' + JSON.stringify(tmpURL) + ', err);\n';
			tmpESMScript += '    throw err;\n';
			tmpESMScript += '  }\n';
		}
		tmpESMScript += '})();\n';
		tmpESMScript += '</script>\n';
	}

	// Caller passes an absolute base URL so local Imports + asset paths
	// resolve against the parent's docs root.  An about:srcdoc iframe
	// has no base of its own — without the <base> tag, "playground/runtime/
	// pict.min.js" 404s as "about:srcdoc/playground/runtime/pict.min.js".
	let tmpBaseHref = pBaseURL || '';

	// JSON-encode each user config.  We embed them verbatim in a <script>
	// block so the iframe boots from in-memory literals — no need for the
	// iframe to call back to the parent.
	function encode(pValue)
	{
		// JSON.stringify of undefined → undefined; coerce to empty object.
		let tmpEncoded = JSON.stringify(pValue === undefined ? {} : pValue);
		// Defang </script> just in case a user pastes one in.
		return tmpEncoded.replace(/<\/script>/g, '<\\/script>');
	}

	let tmpManifestJSON   = encode(pConfig.manifest);
	let tmpPictConfigJSON = encode(pConfig.pictConfig);
	let tmpAppConfigJSON  = encode(pConfig.appConfig);
	let tmpAppDataJSON    = encode(pConfig.appData);

	// Application Code editor — optional raw JS that runs as the body
	// of a function `(Base) => class`.  Encoded as a JSON string so it
	// survives the srcdoc round-trip; the iframe wraps it with
	// `new Function('Base', source)` and expects a class back.
	let tmpApplicationJS = (typeof pConfig.application === 'string') ? pConfig.application : '';
	let tmpApplicationJSON = JSON.stringify(tmpApplicationJS).replace(/<\/script>/g, '<\\/script>');

	// HTML.  Theme picker is rendered into a slim topbar inside the iframe
	// so the user can switch themes without leaving the page.  The section
	// itself mounts into the main content div below it.
	return '<!DOCTYPE html>\n'
		+ '<html lang="en">\n'
		+ '<head>\n'
		+ '<meta charset="UTF-8">\n'
		+ '<title>Section Playground</title>\n'
		+ (tmpBaseHref ? '<base href="' + tmpBaseHref + '">\n' : '')
		+ '<style>\n'
		+ '  html, body { height: 100%; margin: 0; }\n'
		+ '  body { display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }\n'
		+ '  #playground-topbar { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 14px; border-bottom: 1px solid var(--theme-color-border-default, #DDD6CA); background: var(--theme-color-background-panel, #FFFFFF); }\n'
		+ '  #playground-topbar-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--theme-color-text-muted, #8A7F72); }\n'
		+ '  #playground-topbar-controls { display: flex; align-items: center; gap: 8px; }\n'
		+ '  #playground-content { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 16px; background: var(--theme-color-background-primary, #FDFBF7); }\n'
		+ '  #playground-error { display: none; padding: 14px 18px; background: #FFF4F2; color: #B43A2E; border-bottom: 1px solid #B43A2E; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; white-space: pre-wrap; }\n'
		+ '  #playground-error.show { display: block; }\n'
		+ '</style>\n'
		+ tmpLinkTags
		+ tmpScriptTags
		+ tmpESMScript
		+ '</head>\n'
		+ '<body>\n'
		+ '<div id="playground-error"></div>\n'
		+ '<div id="playground-topbar">\n'
		+ '  <div id="playground-topbar-title">Section Sandbox</div>\n'
		+ '  <div id="playground-topbar-controls">\n'
		+ '    <div id="Theme-Picker"></div>\n'
		+ '    <div id="Theme-ModeToggle"></div>\n'
		+ '    <div id="Theme-ScaleSelect"></div>\n'
		+ '  </div>\n'
		+ '</div>\n'
		+ '<div id="playground-content">\n'
		+ '  <!-- The section-form metacontroller renders into #Pict-Form-Container by default. -->\n'
		+ '  <!-- Other section types may use a different default; the spec drives the markup. -->\n'
		+ '  <div id="Pict-Form-Container"></div>\n'
		+ '  <div id="Section-Playground-Mount"></div>\n'
		+ (tmpSpec.MountID ? '  <div id="' + tmpSpec.MountID + '"></div>\n' : '')
		+ '</div>\n'
		+ '<script>\n'
		+ '(function() {\n'
		+ '  var manifest   = ' + tmpManifestJSON + ';\n'
		+ '  var pictConfig = ' + tmpPictConfigJSON + ';\n'
		+ '  var appConfig  = ' + tmpAppConfigJSON + ';\n'
		+ '  var appData    = ' + tmpAppDataJSON + ';\n'
		+ '  var applicationSource = ' + tmpApplicationJSON + ';\n'
		+ '  var sectionType        = ' + JSON.stringify(tmpSpec.SectionType) + ';\n'
		+ '  var applicationModule  = ' + JSON.stringify(tmpSpec.ApplicationModule) + ';\n'
		+ '  var applicationGlobal  = ' + JSON.stringify(tmpSpec.ApplicationGlobal) + ';\n'
		+ '  var manifestKey        = ' + JSON.stringify(tmpSpec.ManifestKey) + ';\n'
		+ '  var wrapperKind        = ' + JSON.stringify(tmpSpec.WrapperKind) + ';\n'
		+ '  var viewName           = ' + JSON.stringify(tmpSpec.ViewName) + ';\n'
		+ '  var viewConfigKey      = ' + JSON.stringify(tmpSpec.ViewConfigKey) + ';\n'
		+ '  var mountID            = ' + JSON.stringify(tmpSpec.MountID) + ';\n'
		+ '  var bootstrapMethod    = ' + JSON.stringify(tmpSpec.BootstrapMethod) + ';\n'
		+ '  var bootstrapSeedAddr  = ' + JSON.stringify(tmpSpec.BootstrapSeedAddress) + ';\n'
		+ '\n'
		+ '  function showError(msg) {\n'
		+ '    var el = document.getElementById("playground-error");\n'
		+ '    if (el) { el.textContent = msg; el.classList.add("show"); }\n'
		+ '    try { parent.postMessage({ type: "section-playground-error", message: msg }, "*"); } catch(e) {}\n'
		+ '  }\n'
		+ '\n'
		+ '  function ready(fn) {\n'
		+ '    if (document.readyState !== "loading") { fn(); }\n'
		+ '    else { document.addEventListener("DOMContentLoaded", fn); }\n'
		+ '  }\n'
		+ '\n'
		+ '  function awaitESM() {\n'
		+ '    return (window.__SectionPlaygroundESMReady && typeof window.__SectionPlaygroundESMReady.then === "function")\n'
		+ '      ? window.__SectionPlaygroundESMReady\n'
		+ '      : Promise.resolve();\n'
		+ '  }\n'
		+ '\n'
		+ '  ready(function() {\n'
		+ '   awaitESM().then(function() { try {\n'
		+ '      if (typeof Pict === "undefined") { throw new Error("pict bundle did not load — check the CDN imports in _playground.json"); }\n'
		+ '      var libSectionModule = window[applicationModule];\n'
		+ '      if (!libSectionModule) { throw new Error("Section module " + applicationModule + " is not loaded; check the Imports in _playground.json"); }\n'
		+ '      var ResolvedClass = libSectionModule[applicationGlobal] || libSectionModule;\n'
		+ '      if (typeof ResolvedClass !== "function") { throw new Error("Could not resolve " + applicationGlobal + " on " + applicationModule); }\n'
		+ '\n'
		+ '      // Wrapper resolution.  Two paths:\n'
		+ '      //   1. WrapperKind: "application" (default) — the resolved class\n'
		+ '      //      is already a PictApplication subclass; use it directly.\n'
		+ '      //      pict-section-form\'s pattern.\n'
		+ '      //   2. WrapperKind: "view" — the resolved class is a PictView; the\n'
		+ '      //      bootstrap synthesizes a PictApplication subclass that\n'
		+ '      //      registers the view under `viewName` with config drawn\n'
		+ '      //      from pictConfig[viewConfigKey].  This is the no-wrapper\n'
		+ '      //      path: section modules ship just their view class and a\n'
		+ '      //      _playground.json — no per-module Application file needed.\n'
		+ '      var BaseApplicationClass;\n'
		+ '      if (wrapperKind === "view") {\n'
		+ '        if (typeof window.PictApplication !== "function") { throw new Error("WrapperKind: \\"view\\" requires pict-application to be loaded — add it to Imports in _playground.json"); }\n'
		+ '        var ViewClass = ResolvedClass;\n'
		+ '        // PictApplication is an ES6 class, so the wrapper MUST be one\n'
		+ '        // too — ES6 classes throw "cannot be invoked without new" when\n'
		+ '        // called via `.call(this, ...)`, so the prototype-style pattern\n'
		+ '        // (function + Object.create) silently fails at construction.\n'
		+ '        // Build the class via a Function constructor so we can keep\n'
		+ '        // closure access to viewName / viewConfigKey / mountID / etc.\n'
		+ '        var BuildWrapperClass = new Function(\n'
		+ '          "PictApplication", "ViewClass", "pictConfig", "viewName", "viewConfigKey", "mountID", "bootstrapMethod", "bootstrapSeedAddr",\n'
		+ '          "return class ViewWrapperApplication extends PictApplication {"\n'
		+ '          + "  constructor(pFable, pOptions, pServiceHash) {"\n'
		+ '          + "    super(pFable, pOptions, pServiceHash);"\n'
		+ '          + "    var tmpDefaultViewConfig = (ViewClass.default_configuration || {});"\n'
		+ '          + "    var tmpInjectedViewConfig = (pictConfig && pictConfig[viewConfigKey]) || {};"\n'
		+ '          + "    var tmpMergedViewConfig = Object.assign({}, tmpDefaultViewConfig, tmpInjectedViewConfig);"\n'
		+ '          + "    var tmpAutoMount = \\"#\\" + (mountID || \\"Section-Playground-Mount\\");"\n'
		+ '          + "    if (typeof tmpInjectedViewConfig.DefaultDestinationAddress === \\"undefined\\") {"\n'
		+ '          + "      tmpMergedViewConfig.DefaultDestinationAddress = tmpAutoMount;"\n'
		+ '          + "      if (Array.isArray(tmpDefaultViewConfig.Renderables)) {"\n'
		+ '          + "        tmpMergedViewConfig.Renderables = tmpDefaultViewConfig.Renderables.map(function(pRenderable) {"\n'
		+ '          + "          return Object.assign({}, pRenderable, { DestinationAddress: tmpAutoMount });"\n'
		+ '          + "        });"\n'
		+ '          + "      }"\n'
		+ '          + "    }"\n'
		+ '          + "    this.pict.addView(viewName, tmpMergedViewConfig, ViewClass);"\n'
		+ '          + "  }"\n'
		+ '          + "  onAfterInitialize() {"\n'
		+ '          + "    super.onAfterInitialize();"\n'
		+ '          + "    var tmpView = this.pict.views[viewName];"\n'
		+ '          + "    if (bootstrapMethod && tmpView && typeof tmpView[bootstrapMethod] === \\"function\\") {"\n'
		+ '          + "      try {"\n'
		+ '          + "        var tmpSeed;"\n'
		+ '          + "        if (bootstrapSeedAddr && this.pict && this.pict.manifest && typeof this.pict.manifest.getValueByHash === \\"function\\") {"\n'
		+ '          + "          tmpSeed = this.pict.manifest.getValueByHash(this.pict.AppData, bootstrapSeedAddr);"\n'
		+ '          + "        }"\n'
		+ '          + "        tmpView[bootstrapMethod](tmpSeed);"\n'
		+ '          + "      } catch (seedErr) { console.warn(\\"BootstrapMethod \\" + bootstrapMethod + \\" threw:\\", seedErr); }"\n'
		+ '          + "    }"\n'
		+ '          + "    if (tmpView && typeof tmpView.render === \\"function\\") { tmpView.render(); }"\n'
		+ '          + "  }"\n'
		+ '          + "};"\n'
		+ '        );\n'
		+ '        BaseApplicationClass = BuildWrapperClass(window.PictApplication, ViewClass, pictConfig, viewName, viewConfigKey, mountID, bootstrapMethod, bootstrapSeedAddr);\n'
		+ '        // Carry through whatever defaults the view itself ships, so\n'
		+ '        // pict_configuration / Product / Hash stay sensible if the\n'
		+ '        // user has not provided their own appConfig / pictConfig.\n'
		+ '        BaseApplicationClass.default_configuration = (ViewClass.default_configuration && ViewClass.default_configuration.pict_configuration)\n'
		+ '          ? ViewClass.default_configuration\n'
		+ '          : { pict_configuration: {} };\n'
		+ '      } else {\n'
		+ '        BaseApplicationClass = ResolvedClass;\n'
		+ '      }\n'
		+ '\n'
		+ '      // Subclass.  If the user supplied Application Code,\n'
		+ '      // wrap it as `function (Base) { ...userBody... }` and\n'
		+ '      // expect it to return a class.  Otherwise fall back to\n'
		+ '      // a no-op extends-Base subclass.  class extends handles\n'
		+ '      // both ES6 classes and old-style prototype constructors.\n'
		+ '      var PlaygroundApplication;\n'
		+ '      if (typeof applicationSource === "string" && applicationSource.trim().length > 0) {\n'
		+ '        try {\n'
		+ '          var customizerFn = new Function("Base", applicationSource);\n'
		+ '          var customizerResult = customizerFn(BaseApplicationClass);\n'
		+ '          if (typeof customizerResult !== "function") {\n'
		+ '            throw new Error("Application Code must `return` a class.  Got " + (typeof customizerResult) + ".");\n'
		+ '          }\n'
		+ '          PlaygroundApplication = customizerResult;\n'
		+ '        } catch (customizerErr) {\n'
		+ '          throw new Error("Application Code error: " + (customizerErr && customizerErr.message ? customizerErr.message : customizerErr));\n'
		+ '        }\n'
		+ '      } else {\n'
		+ '        PlaygroundApplication = class extends BaseApplicationClass {};\n'
		+ '      }\n'
		+ '\n'
		+ '      // Precedence: Base class defaults < user-class defaults\n'
		+ '      // (if Application Code set its own) < the four editor tabs.\n'
		+ '      // The editor tabs are what the playground exists to drive,\n'
		+ '      // so they always win.\n'
		+ '      var userDefault = PlaygroundApplication.default_configuration || BaseApplicationClass.default_configuration || {};\n'
		+ '      var basePict    = userDefault.pict_configuration || {};\n'
		+ '      var mergedPict  = Object.assign({}, basePict, pictConfig);\n'
		+ '      mergedPict[manifestKey] = manifest;\n'
		+ '      if (appData !== undefined) { mergedPict.DefaultAppData = appData; }\n'
		+ '\n'
		+ '      var defaultConfig = Object.assign({}, userDefault, appConfig);\n'
		+ '      defaultConfig.pict_configuration = mergedPict;\n'
		+ '      PlaygroundApplication.default_configuration = defaultConfig;\n'
		+ '\n'
		+ '      // Pict.safeLoadPictApplication will instantiate and run lifecycle.\n'
		+ '      Pict.safeOnDocumentReady(function() {\n'
		+ '        Pict.safeLoadPictApplication(PlaygroundApplication, 2);\n'
		+ '        // Mount the theme controls once the app is up.\n'
		+ '        setTimeout(function() {\n'
		+ '          try {\n'
		+ '            if (window.PictSectionTheme && window._Pict && typeof window._Pict.addProvider === "function") {\n'
		+ '              if (!window._Pict.providers || !window._Pict.providers["Theme-Section"]) {\n'
		+ '                window._Pict.addProvider("Theme-Section", { ApplyDefault: "retold-default", DefaultMode: "system", DefaultScale: 1.0, Views: ["Picker", "ModeToggle", "ScaleSelect"] }, window.PictSectionTheme);\n'
		+ '                window._Pict.views["Theme-Picker"].render();\n'
		+ '                if (window._Pict.views["Theme-ModeToggle"]) { window._Pict.views["Theme-ModeToggle"].render(); }\n'
		+ '                if (window._Pict.views["Theme-ScaleSelect"]) { window._Pict.views["Theme-ScaleSelect"].render(); }\n'
		+ '              }\n'
		+ '            }\n'
		+ '          } catch (themeErr) { /* theme bootstrap is best-effort */ }\n'
		+ '        }, 50);\n'
		+ '        try { parent.postMessage({ type: "section-playground-ready" }, "*"); } catch(e) {}\n'
		+ '      });\n'
		+ '    } catch (err) {\n'
		+ '      showError(String(err && err.stack ? err.stack : err));\n'
		+ '    } }).catch(function(esmErr) {\n'
		+ '      showError("ESM import failed: " + String(esmErr && esmErr.message ? esmErr.message : esmErr));\n'
		+ '    });\n'
		+ '  });\n'
		+ '}());\n'
		+ '</script>\n'
		+ '</body>\n'
		+ '</html>';
}


class DocuserveSectionPlaygroundView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		// Editor metadata — populated when the playground is opened for
		// a specific module.  Each entry mirrors the _playground.json
		// Editors[] descriptor + activation state.
		this._editors = [];
		this._activeHash = null;
		// (group, module) currently mounted; used to scope localStorage.
		this._scope = { Group: '', Module: '' };
	}

	// ────────────────────────────────────────────────────────────────
	//  Public API — called by the application's router.
	// ────────────────────────────────────────────────────────────────

	/**
	 * Open the playground for `<group>/<module>`.  Reads the module's
	 * `_playground.json`, hydrates editors from starter files or
	 * localStorage, renders the layout, and mounts a pict-section-code
	 * view per editor tab.
	 *
	 * @param {string} pGroup
	 * @param {string} pModule
	 */
	openPlayground(pGroup, pModule)
	{
		this._scope = { Group: pGroup, Module: pModule };

		let tmpDoc = this.pict.providers['Docuserve-Documentation'];
		if (!tmpDoc || typeof tmpDoc.loadPlaygroundConfig !== 'function')
		{
			this._renderError('Documentation provider is not registered.');
			return;
		}

		let tmpSelf = this;
		tmpDoc.loadPlaygroundConfig(pGroup, pModule).then(function (pConfig)
		{
			if (!pConfig || pConfig.Kind !== 'section')
			{
				tmpSelf._renderError('This module does not have a section playground configured. Add `Kind: "section"` to `docs/_playground.json` and declare an `Editors` array.');
				return;
			}
			tmpSelf._spec = pConfig;
			tmpSelf._loadEditors(pGroup, pModule, pConfig).then(function ()
			{
				tmpSelf._mountAndRender();
			});
		})
		.catch(function (pError)
		{
			tmpSelf._renderError('Failed to load _playground.json: ' + (pError && pError.message ? pError.message : pError));
		});
	}

	/**
	 * Switch the visible editor tab.  Each tab is a separate
	 * pict-section-code instance mounted into its own slot div; we
	 * just toggle the .active class.
	 */
	selectTab(pHash)
	{
		this._activeHash = pHash;
		this._refreshEditorRecords();
		// Toggle active class on the live DOM without re-rendering the
		// whole view (editor mounts must stay stable so CodeJar keeps
		// its state).
		let tmpTabs = document.querySelectorAll('.docuserve-section-playground-tab');
		for (let i = 0; i < tmpTabs.length; i++) { tmpTabs[i].classList.remove('active'); }
		let tmpEditors = document.querySelectorAll('.docuserve-section-playground-editor');
		for (let j = 0; j < tmpEditors.length; j++) { tmpEditors[j].classList.remove('active'); }
		for (let k = 0; k < this._editors.length; k++)
		{
			let tmpEd = this._editors[k];
			if (tmpEd.Hash === pHash)
			{
				let tmpTabEl = document.querySelector('.docuserve-section-playground-tab[onclick*="\'' + tmpEd.Hash + '\'"]');
				if (tmpTabEl) { tmpTabEl.classList.add('active'); }
				let tmpEditorEl = document.getElementById('Docuserve-Section-Playground-Editor-' + tmpEd.Hash);
				if (tmpEditorEl) { tmpEditorEl.classList.add('active'); }
			}
		}
	}

	/**
	 * "Run" — read each editor's current value, validate, build a
	 * fresh srcdoc, and replace the iframe contents.
	 */
	run()
	{
		let tmpConfig;
		try
		{
			tmpConfig = this._readAndValidateEditors();
		}
		catch (pError)
		{
			this._setStatus(pError.message, true);
			return;
		}

		this._setStatus('running…', false);

		let tmpIframe = document.getElementById('Docuserve-Section-Playground-Iframe');
		if (!tmpIframe) { return; }

		// Compute an absolute base href for the iframe's <base> tag.
		// The iframe lives at about:srcdoc — relative URLs there don't
		// resolve to the parent's docs root, so we anchor a real URL.
		let tmpBaseURL = '';
		try
		{
			// Trim hash off the parent location so the base resolves to the
			// docs directory, not the SPA route.
			let tmpHref = window.location.href.split('#')[0];
			// Strip the final 'index.html' if present so the base is the dir.
			tmpBaseURL = tmpHref.replace(/index\.html$/, '');
		}
		catch (pErr) { tmpBaseURL = ''; }

		let tmpSrcdoc = buildIframeSrcdoc(tmpConfig, this._spec || {}, tmpBaseURL);
		tmpIframe.srcdoc = tmpSrcdoc;

		// One-shot ready listener — re-attached each Run.
		let tmpSelf = this;
		let tmpListener = function (pEvent)
		{
			if (!pEvent || !pEvent.data) return;
			if (pEvent.data.type === 'section-playground-ready')
			{
				tmpSelf._setStatus('rendered', false);
			}
			else if (pEvent.data.type === 'section-playground-error')
			{
				tmpSelf._setStatus('error in sandbox', true);
			}
		};
		window.addEventListener('message', tmpListener);
		// Auto-cleanup after a generous timeout so we don't leak.
		setTimeout(function () { window.removeEventListener('message', tmpListener); }, 30000);
	}

	/**
	 * Reset every editor back to its starter content (DefaultPath JSON
	 * file or the inline Default in the spec).  Clears the matching
	 * localStorage entries so subsequent reloads re-read the starters.
	 */
	resetAll()
	{
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		let tmpSelf = this;
		let tmpProceed = function ()
		{
			for (let i = 0; i < tmpSelf._editors.length; i++)
			{
				let tmpEd = tmpSelf._editors[i];
				tmpEd.Code = tmpEd.StarterCode || '';
				let tmpKey = tmpSelf._storageKey(tmpEd.Hash);
				try { window.localStorage.removeItem(tmpKey); } catch (e) { /* */ }
				let tmpAddress = tmpSelf._editorCodeAddress(tmpEd.Hash);
				tmpSelf.pict.manifest.setValueByHash(tmpSelf.pict.AppData, tmpAddress, tmpEd.Code);
				let tmpEditorView = tmpSelf.pict.views[tmpSelf._editorViewIdentifier(tmpEd.Hash)];
				if (tmpEditorView && typeof tmpEditorView.setCode === 'function')
				{
					tmpEditorView.setCode(tmpEd.Code);
				}
			}
			tmpSelf._setStatus('reset to starters', false);
		};

		if (tmpModal && typeof tmpModal.confirm === 'function')
		{
			tmpModal.confirm(
				'Reset all editors to their starter content? Your current edits will be lost.',
				{
					title:        'Reset playground',
					confirmLabel: 'Reset',
					cancelLabel:  'Keep edits',
					dangerous:    true
				}
			).then(function (pOK) { if (pOK) tmpProceed(); });
		}
		else
		{
			tmpProceed();
		}
	}

	// ────────────────────────────────────────────────────────────────
	//  Internals
	// ────────────────────────────────────────────────────────────────

	_storageKey(pEditorHash)
	{
		return _LocalStorageKeyPrefix + ':' + this._scope.Group + '/' + this._scope.Module + ':' + pEditorHash;
	}

	_editorViewIdentifier(pEditorHash)
	{
		return 'Docuserve-Section-Playground-Editor-View-' + pEditorHash;
	}

	_editorCodeAddress(pEditorHash)
	{
		return _AppDataRoot + '.Code.' + pEditorHash;
	}

	/**
	 * Hydrate `this._editors` from the spec + starters + localStorage.
	 * Returns a Promise so callers can await all fetches.
	 */
	_loadEditors(pGroup, pModule, pSpec)
	{
		let tmpEditors = pSpec.Editors || [];
		let tmpDoc = this.pict.providers['Docuserve-Documentation'];
		let tmpSelf = this;

		this._editors = [];

		let tmpPromises = [];
		for (let i = 0; i < tmpEditors.length; i++)
		{
			(function (pEditorSpec, pIndex)
			{
				let tmpEntry =
				{
					Hash:         pEditorSpec.Hash,
					Label:        pEditorSpec.Label || pEditorSpec.Hash,
					Language:     pEditorSpec.Language || 'json',
					StarterCode:  pEditorSpec.Default || '',
					Code:         ''
				};

				// Try localStorage first (user's last edits).
				let tmpStored = null;
				try { tmpStored = window.localStorage.getItem(tmpSelf._storageKey(pEditorSpec.Hash)); }
				catch (e) { tmpStored = null; }

				// Then fetch the starter file if DefaultPath is set.
				//
				// URL resolution has two modes:
				//   * Catalog mode (group + module + Catalog provider) — use
				//     resolveDocumentURL() which routes to the right GitHub
				//     pages site for the target module.
				//   * Standalone mode (no group/module, or empty strings) —
				//     the docs site IS the module's own docs, so a
				//     docs-root-relative path resolves correctly as-is.
				let tmpStarterPromise;
				if (pEditorSpec.DefaultPath)
				{
					let tmpURL = null;
					if (pGroup && pModule && tmpDoc && typeof tmpDoc.resolveDocumentURL === 'function')
					{
						tmpURL = tmpDoc.resolveDocumentURL(pGroup, pModule, pEditorSpec.DefaultPath);
					}
					if (!tmpURL)
					{
						let tmpDocsBase = tmpSelf.pict.AppData.Docuserve.DocsBaseURL || '';
						tmpURL = tmpDocsBase + pEditorSpec.DefaultPath;
					}
					tmpStarterPromise = fetch(tmpURL).then(function (pResponse)
					{
						if (!pResponse.ok) { return ''; }
						return pResponse.text();
					}).catch(function () { return ''; });
				}
				else
				{
					tmpStarterPromise = Promise.resolve(tmpEntry.StarterCode);
				}

				tmpPromises.push(tmpStarterPromise.then(function (pStarter)
				{
					tmpEntry.StarterCode = pStarter || tmpEntry.StarterCode;
					tmpEntry.Code = (tmpStored !== null && tmpStored !== undefined)
						? tmpStored
						: tmpEntry.StarterCode;
					// Park in the same slot so re-mounts preserve order.
					tmpSelf._editors[pIndex] = tmpEntry;
				}));
			}(tmpEditors[i], i));
		}

		return Promise.all(tmpPromises).then(function ()
		{
			// Compact in case any slot ended up undefined.
			tmpSelf._editors = tmpSelf._editors.filter(function (e) { return !!e; });
			if (tmpSelf._editors.length > 0)
			{
				tmpSelf._activeHash = tmpSelf._editors[0].Hash;
			}
		});
	}

	_refreshEditorRecords()
	{
		let tmpRecords = [];
		for (let i = 0; i < this._editors.length; i++)
		{
			let tmpEd = this._editors[i];
			tmpRecords.push(
			{
				Hash:        tmpEd.Hash,
				Label:       tmpEd.Label,
				ActiveClass: (tmpEd.Hash === this._activeHash) ? ' active' : ''
			});
		}
		this.pict.AppData.Docuserve = this.pict.AppData.Docuserve || {};
		this.pict.AppData.Docuserve.SectionPlayground = this.pict.AppData.Docuserve.SectionPlayground || {};
		this.pict.AppData.Docuserve.SectionPlayground.Editors = tmpRecords;
		// Seed each editor's Code address so pict-section-code finds the
		// initial value when it mounts.
		this.pict.AppData.Docuserve.SectionPlayground.Code = this.pict.AppData.Docuserve.SectionPlayground.Code || {};
		for (let j = 0; j < this._editors.length; j++)
		{
			let tmpEd = this._editors[j];
			this.pict.AppData.Docuserve.SectionPlayground.Code[tmpEd.Hash] = tmpEd.Code;
		}
	}

	/**
	 * Build the pict-section-modal shell that hosts the editor stack
	 * (center) + iframe sandbox (resizable + collapsible bottom panel).
	 *
	 * The shell creates two destination divs inside its mount:
	 *   * #Docuserve-Section-Playground-Editor-Mount   (center)
	 *   * #Docuserve-Section-Playground-Iframe-Mount   (bottom panel)
	 *
	 * Once the shell is up, we stamp the editor slot divs (one per tab)
	 * into the editor mount and the iframe + status badge into the
	 * sandbox mount.  pict-section-code instances mount into the per-
	 * tab slots from there.
	 *
	 * Re-entrant: a second call after teardown rebuilds the shell on
	 * the same mount div.  PersistenceKey scopes the saved split size
	 * per-module so each playground remembers its own layout.
	 */
	_buildShell()
	{
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		let tmpMountEl = document.getElementById('Docuserve-Section-Playground-Shell-Mount');
		if (!tmpModal || typeof tmpModal.shell !== 'function' || !tmpMountEl)
		{
			// Shell isn't available — fall back to a static layout so the
			// playground still works (no resize/collapse) without the
			// section-modal dependency.
			tmpMountEl.innerHTML = ''
				+ '<div class="docuserve-section-playground-editor-mount" id="Docuserve-Section-Playground-Editor-Mount" style="height:55%;border-bottom:1px solid var(--theme-color-border-default,#DDD6CA)"></div>'
				+ '<div class="docuserve-section-playground-iframe-pane" id="Docuserve-Section-Playground-Iframe-Mount" style="height:45%"></div>';
			this._populateShellDestinations();
			return;
		}

		// Per-module persistence key so each module remembers its own
		// editor/sandbox split independently.
		let tmpPersistenceKey = 'docuserve-section-playground:' + this._scope.Group + '/' + this._scope.Module + ':split';

		this._shell = tmpModal.shell(tmpMountEl, { PersistenceKey: tmpPersistenceKey });

		// Bottom panel — the iframe sandbox.  Resizable + collapsible
		// (handled by the shell).  CSS at the top of this view widens
		// the collapse tab and centers it horizontally; the Title text
		// renders inside it as the always-visible label.
		this._shell.addPanel(
		{
			Hash: 'sandbox',
			Side: 'bottom',
			Mode: 'resizable',
			Size:    360,
			MinSize: 140,
			MaxSize: 1000,
			Title:   'Sandbox',
			ContentDestinationId: 'Docuserve-Section-Playground-Iframe-Mount'
		});

		// Center — the editor stack (one slot per tab; only the active
		// slot is display:flex).  No ContentView; we DOM-inject the
		// per-tab slot divs below.
		this._shell.center({ ContentDestinationId: 'Docuserve-Section-Playground-Editor-Mount' });

		this._populateShellDestinations();
	}

	/**
	 * Fill the shell's two destinations with their per-render content:
	 *   * editor mount → one slot div per editor (active tab has .active)
	 *   * sandbox mount → the iframe + the status badge
	 *
	 * Called from _buildShell on first mount AND from the static
	 * fallback layout when the shell isn't available.
	 */
	_populateShellDestinations()
	{
		// Editor slot divs — one per configured editor.  Tag the mount
		// with our flex-column class so the active slot fills the
		// shell's center area instead of collapsing to its content
		// height (pict-section-code itself has zero intrinsic height).
		let tmpEditorMount = document.getElementById('Docuserve-Section-Playground-Editor-Mount');
		if (tmpEditorMount)
		{
			tmpEditorMount.classList.add('docuserve-section-playground-editor-mount');
			let tmpSlotsHTML = '';
			for (let i = 0; i < this._editors.length; i++)
			{
				let tmpEd = this._editors[i];
				let tmpActive = (tmpEd.Hash === this._activeHash) ? ' active' : '';
				tmpSlotsHTML += '<div class="docuserve-section-playground-editor' + tmpActive + '"'
					+ ' id="Docuserve-Section-Playground-Editor-' + tmpEd.Hash + '"'
					+ ' data-editor-hash="' + tmpEd.Hash + '"></div>';
			}
			tmpEditorMount.innerHTML = tmpSlotsHTML;
		}

		// Iframe + status badge.  The status badge is absolute-positioned
		// inside the sandbox pane so it overlays the iframe.
		let tmpSandboxMount = document.getElementById('Docuserve-Section-Playground-Iframe-Mount');
		if (tmpSandboxMount)
		{
			tmpSandboxMount.classList.add('docuserve-section-playground-iframe-pane');
			tmpSandboxMount.innerHTML = ''
				+ '<iframe id="Docuserve-Section-Playground-Iframe"'
				+ ' class="docuserve-section-playground-iframe"'
				+ ' title="Section playground sandbox"'
				+ ' sandbox="allow-scripts allow-same-origin allow-modals allow-popups"></iframe>'
				+ '<div id="Docuserve-Section-Playground-Status" class="docuserve-section-playground-status">ready</div>';
		}
	}

	/**
	 * Render the layout + mount one pict-section-code instance per
	 * editor tab.  Each editor's view gets its own ViewIdentifier so
	 * pict.views[] stays distinct per tab.
	 */
	_mountAndRender()
	{
		// Tag the container so our flex CSS applies.
		let tmpContainer = document.getElementById('Docuserve-Content-Container');
		if (tmpContainer) { tmpContainer.classList.add('docuserve-section-playground-host'); }

		this._refreshEditorRecords();
		this.render();

		// Build the shell — center holds the editor stack, bottom panel
		// holds the iframe sandbox with a wider middle-tab collapse
		// affordance.  Persistence is scoped per-module so each
		// playground remembers its split independently.
		this._buildShell();

		// Mount editor views.  Each is a fresh pict-section-code subclass
		// that persists on change.
		let tmpSelf = this;
		for (let i = 0; i < this._editors.length; i++)
		{
			let tmpEd = this._editors[i];
			let tmpViewId = this._editorViewIdentifier(tmpEd.Hash);
			let tmpAddress = this._editorCodeAddress(tmpEd.Hash);
			let tmpDestId  = 'Docuserve-Section-Playground-Editor-' + tmpEd.Hash;

			// If a previous mount left a view around, dispose it first
			// so we don't double-mount inside the same destination.
			if (this.pict.views[tmpViewId])
			{
				try { delete this.pict.views[tmpViewId]; } catch (e) { /* */ }
				if (this.pict.servicesMap && this.pict.servicesMap.PictView)
				{
					try { delete this.pict.servicesMap.PictView[tmpViewId]; } catch (e) { /* */ }
				}
			}

			// pict-section-code needs Templates + Renderables wired to the
			// mount slot so its onAfterRender can find the destination.
			// We register a no-op container template per editor and tie
			// the renderable to the per-tab slot.
			let tmpTemplateHash = 'Section-Playground-CodeMount-' + tmpEd.Hash;
			let tmpEditorOpts = Object.assign({}, libPictSectionCode.default_configuration,
			{
				ViewIdentifier:            tmpViewId,
				DefaultDestinationAddress: '#' + tmpDestId,
				TargetElementAddress:      '#' + tmpDestId,
				Templates:
				[
					{ Hash: tmpTemplateHash, Template: '<!-- pict-section-code mount: ' + tmpEd.Hash + ' -->' }
				],
				Renderables:
				[
					{ RenderableHash: 'Section-Playground-CodeRenderable-' + tmpEd.Hash,
					  TemplateHash:   tmpTemplateHash,
					  DestinationAddress: '#' + tmpDestId }
				],
				Language:                  tmpEd.Language || 'json',
				ReadOnly:                  false,
				LineNumbers:               true,
				Tab:                       '\t',
				AddClosing:                true,
				CatchTab:                  true,
				DefaultCode:               tmpEd.Code,
				CodeDataAddress:           tmpAddress,
				// Defer render — we connect the CodeJar prototype first
				// (loaded from CDN in _loadCodeJar), then call render() on
				// each editor once.
				AutoRender:                false,
				RenderOnLoad:              false
			});

			// Subclass that persists on every change.
			let SectionPlaygroundEditor = class extends libPictSectionCode
			{
				onCodeChange(pCode)
				{
					super.onCodeChange(pCode);
					if (this._lsTimer) { clearTimeout(this._lsTimer); }
					let tmpEditorHash = this.options.ViewIdentifier.replace('Docuserve-Section-Playground-Editor-View-', '');
					this._lsTimer = setTimeout(() =>
					{
						this._lsTimer = null;
						try
						{
							let tmpView = this.fable.pict.views['Docuserve-Section-Playground'];
							let tmpKey  = tmpView && typeof tmpView._storageKey === 'function'
								? tmpView._storageKey(tmpEditorHash)
								: (_LocalStorageKeyPrefix + ':' + tmpEditorHash);
							window.localStorage.setItem(tmpKey, pCode);
							if (tmpView && typeof tmpView._setStatus === 'function')
							{
								tmpView._setStatus('saved', false);
							}
						}
						catch (pError) { /* quota or no LS — silent */ }
					}, 500);
				}
			};

			this.pict.addView(tmpViewId, tmpEditorOpts, SectionPlaygroundEditor);
		}

		// Lazy-load CodeJar from CDN, then connect + render each editor.
		// pict-section-code can't initialize without a CodeJar prototype.
		this._loadCodeJar().then(function (pCodeJar)
		{
			for (let n = 0; n < tmpSelf._editors.length; n++)
			{
				let tmpEd = tmpSelf._editors[n];
				let tmpEditorView = tmpSelf.pict.views[tmpSelf._editorViewIdentifier(tmpEd.Hash)];
				if (!tmpEditorView) { continue; }
				if (!tmpEditorView._codeJarPrototype)
				{
					tmpEditorView.connectCodeJarPrototype(pCodeJar);
				}
				try { tmpEditorView.render(); }
				catch (pError) { /* best effort */ }
			}
			tmpSelf._setStatus('press Run to render', false, 2500);
		}).catch(function (pError)
		{
			tmpSelf._setStatus('CodeJar failed to load — editors disabled', true, 6000);
		});
	}

	/**
	 * Dynamic-import CodeJar from jsDelivr.  Memoized.  Wrapped in
	 * `new Function('u','return import(u)')` so browserify doesn't try to
	 * rewrite the import() at build time.
	 */
	_loadCodeJar()
	{
		if (this._codeJarPromise) { return this._codeJarPromise; }
		this._codeJarPromise = new Function('u', 'return import(u)')(_CodeJarCDN)
			.then(function (pModule)
			{
				if (!pModule || typeof pModule.CodeJar !== 'function')
				{
					throw new Error('CodeJar export not found in module');
				}
				return pModule.CodeJar;
			});
		return this._codeJarPromise;
	}

	/**
	 * Read every editor's current text out of AppData (it's kept up to
	 * date by pict-section-code's CodeDataAddress wiring).  JSON-language
	 * editors are parsed and validated; others are returned verbatim.
	 *
	 * @throws Error on a parse failure — caller surfaces to the UI.
	 */
	_readAndValidateEditors()
	{
		let tmpOut = { manifest: undefined, pictConfig: undefined, appConfig: undefined, appData: undefined };
		for (let i = 0; i < this._editors.length; i++)
		{
			let tmpEd = this._editors[i];
			let tmpAddress = this._editorCodeAddress(tmpEd.Hash);
			let tmpRaw = this.pict.manifest.getValueByHash(this.pict.AppData, tmpAddress);
			if (typeof tmpRaw !== 'string') { tmpRaw = tmpEd.Code || ''; }

			let tmpValue;
			if ((tmpEd.Language || 'json').toLowerCase() === 'json')
			{
				if (tmpRaw.trim() === '')
				{
					tmpValue = {};
				}
				else
				{
					try { tmpValue = JSON.parse(tmpRaw); }
					catch (pError)
					{
						throw new Error('JSON parse error in "' + tmpEd.Label + '": ' + pError.message);
					}
				}
			}
			else
			{
				tmpValue = tmpRaw;
			}

			// Map editor hash to a known config slot, or carry through unchanged.
			if (tmpOut.hasOwnProperty(tmpEd.Hash))
			{
				tmpOut[tmpEd.Hash] = tmpValue;
			}
			else
			{
				tmpOut[tmpEd.Hash] = tmpValue;
			}
		}
		return tmpOut;
	}

	_setStatus(pMessage, pIsError, pAutoHideMs)
	{
		let tmpEl = document.getElementById('Docuserve-Section-Playground-Status');
		if (!tmpEl) return;
		tmpEl.textContent = pMessage;
		tmpEl.classList.add('show');
		if (pIsError) { tmpEl.classList.add('error'); }
		else { tmpEl.classList.remove('error'); }
		if (this._statusTimer) { clearTimeout(this._statusTimer); }
		let tmpDelay = (typeof pAutoHideMs === 'number') ? pAutoHideMs : 2500;
		this._statusTimer = setTimeout(function ()
		{
			tmpEl.classList.remove('show');
			tmpEl.classList.remove('error');
		}, tmpDelay);
	}

	_renderError(pMessage)
	{
		let tmpHTML = '<div class="docuserve-section-playground-emptystate">'
			+ '<div class="docuserve-section-playground-emptystate-title">Playground unavailable</div>'
			+ '<div>' + this._escape(pMessage) + '</div>'
			+ '</div>';
		this.pict.ContentAssignment.assignContent('#Docuserve-Content-Container', tmpHTML);
	}

	_escape(pText)
	{
		return String(pText || '').replace(/[&<>"']/g, function (pChar)
		{
			return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[pChar];
		});
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = DocuserveSectionPlaygroundView;
module.exports.default_configuration = _ViewConfiguration;
