const libPictContentView = require('pict-section-content');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Content",

	DefaultRenderable: "Docuserve-Content-Display",
	DefaultDestinationAddress: "#Docuserve-Content-Container",

	AutoRender: false,

	// The parent pict-section-content CSS must be included here because
	// pict-view's Object.assign replaces the CSS property entirely when
	// the child provides its own.  We cannot read the parent's
	// default_configuration.CSS at module scope because browserify's
	// module initialisation order does not guarantee it is populated yet.
	CSS: /*css*/`
		.pict-content {
			padding: 2em 3em;
			max-width: 900px;
			margin: 0 auto;
			color: var(--theme-color-text-primary, #2A241E);
		}
		.pict-content-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 200px;
			color: var(--theme-color-text-muted, #8A7F72);
			font-size: 1em;
		}
		.pict-content h1 {
			font-size: 2em;
			color: var(--theme-color-text-primary, #3D3229);
			border-bottom: 1px solid var(--theme-color-border-default, #DDD6CA);
			padding-bottom: 0.3em;
			margin-top: 0;
		}
		.pict-content h2 {
			font-size: 1.5em;
			color: var(--theme-color-text-primary, #3D3229);
			border-bottom: 1px solid var(--theme-color-border-light, #EAE3D8);
			padding-bottom: 0.25em;
			margin-top: 1.5em;
		}
		.pict-content h3 {
			font-size: 1.25em;
			color: var(--theme-color-text-primary, #3D3229);
			margin-top: 1.25em;
		}
		.pict-content h4, .pict-content h5, .pict-content h6 {
			color: var(--theme-color-text-secondary, #5E5549);
			margin-top: 1em;
		}
		.pict-content p {
			line-height: 1.7;
			color: var(--theme-color-text-primary, #2A241E);
			margin: 0.75em 0;
		}
		.pict-content a {
			color: var(--theme-color-brand-primary, #2E7D74);
			text-decoration: none;
		}
		.pict-content a:hover {
			text-decoration: underline;
		}
		/* Plain <pre> (no wrap) - rare; keep for safety */
		.pict-content pre {
			background: var(--theme-color-background-secondary, #F6F3EE);
			color: var(--theme-color-text-primary, #2A241E);
			padding: 1.25em;
			border-radius: 6px;
			border: 1px solid var(--theme-color-border-light, #E5DED1);
			overflow-x: auto;
			line-height: 1.5;
			font-size: 0.9em;
		}
		/* Inline code */
		.pict-content code {
			background: var(--theme-color-background-tertiary, #F0ECE4);
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: var(--theme-color-syntax-property, #9E3A50);
			font-family: 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
		}
		.pict-content pre code {
			background: none;
			padding: 0;
			color: inherit;
			font-size: inherit;
		}
		/* Fenced code block wrapper emitted by pict-section-content */
		.pict-content-code-wrap {
			position: relative;
			font-family: 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
			font-size: 14px;
			line-height: 1.5;
			border-radius: 6px;
			border: 1px solid var(--theme-color-border-light, #E5DED1);
			overflow: auto;
			margin: 1em 0;
			background: var(--theme-color-background-secondary, #F6F3EE);
		}
		.pict-content-code-wrap .pict-content-code-line-numbers {
			position: absolute;
			top: 0;
			left: 0;
			width: 40px;
			padding: 1.25em 0;
			text-align: right;
			background: var(--theme-color-background-tertiary, #EFEAE0);
			border-right: 1px solid var(--theme-color-border-default, #DDD6CA);
			color: var(--theme-color-text-muted, #A59986);
			font-family: inherit;
			font-size: inherit;
			line-height: inherit;
			user-select: none;
			pointer-events: none;
			box-sizing: border-box;
		}
		.pict-content-code-wrap .pict-content-code-line-numbers span {
			display: block;
			padding: 0 8px 0 0;
		}
		.pict-content-code-wrap pre {
			margin: 0;
			background: var(--theme-color-background-secondary, #F6F3EE);
			color: var(--theme-color-text-primary, #2A241E);
			padding: 1.25em 1.25em 1.25em 52px;
			border: none;
			border-radius: 0;
			overflow-x: auto;
			line-height: 1.5;
			font-size: inherit;
		}
		.pict-content-code-wrap pre code {
			background: none;
			padding: 0;
			color: inherit;
			font-size: inherit;
			font-family: inherit;
		}
		/* Syntax tokens — these rules must match the span classes emitted by
		   pict-section-code's highlighter.  Also apply without .pict-content-code-wrap
		   as a belt-and-suspenders for any <pre><code> not emitted from a fence. */
		.pict-content-code-wrap .keyword,
		.pict-content pre code .keyword { color: var(--theme-color-syntax-keyword, #A03472); }
		.pict-content-code-wrap .string,
		.pict-content pre code .string { color: var(--theme-color-syntax-string, #1A6640); }
		.pict-content-code-wrap .number,
		.pict-content pre code .number { color: var(--theme-color-syntax-number, #B25A00); }
		.pict-content-code-wrap .comment,
		.pict-content pre code .comment { color: var(--theme-color-syntax-comment, #8A7F72); font-style: italic; }
		.pict-content-code-wrap .operator,
		.pict-content pre code .operator { color: var(--theme-color-syntax-operator, #2E7D74); }
		.pict-content-code-wrap .punctuation,
		.pict-content pre code .punctuation { color: var(--theme-color-syntax-punctuation, #2A241E); }
		.pict-content-code-wrap .function-name,
		.pict-content pre code .function-name { color: var(--theme-color-syntax-function, #2A5DB0); }
		.pict-content-code-wrap .property,
		.pict-content pre code .property { color: var(--theme-color-syntax-property, #9E3A50); }
		.pict-content-code-wrap .tag,
		.pict-content pre code .tag { color: var(--theme-color-syntax-tag, #9E3A50); }
		.pict-content-code-wrap .attr-name,
		.pict-content pre code .attr-name { color: var(--theme-color-syntax-attrname, #B25A00); }
		.pict-content-code-wrap .attr-value,
		.pict-content pre code .attr-value { color: var(--theme-color-syntax-attrvalue, #1A6640); }
		.pict-content blockquote {
			border-left: 4px solid var(--theme-color-brand-primary, #2E7D74);
			margin: 1em 0;
			padding: 0.5em 1em;
			background: var(--theme-color-background-secondary, #F7F5F0);
			color: var(--theme-color-text-secondary, #5E5549);
		}
		.pict-content blockquote p {
			margin: 0.25em 0;
		}
		.pict-content ul, .pict-content ol {
			padding-left: 2em;
			line-height: 1.8;
		}
		.pict-content li {
			margin: 0.25em 0;
			color: var(--theme-color-text-primary, #2A241E);
		}
		.pict-content hr {
			border: none;
			border-top: 1px solid var(--theme-color-border-default, #DDD6CA);
			margin: 2em 0;
		}
		.pict-content table {
			width: 100%;
			border-collapse: collapse;
			margin: 1em 0;
		}
		.pict-content table th {
			background: var(--theme-color-background-tertiary, #F5F0E8);
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			padding: 0.6em 0.8em;
			text-align: left;
			font-weight: 600;
			color: var(--theme-color-text-primary, #3D3229);
		}
		.pict-content table td {
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			padding: 0.5em 0.8em;
			color: var(--theme-color-text-primary, #2A241E);
		}
		.pict-content table tr:nth-child(even) {
			background: var(--theme-color-background-secondary, #F9F6F0);
		}
		.pict-content img {
			max-width: 100%;
			height: auto;
		}
		.pict-content pre.mermaid {
			background: var(--theme-color-background-panel, #FFFFFF);
			color: var(--theme-color-text-primary, #2A241E);
			text-align: center;
			padding: 1em;
			border: 1px solid var(--theme-color-border-light, #EAE3D8);
		}
		/* Force dark text inside mermaid SVGs so diagrams stay readable
		   in dark mode (mermaid bg is always light). */
		.pict-content pre.mermaid text,
		.pict-content pre.mermaid .nodeLabel,
		.pict-content pre.mermaid .edgeLabel,
		.pict-content pre.mermaid .label,
		.pict-content pre.mermaid .cluster-label,
		.pict-content pre.mermaid span,
		.pict-content pre.mermaid foreignObject p,
		.pict-content pre.mermaid foreignObject div,
		.pict-content pre.mermaid foreignObject span {
			color: var(--theme-color-text-primary, #2A241E) !important;
			fill: var(--theme-color-text-primary, #2A241E) !important;
		}
		.pict-content pre.mermaid .edgePath .path {
			stroke: var(--theme-color-text-secondary, #5E5549) !important;
		}
		.pict-content pre.mermaid .arrowheadPath {
			fill: var(--theme-color-text-secondary, #5E5549) !important;
		}
		/* Dark-mode override for handcrafted mermaid flowchart diagrams that
		   bake per-node inline fill colors via 'style X fill:#...' directives
		   (the architecture / module docs use these to mark layer hierarchy
		   with Material pastels). Mermaid renders those as inline
		   style="fill:#..." SVG attributes — highest specificity, so neither
		   themeVariables nor unflagged CSS can reach them. In light mode the
		   pastels read fine; in dark mode the same light fills stamp a
		   high-contrast island onto the dark page with unreadable text.
		   Force the fills back to a theme background so dark-mode reads;
		   light mode is intentionally unmodified so the per-layer hierarchy
		   stays intact there. Sibling to the block-beta invert filter below:
		   block-beta diagrams need full inversion (their inner palette is
		   baked separately), flowcharts only need a fill swap. */
		.theme-dark .pict-content pre.mermaid .node rect,
		.theme-dark .pict-content pre.mermaid .node polygon,
		.theme-dark .pict-content pre.mermaid .node circle,
		.theme-dark .pict-content pre.mermaid .node ellipse,
		.theme-dark .pict-content pre.mermaid .node path,
		.theme-dark .pict-content pre.mermaid .cluster rect {
			fill:   var(--theme-color-background-tertiary, #2A241E) !important;
			stroke: var(--theme-color-border-default,      #5E5549) !important;
		}
		/* Mirror of the above for theme mode 'system' — when the user
		   hasn't explicitly picked light or dark, the theme provider
		   leaves <html> without .theme-light/.theme-dark and the CSS
		   variables follow prefers-color-scheme. The .theme-dark-prefixed
		   block above doesn't match in that case, so light pastels would
		   win again on dark OSes. Mirror the rule under the media query,
		   gated by :not(.theme-light) so an explicit light override on a
		   dark OS still wins. */
		@media (prefers-color-scheme: dark) {
			html:not(.theme-light) .pict-content pre.mermaid .node rect,
			html:not(.theme-light) .pict-content pre.mermaid .node polygon,
			html:not(.theme-light) .pict-content pre.mermaid .node circle,
			html:not(.theme-light) .pict-content pre.mermaid .node ellipse,
			html:not(.theme-light) .pict-content pre.mermaid .node path,
			html:not(.theme-light) .pict-content pre.mermaid .cluster rect {
				fill:   var(--theme-color-background-tertiary, #2A241E) !important;
				stroke: var(--theme-color-border-default,      #5E5549) !important;
			}
		}
		/* Mermaid 11's block-beta renderer ignores the themeVariables we
		   pass to mermaid.initialize() — it bakes its own multi-color
		   palette directly into each rect's inline SVG attributes.  In
		   light mode that palette is fine: Mermaid's pastel colors on a
		   light page have good contrast and visual hierarchy.  In dark
		   mode those same light-pastel fills with dark text appear as a
		   light-mode island stamped onto a dark page — poor contrast and
		   visually jarring.
		   Rather than collapsing the palette to a single theme color
		   (which loses the per-cluster identity the diagram author chose),
		   we invert the entire diagram with a CSS filter in dark mode.
		   The 0.92 factor avoids a harsh pure-white→pure-black flip; the
		   hue-rotate(180deg) compensates for the hue shift invert()
		   introduces, so red stays reddish, green stays greenish, etc.
		   Scoped via :has(g.block) so only block-beta diagrams get
		   filtered — flowchart / sequence / state diagrams already honor
		   themeVariables and render mode-correctly without inversion. */
		.theme-dark .pict-content pre.mermaid:has(g.block) {
			filter: invert(0.92) hue-rotate(180deg);
			background: transparent !important;
			border-color: transparent !important;
		}
		/* When the block-beta inversion is active, the global "force
		   text to theme-color-text-primary" rule above would set text
		   to the dark-mode text color (light cream), which the filter
		   then inverts to dark — unreadable against the now-dark fills.
		   Reverting lets Mermaid's natural light-mode text color (dark)
		   pass through the inversion, becoming light text in dark mode. */
		.theme-dark .pict-content pre.mermaid:has(g.block) text,
		.theme-dark .pict-content pre.mermaid:has(g.block) .nodeLabel,
		.theme-dark .pict-content pre.mermaid:has(g.block) .edgeLabel,
		.theme-dark .pict-content pre.mermaid:has(g.block) .label,
		.theme-dark .pict-content pre.mermaid:has(g.block) .cluster-label,
		.theme-dark .pict-content pre.mermaid:has(g.block) span,
		.theme-dark .pict-content pre.mermaid:has(g.block) foreignObject p,
		.theme-dark .pict-content pre.mermaid:has(g.block) foreignObject div,
		.theme-dark .pict-content pre.mermaid:has(g.block) foreignObject span {
			/* Force text to render DARK pre-filter so the dark-mode filter
			   inverts it to LIGHT on the now-dark inverted blocks.  Using
			   the theme's light-mode text-primary hex directly (not the
			   var() chain) because the chain would resolve to light cream
			   in dark mode, which the filter would then invert BACK to
			   dark — unreadable on the inverted dark blocks. */
			color: #3D3229 !important;
			fill:  #3D3229 !important;
		}
		/* Inner blocks (the .basic.label-container rects inside block-beta
		   diagrams, NOT the cluster wrappers) pick up mainBkg from the
		   themeVariables we pass to mermaid.initialize().  In dark mode
		   that's a dark color — which the SVG filter then inverts to
		   light gray, undoing the dark-mode-ification.  Force the inner
		   blocks to render with a fixed light fill so the inversion
		   produces dark cards in dark mode.  In light mode (no filter)
		   the white fill is effectively the same as Mermaid's default
		   light-theme block bg — so no visual change there. */
		.pict-content pre.mermaid:has(g.block) rect.basic.label-container:not(.cluster) {
			fill:   #FFFFFF !important;
			stroke: #6E6E6E !important;
		}
		.pict-content .pict-content-katex-display {
			text-align: center;
			margin: 1em 0;
			padding: 0.5em;
			overflow-x: auto;
		}
		.pict-content .pict-content-katex-inline {
			display: inline;
		}
		.docuserve-module-external-link {
			padding: 0.5em 0;
			margin-bottom: 0.5em;
			border-bottom: 1px solid var(--theme-color-border-light, #EAE3D8);
			font-size: 0.85em;
			text-align: right;
		}
		.docuserve-module-external-link a {
			color: var(--theme-color-brand-primary, #2E7D74);
			text-decoration: none;
		}
		.docuserve-module-external-link a:hover {
			text-decoration: underline;
		}
		.docuserve-not-found {
			text-align: center;
			padding: 3em 1em;
			color: var(--theme-color-text-secondary, #5E5549);
		}
		.docuserve-not-found h2 {
			color: var(--theme-color-text-muted, #8A7F72);
			font-size: 1.5em;
			border-bottom: none;
		}
		.docuserve-not-found code {
			background: var(--theme-color-background-tertiary, #F0ECE4);
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: var(--theme-color-syntax-property, #9E3A50);
		}

		/* Fullscreen viewer for images and mermaid diagrams (click-to-zoom) */
		.pict-content [data-fullscreen-source] {
			cursor: zoom-in;
			outline: 1px solid transparent;
			outline-offset: 3px;
			border-radius: 4px;
			transition: outline-color 0.15s ease;
		}
		.pict-content [data-fullscreen-source]:hover {
			outline-color: var(--theme-color-brand-primary, #2E7D74);
		}
		/* Code block container with hover-revealed action buttons */
		.pict-content-code-container {
			position: relative;
			display: flex;
			align-items: flex-start;
			gap: 8px;
			margin: 1em 0;
		}
		.pict-content-code-container > .pict-content-code-wrap {
			margin: 0;
			flex: 1 1 auto;
			min-width: 0;
		}
		.pict-content-code-actions {
			position: sticky;
			top: 64px;
			align-self: flex-start;
			display: flex;
			flex-direction: column;
			gap: 6px;
			flex: 0 0 auto;
			padding-top: 6px;
			opacity: 0;
			transform: translateX(-4px);
			transition: opacity 0.15s ease, transform 0.15s ease;
			pointer-events: none;
		}
		.pict-content-code-container:hover .pict-content-code-actions,
		.pict-content-code-container:focus-within .pict-content-code-actions {
			opacity: 1;
			transform: translateX(0);
			pointer-events: auto;
		}
		.pict-content-code-action-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 28px;
			height: 28px;
			padding: 0;
			background: var(--theme-color-background-panel, #FFFFFF);
			color: var(--theme-color-text-secondary, #5E5549);
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			border-radius: 6px;
			cursor: pointer;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
			transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
		}
		.pict-content-code-action-btn svg {
			display: block;
			width: 14px;
			height: 14px;
			stroke: currentColor;
			fill: none;
			stroke-width: 1.6;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
		.pict-content-code-action-btn:hover {
			background: var(--theme-color-brand-primary, #2E7D74);
			color: var(--theme-color-background-panel, #FFFFFF);
			border-color: var(--theme-color-brand-primary, #2E7D74);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
		}
		.pict-content-code-action-btn:focus-visible {
			outline: 2px solid var(--theme-color-brand-primary, #2E7D74);
			outline-offset: 2px;
		}
		.pict-content-code-action-btn.is-copied {
			background: var(--theme-color-brand-primary, #2E7D74);
			color: var(--theme-color-background-panel, #FFFFFF);
			border-color: var(--theme-color-brand-primary, #2E7D74);
		}
		.pict-content-code-action-btn.is-copy-failed {
			background: #B23A3A;
			color: var(--theme-color-background-panel, #FFFFFF);
			border-color: #B23A3A;
		}
		/* Try-in-playground button — appended to JS code blocks.  The
		   triangle is filled (vs. the other action icons which are
		   stroke-only) to read as a "play" affordance. */
		.docuserve-tryplay-btn svg polygon {
			fill: currentColor;
			stroke: none;
		}
		.docuserve-tryplay-btn svg {
			width: 12px;
			height: 12px;
		}
		.pict-fullscreen-overlay {
			position: fixed;
			inset: 0;
			z-index: 9999;
			display: flex;
			flex-direction: column;
			background: rgba(0, 0, 0, 0.62);
			backdrop-filter: blur(6px);
			-webkit-backdrop-filter: blur(6px);
			color: var(--theme-color-text-primary, #2A241E);
		}
		.pict-fullscreen-overlay[hidden] {
			display: none;
		}
		.pict-fullscreen-titlebar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1em;
			height: 48px;
			padding: 0 1em;
			background: var(--theme-color-background-panel, #FFFFFF);
			color: var(--theme-color-text-primary, #3D3229);
			border-bottom: 1px solid var(--theme-color-border-default, #DDD6CA);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
			flex: 0 0 auto;
		}
		.pict-fullscreen-title {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-size: 0.95em;
			font-weight: 600;
			letter-spacing: 0.01em;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--theme-color-text-primary, #3D3229);
		}
		.pict-fullscreen-controls {
			display: inline-flex;
			align-items: center;
			gap: 4px;
		}
		.pict-fullscreen-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			padding: 0;
			background: transparent;
			border: 1px solid transparent;
			border-radius: 6px;
			color: var(--theme-color-text-secondary, #5E5549);
			cursor: pointer;
			transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
		}
		.pict-fullscreen-btn svg {
			display: block;
			width: 16px;
			height: 16px;
			stroke: currentColor;
			fill: none;
			stroke-width: 1.75;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
		.pict-fullscreen-btn:hover {
			background: var(--theme-color-border-light, #EAE3D8);
			color: var(--theme-color-text-primary, #3D3229);
		}
		.pict-fullscreen-btn:focus-visible {
			outline: 2px solid var(--theme-color-brand-primary, #2E7D74);
			outline-offset: 2px;
		}
		.pict-fullscreen-close:hover {
			background: var(--theme-color-brand-primary, #2E7D74);
			color: var(--theme-color-background-panel, #FFFFFF);
		}
		.pict-fullscreen-stage {
			flex: 1 1 auto;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			padding: 1.5em;
			cursor: zoom-in;
			touch-action: none;
		}
		.pict-fullscreen-stage.is-zoomed {
			cursor: grab;
		}
		.pict-fullscreen-stage.is-panning {
			cursor: grabbing;
		}
		.pict-fullscreen-content {
			display: flex;
			align-items: center;
			justify-content: center;
			max-width: 100%;
			max-height: 100%;
			transform-origin: center center;
			transition: transform 0.05s linear;
			will-change: transform;
		}
		.pict-fullscreen-content > * {
			box-shadow: 0 12px 48px rgba(0, 0, 0, 0.45);
		}
		.pict-fullscreen-content .pict-fullscreen-img {
			max-width: 90vw;
			max-height: calc(100vh - 96px);
			width: auto;
			height: auto;
			object-fit: contain;
			background: var(--theme-color-background-panel, #FFFFFF);
			padding: 12px;
			border-radius: 6px;
		}
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg {
			width: min(90vw, 1400px);
			height: auto;
			max-height: calc(100vh - 96px);
			background: var(--theme-color-background-panel, #FFFFFF);
			color: var(--theme-color-text-primary, #2A241E);
			padding: 16px;
			border-radius: 6px;
		}
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg text,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg .nodeLabel,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg .edgeLabel,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg .label,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg span,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg foreignObject p,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg foreignObject div,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg foreignObject span {
			color: var(--theme-color-text-primary, #2A241E) !important;
			fill: var(--theme-color-text-primary, #2A241E) !important;
		}
		/* Same dark-mode fill/stroke override as for inline diagrams, but
		   scoped to the fullscreen-overlay clone — which lives under
		   <body>, NOT inside .pict-content, so the pre.mermaid-scoped
		   rules above don't reach it. */
		.theme-dark .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node rect,
		.theme-dark .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node polygon,
		.theme-dark .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node circle,
		.theme-dark .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node ellipse,
		.theme-dark .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node path,
		.theme-dark .pict-fullscreen-content .pict-fullscreen-mermaid-svg .cluster rect {
			fill:   var(--theme-color-background-tertiary, #2A241E) !important;
			stroke: var(--theme-color-border-default,      #5E5549) !important;
		}
		@media (prefers-color-scheme: dark) {
			html:not(.theme-light) .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node rect,
			html:not(.theme-light) .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node polygon,
			html:not(.theme-light) .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node circle,
			html:not(.theme-light) .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node ellipse,
			html:not(.theme-light) .pict-fullscreen-content .pict-fullscreen-mermaid-svg .node path,
			html:not(.theme-light) .pict-fullscreen-content .pict-fullscreen-mermaid-svg .cluster rect {
				fill:   var(--theme-color-background-tertiary, #2A241E) !important;
				stroke: var(--theme-color-border-default,      #5E5549) !important;
			}
		}
		.pict-fullscreen-content .pict-fullscreen-codewrap {
			max-width: 90vw;
			max-height: calc(100vh - 96px);
			margin: 0;
			overflow: auto;
			box-shadow: 0 12px 48px rgba(0, 0, 0, 0.45);
		}

		/* Bespoke pict-renderer-graph diagram theming.  Inlined diagram SVGs
		   (see _inlineDiagramSVGs) paint with var(--diagram-*); define those
		   tokens per theme so the diagrams follow light/dark like everything
		   else.  Mirrors the .theme-dark + prefers-color-scheme pattern the
		   mermaid rules above use. */
		.pict-content
		{
			--diagram-ink:        #1B1F23;
			--diagram-paper:      #FBF7EE;
			--diagram-accent:     #C9602F;
			--diagram-highlight:  #E8C547;
			--diagram-deemphasis: #8A7F72;
			--diagram-link:       #2E7D74;
		}
		.theme-dark .pict-content
		{
			--diagram-ink:        #E8E0D4;
			--diagram-paper:      #20262E;
			--diagram-accent:     #E8956A;
			--diagram-highlight:  #E8C547;
			--diagram-deemphasis: #9A8F80;
			--diagram-link:       #5FB3A8;
		}
		@media (prefers-color-scheme: dark)
		{
			html:not(.theme-light) .pict-content
			{
				--diagram-ink:        #E8E0D4;
				--diagram-paper:      #20262E;
				--diagram-accent:     #E8956A;
				--diagram-highlight:  #E8C547;
				--diagram-deemphasis: #9A8F80;
				--diagram-link:       #5FB3A8;
			}
		}
		.docuserve-inline-diagram
		{
			display: block;
			margin: 1.25em 0;
			text-align: center;
		}
		.docuserve-inline-diagram svg
		{
			max-width: 100%;
			height: auto;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Content-Template",
			Template: /*html*/`
<div class="pict-content" id="Docuserve-Content-Body">
	<div class="pict-content-loading">Loading documentation...</div>
</div>
`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Content-Display",
			TemplateHash: "Docuserve-Content-Template",
			DestinationAddress: "#Docuserve-Content-Container",
			RenderMethod: "replace"
		}
	]
};

class DocuserveContentView extends libPictContentView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	/**
	 * Display parsed HTML content in the content area.
	 *
	 * When viewing a module's documentation, prepends a link to the
	 * module's own GitHub Pages documentation site.
	 *
	 * @param {string} pHTMLContent - The HTML to display
	 */
	displayContent(pHTMLContent)
	{
		let tmpHTML = pHTMLContent;
		let tmpGroup = this.pict.AppData.Docuserve.CurrentGroup;
		let tmpModule = this.pict.AppData.Docuserve.CurrentModule;

		if (tmpGroup && tmpModule)
		{
			let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
			if (tmpDocProvider)
			{
				let tmpPagesURL = tmpDocProvider.resolveGitHubPagesURL(tmpGroup, tmpModule);
				if (tmpPagesURL)
				{
					tmpHTML = '<div class="docuserve-module-external-link">'
						+ '<a href="' + tmpPagesURL + '" target="_blank" rel="noopener">'
						+ '&#x2197; View ' + tmpModule + ' documentation site'
						+ '</a>'
						+ '</div>'
						+ tmpHTML;
				}
			}
		}

		super.displayContent(tmpHTML, 'Docuserve-Content-Body');

		// Scan the freshly rendered markdown for inline-widget markers
		// (e.g. `<div data-docuserve-playground="fable"></div>`) and
		// dispatch each to the matching view's `mountInto()` method.
		this._mountInlineWidgets();
	}

	/**
	 * Walk the rendered content for known inline-widget markers and
	 * delegate the mount to the matching docuserve view.  This is the
	 * MVP wedge for the eventual ```fable-example / ```pict-example
	 * fenced-code-block syntax — same plumbing, the markdown extension
	 * for fenced blocks will land later.
	 */
	_mountInlineWidgets()
	{
		// Scope the scan to the just-rendered content body so we don't
		// accidentally pick up markers elsewhere in the page chrome.
		let tmpBody = document.getElementById('Docuserve-Content-Body');
		if (!tmpBody) { return; }
		// Skip embeds that have already been mounted on a previous pass
		// (e.g., a markdown parser quirk emits two markers for the same
		// snippet, or displayContent fires twice in some lifecycle path).
		let tmpEmbeds = tmpBody.querySelectorAll('[data-docuserve-playground]:not([data-docuserve-mounted])');
		for (let i = 0; i < tmpEmbeds.length; i++)
		{
			let tmpEl   = tmpEmbeds[i];
			let tmpKind = tmpEl.getAttribute('data-docuserve-playground');
			let tmpView = null;
			if (tmpKind === 'fable')
			{
				tmpView = this.pict.views['Docuserve-Fable-Playground'];
			}
			// (future) `pict` once the Pict-Playground view lands.
			if (tmpView && typeof tmpView.mountInto === 'function')
			{
				tmpEl.setAttribute('data-docuserve-mounted', '1');
				tmpView.mountInto(tmpEl);
			}
		}

		// Add a "Try in Fable Playground" action button to every
		// JavaScript code block.  The button sits alongside the existing
		// Copy / Fullscreen buttons in the hover-revealed action strip.
		this._addPlaygroundButtonsToCodeBlocks();

		// Inline diagram SVGs so their var(--diagram-*) colors cascade from
		// the active theme instead of being isolated inside an <img>.
		this._inlineDiagramSVGs();
	}

	/**
	 * Replace `<img src="...svg">` in the rendered content with the SVG
	 * inlined into the DOM.  An `<img>` is style-isolated, so a diagram SVG
	 * whose colors are `var(--diagram-*)` cannot see the page's theme
	 * variables; inlining lets them cascade, which is what makes bespoke
	 * pict-renderer-graph diagrams follow light/dark like the rest of the
	 * docs.  Idempotent (data-docuserve-inlined); any fetch/parse failure
	 * leaves the original `<img>` untouched as a graceful fallback.
	 */
	_inlineDiagramSVGs()
	{
		let tmpBody = document.getElementById('Docuserve-Content-Body');
		if (!tmpBody) { return; }
		let tmpImages = tmpBody.querySelectorAll('img[src$=".svg"]:not([data-docuserve-inlined])');
		for (let i = 0; i < tmpImages.length; i++)
		{
			let tmpImage = tmpImages[i];
			// Mark first so a re-render mid-fetch doesn't double-process.
			tmpImage.setAttribute('data-docuserve-inlined', '1');
			let tmpSource = tmpImage.getAttribute('src');
			if (!tmpSource) { continue; }
			let tmpAlt = tmpImage.getAttribute('alt') || '';
			fetch(tmpSource)
				.then((pResponse) => (pResponse && pResponse.ok) ? pResponse.text() : null)
				.then((pSvgText) =>
				{
					if (!pSvgText || !tmpImage.parentNode) { return; }
					let tmpParsed = new DOMParser().parseFromString(pSvgText, 'image/svg+xml');
					let tmpSvgElement = tmpParsed && tmpParsed.documentElement;
					if (!tmpSvgElement || (String(tmpSvgElement.tagName).toLowerCase() !== 'svg')) { return; }
					let tmpImported = document.importNode(tmpSvgElement, true);
					tmpImported.setAttribute('role', 'img');
					if (tmpAlt) { tmpImported.setAttribute('aria-label', tmpAlt); }
					let tmpWrapper = document.createElement('span');
					tmpWrapper.className = 'docuserve-inline-diagram';
					tmpWrapper.appendChild(tmpImported);
					tmpImage.parentNode.replaceChild(tmpWrapper, tmpImage);
				})
				.catch(() => {});
		}
	}

	/**
	 * Scan the rendered content body for `<code class="language-javascript">`
	 * (and `language-js`) blocks and inject a "▶ Try in Fable Playground"
	 * action button into each one's existing
	 * `.pict-content-code-actions` container.  Clicking the button
	 * pipes the block's textContent into
	 * `Docuserve-Fable-Playground.loadCode()`, which slides the drawer
	 * up with the code preloaded.
	 *
	 * Containers are tagged with `data-tryplay-wired="true"` so re-scans
	 * (e.g., the user navigates away and back) skip already-wired
	 * blocks.
	 */
	_addPlaygroundButtonsToCodeBlocks()
	{
		let tmpBody = document.getElementById('Docuserve-Content-Body');
		if (!tmpBody) { return; }
		// Per-module opt-in: only inject the "Try in Playground" button
		// when the current module's _sidebar.md (or the root one in
		// standalone mode) contains a "Code Playground" entry.  Without
		// that opt-in, JS code blocks render with the standard Copy +
		// Fullscreen actions only — keeping the playground out of modules
		// that haven't been wired up to run in it yet.
		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		if (tmpDocProvider && typeof tmpDocProvider.isPlaygroundEnabled === 'function')
		{
			let tmpAppData = this.pict.AppData.Docuserve || {};
			if (!tmpDocProvider.isPlaygroundEnabled(tmpAppData.CurrentGroup, tmpAppData.CurrentModule))
			{
				return;
			}
		}
		let tmpContainers = tmpBody.querySelectorAll('.pict-content-code-container:not([data-tryplay-wired])');
		for (let i = 0; i < tmpContainers.length; i++)
		{
			let tmpContainer = tmpContainers[i];
			let tmpCodeEl = tmpContainer.querySelector('code.language-javascript, code.language-js');
			if (!tmpCodeEl) { continue; }
			let tmpActions = tmpContainer.querySelector('.pict-content-code-actions');
			if (!tmpActions) { continue; }
			let tmpBtn = document.createElement('button');
			tmpBtn.type = 'button';
			tmpBtn.className = 'pict-content-code-action-btn docuserve-tryplay-btn';
			tmpBtn.title = 'Try in Fable Playground';
			tmpBtn.setAttribute('aria-label', 'Try this code in the Fable Playground');
			tmpBtn.setAttribute('onclick', "_Pict.views['Docuserve-Content'].tryInPlayground(this)");
			tmpBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="5,3 13,8 5,13"></polygon></svg>';
			// Append (vs. insertBefore actions.firstChild) so the Try
			// button sits at the bottom of the strip — under Copy and
			// Fullscreen — keeping the existing muscle memory for those
			// two and giving Try its own visually-distinct slot.
			tmpActions.appendChild(tmpBtn);
			tmpContainer.setAttribute('data-tryplay-wired', 'true');
		}
	}

	/**
	 * Inline-onclick target for the per-block Try button.  Walks up
	 * from the clicked element to the code container, extracts the
	 * source from the adjacent `<code>` element, hands off to the
	 * playground.
	 *
	 * @param {HTMLElement} pButtonEl - The Try button that was clicked.
	 */
	tryInPlayground(pButtonEl)
	{
		if (!pButtonEl) { return; }
		let tmpContainer = pButtonEl.closest('.pict-content-code-container');
		if (!tmpContainer) { return; }
		let tmpCodeEl = tmpContainer.querySelector('code');
		if (!tmpCodeEl) { return; }
		let tmpPlayground = this.pict.views['Docuserve-Fable-Playground'];
		if (tmpPlayground && typeof tmpPlayground.loadCode === 'function')
		{
			tmpPlayground.loadCode(tmpCodeEl.textContent);
		}
	}

	/**
	 * Show a loading indicator.
	 */
	showLoading()
	{
		super.showLoading('Loading documentation...', 'Docuserve-Content-Body');
	}
}

module.exports = DocuserveContentView;

module.exports.default_configuration = _ViewConfiguration;
