const libPictView = require('pict-view');

/**
 * Docuserve-Layout — application chrome built on pict-section-modal's
 * shell() API.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ #Theme-TopBar  (top, fixed, 56px)                            │
 *   │   BrandMark + Docuserve-TopBar-Nav + Docuserve-TopBar-User   │
 *   ├────────┬─────────────────────────────────────────────────────┤
 *   │ #Doc-  │ #Docuserve-Content-Container  (center)              │
 *   │ userve │   - splash / content / search views render here     │
 *   │ -Side- │                                                     │
 *   │ bar-   │                                                     │
 *   │ Cont…  │                                                     │
 *   │ (left, │                                                     │
 *   │ resiz) │                                                     │
 *   └────────┴─────────────────────────────────────────────────────┘
 *
 * The legacy `data-theme="dark|light"` toggle, custom topbar markup, and
 * hand-rolled body flex layout are all retired here in favour of the
 * pict-section-theme + pict-section-modal stack.
 */

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Layout",

	DefaultRenderable: "Docuserve-Layout-Shell",
	DefaultDestinationAddress: "#Docuserve-Application-Container",

	AutoRender: false,

	CSS: /*css*/`
		/* Global resets — these used to live in css/docuserve.css.  Now
		   that docuserve ships its theming entirely through view CSSMap
		   (no external <link> required), the resets travel with the JS
		   bundle so consumers can't forget to load them. */
		*, *::before, *::after { box-sizing: border-box; }
		html, body
		{
			height: 100%;
			margin: 0;
			padding: 0;
			font-family: var(--theme-typography-family-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif);
			font-size: 16px;
			line-height: 1.5;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
		}
		body
		{
			background: var(--theme-color-background-primary, #FDFBF7);
			color:      var(--theme-color-text-primary,       #2A241E);
			transition: background-color 0.15s ease, color 0.15s ease;
		}
		::-webkit-scrollbar         { width: 8px; height: 8px; }
		::-webkit-scrollbar-track   { background: var(--theme-color-scrollbar-track, #F5F0E8); }
		::-webkit-scrollbar-thumb   { background: var(--theme-color-scrollbar-thumb, #D4CCBE); border-radius: 4px; }
		::-webkit-scrollbar-thumb:hover { background: var(--theme-color-scrollbar-hover, #B5AA9A); }
		/* height: 100% (not 100vh) — Theme-Scale applies CSS zoom on
		   <html>; vh units render against the un-zoomed viewport and
		   push panels off-screen at non-1.0 scale. */
		#Docuserve-Application-Container
		{
			height: 100%;
			min-height: 0;
			overflow: hidden;
		}
		.pict-modal-shell-host   { height: 100%; }
		.pict-modal-shell        { background: var(--theme-color-background-primary, #FDFBF7); }
		.pict-modal-shell-panel  { background: var(--theme-color-background-panel,   #FFFFFF); }
		.pict-modal-shell-center { background: var(--theme-color-background-primary, #FDFBF7); }

		/* Sidebar panel uses the secondary background so the chrome
		   (panel surface AND the collapse tab that pokes out of it) match
		   the inner #Docuserve-Sidebar-Container's secondary fill. Without
		   this the panel is white-cream while the inner is darker-cream,
		   and the collapse tab — which inherits its background from
		   --pict-modal-bg — looks like a foreign sliver hanging off the
		   wrong-colored panel. Overriding --pict-modal-bg also retints the
		   tab's merge-bar box-shadow so the join is invisible. */
		.pict-modal-shell-panel-left
		{
			--pict-modal-bg: var(--theme-color-background-secondary, #FAF7F1);
			background: var(--theme-color-background-secondary, #FAF7F1);
		}

		/* Center workspace — content / splash / search views write into
		   #Docuserve-Content-Container which the shell provisions as the
		   center destination. */
		#Docuserve-Content-Container
		{
			height: 100%;
			min-height: 0;
			overflow-y: auto;
		}

		/* The Sidebar view writes into the panel's destination
		   (#Docuserve-Sidebar-Container).  Its own CSS lives in
		   PictView-Docuserve-Sidebar — here we just guarantee the panel
		   wrap is scrollable and themed. */
		#Docuserve-Sidebar-Container
		{
			height: 100%;
			min-height: 0;
			overflow-y: auto;
			background: var(--theme-color-background-secondary, #FAF7F1);
		}

		/* Playground panel suppression — the bottom drawer (and its
		   collapsed tab strip) only takes layout space on pages that
		   have opted into the playground via a "Code Playground"
		   entry in their module's _sidebar.md.  Everywhere else we
		   hide the panel entirely so the doc content gets the full
		   vertical area.  The class is toggled by
		   setPlaygroundEnabled() on each navigation. */
		.docuserve-playground-disabled .pict-modal-shell-center > .pict-modal-shell-panel-bottom
		{
			display: none !important;
		}

		/* Kill the height transition on the playground drawer.
		   pict-section-modal ships a 0.14s height transition on every
		   shell panel for smooth resize handoffs, but when the play
		   button mounts the CodeJar editor mid-expand the synchronous
		   innerHTML rewrite races the transition and the panel gets
		   stuck at its pre-transition size.  Snapping the resize
		   avoids the race and the user never sees the in-between
		   frames anyway. */
		.pict-modal-shell-center > .pict-modal-shell-panel-bottom
		{
			transition: none !important;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Layout-Shell-Template",
			// Minimal template — the shell owns the real DOM. The mount
			// div is where the shell attaches; everything else (topbar,
			// sidebar, center) is built by shell.addPanel + shell.center.
			Template: /*html*/`<div id="Docuserve-Layout-Mount" style="height:100%"></div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Layout-Shell",
			TemplateHash: "Docuserve-Layout-Shell-Template",
			DestinationAddress: "#Docuserve-Application-Container",
			RenderMethod: "replace"
		}
	]
};

class DocuserveLayoutView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this._shell = null;
		this._shellPanelsBuilt = false;
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();

		if (!this._shellPanelsBuilt)
		{
			this._buildShell();
			this._shellPanelsBuilt = true;
		}

		// Resolve the current hash on initial load — splash / content /
		// search views render into the shell-managed center destination.
		this.pict.PictApplication.resolveHash();

		this._wireHashChangeListener();

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_buildShell()
	{
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		if (!tmpModal || typeof tmpModal.shell !== 'function')
		{
			if (this.log && this.log.warn) { this.log.warn('Docuserve-Layout: pict-section-modal.shell not available'); }
			return;
		}

		let tmpMount = document.getElementById('Docuserve-Layout-Mount');
		if (!tmpMount)
		{
			if (this.log && this.log.warn) { this.log.warn('Docuserve-Layout: #Docuserve-Layout-Mount missing'); }
			return;
		}

		this._shell = tmpModal.shell(tmpMount, { PersistenceKey: 'docuserve-shell' });

		// Top — Theme-TopBar (BrandMark + NavView + UserView slots; Theme-Button on the far right).
		this._shell.addPanel(
		{
			Hash: 'topbar',
			Side: 'top',
			Mode: 'fixed',
			Size: 56,
			ContentDestinationId: 'Theme-TopBar',
			ContentView: 'Theme-TopBar'
		});

		// Left — sidebar.  Resizable + collapsible + responsive-drawer
		// below 900px wide (the sidebar flips to a top drawer above the
		// content area when the viewport gets narrow).
		this._shell.addPanel(
		{
			Hash: 'sidebar',
			Side: 'left',
			Mode: 'resizable',
			Size: 280,
			MinSize: 200,
			MaxSize: 500,
			Title: 'Documentation',
			ContentDestinationId: 'Docuserve-Sidebar-Container',
			ContentView: 'Docuserve-Sidebar',
			ResponsiveDrawer: 900
		});

		// Bottom — playground drawer.  Scope: 'center' mounts the panel
		// inside the center column instead of pict-section-modal's
		// full-width bottom row, so the drawer aligns with the content
		// area and doesn't cover the sidebar.  Collapsed by default so
		// the doc content sits on the full viewport; the 'Playground'
		// tab strip shows at the bottom of the content area.  Click it
		// (or call `expandPlayground()` from anywhere) to slide the
		// drawer up.  The playground view mounts itself into the
		// destination div on first expand via the OnExpand callback.
		this._shell.addPanel(
		{
			Hash: 'playground-drawer',
			Side: 'bottom',
			Scope: 'center',
			Mode: 'resizable',
			Size: 420,
			// MinSize chosen so the per-pane headers + ~14 editor lines
			// fit at the smallest drag.  Below this the editor becomes
			// unusable and the user has to expand to do anything.
			MinSize: 320,
			MaxSize: 800,
			Collapsed: true,
			Title: 'JS Playground',
			ContentDestinationId: 'Docuserve-Playground-Drawer-Content',
			OnExpand: () => { this._onPlaygroundDrawerExpand(); }
		});

		// Center — the content area where splash / content / search render.
		this._shell.center({ ContentDestinationId: 'Docuserve-Content-Container' });

		// Reconcile initial panel state with the playground content.
		// pict-section-modal's Panel ctor respects persisted state
		// (localStorage), so a panel that the user left expanded on a
		// previous visit returns expanded — but OnExpand only fires on
		// the collapsed→expanded transition, never on the initial render.
		// Result: an empty drawer is open on page load until the user
		// manually collapses + reopens it.  Mount the playground here
		// (matching what OnExpand would have done) so the persisted-
		// expanded case lands with content already in the drawer.
		let tmpPanel = this._shell.getPanel('playground-drawer');
		if (tmpPanel && !tmpPanel.Collapsed)
		{
			this._onPlaygroundDrawerExpand();
		}
	}

	/**
	 * Fires when the playground drawer first expands.  Lazy-mounts the
	 * Fable-Playground view into the drawer's content destination.
	 * Subsequent expand/collapse cycles re-use the existing mount; the
	 * DOM is just visually hidden / shown by the shell's collapse chrome.
	 */
	_onPlaygroundDrawerExpand()
	{
		if (this._playgroundMounted) { return; }
		let tmpView = this.pict.views['Docuserve-Fable-Playground'];
		if (tmpView && typeof tmpView.mountIntoDrawer === 'function')
		{
			tmpView.mountIntoDrawer();
			this._playgroundMounted = true;
		}
	}

	_wireHashChangeListener()
	{
		if (this._hashListenerBound) { return; }
		this._hashListenerBound = true;
		let tmpSelf = this;
		// hashchange is a window-level event with no inline-handler equivalent;
		// pict CLAUDE.md documents this as a legitimate exception to the
		// "no addEventListener" rule.
		window.addEventListener('hashchange', () =>
		{
			tmpSelf.pict.PictApplication.resolveHash();
		});
	}

	// ─────────────────────────────────────────────
	//  Public panel accessors (used by views that need to toggle the
	//  sidebar — e.g. mobile menu buttons).
	// ─────────────────────────────────────────────

	getSidebarPanel() { return this._shell ? this._shell.getPanel('sidebar') : null; }

	toggleSidebar()
	{
		let tmpPanel = this.getSidebarPanel();
		if (tmpPanel) { tmpPanel.toggle(); }
	}

	// ─────────────────────────────────────────────
	//  Playground drawer accessors.
	//
	//  Doc-page buttons (e.g., "Open playground" in fable-playground.md)
	//  and the application's hash router (e.g., #/playground/fable) call
	//  expandPlayground() to slide the drawer up; users collapse it back
	//  by clicking the panel's chrome.
	// ─────────────────────────────────────────────

	getPlaygroundPanel() { return this._shell ? this._shell.getPanel('playground-drawer') : null; }

	/**
	 * Show/hide the bottom playground drawer based on the current
	 * module's opt-in state.  When pEnabled is false the panel is
	 * suppressed via the `docuserve-playground-disabled` class — the
	 * panel object stays in the shell so expanding it later (via
	 * `expandPlayground()` from a "Try in Playground" button on a
	 * playground-enabled page) still works, but the collapsed tab
	 * strip stops occupying the bottom 24px of the center column.
	 *
	 * Idempotent — safe to call on every navigation.
	 *
	 * @param {boolean} pEnabled
	 */
	setPlaygroundEnabled(pEnabled)
	{
		let tmpMount = document.getElementById('Docuserve-Layout-Mount');
		if (!tmpMount) { return; }
		if (pEnabled) { tmpMount.classList.remove('docuserve-playground-disabled'); }
		else
		{
			tmpMount.classList.add('docuserve-playground-disabled');
			// If the user previously left the panel expanded, force it
			// collapsed when navigating into a non-opted-in module so
			// nothing peeks through on the next module visit.
			let tmpPanel = this.getPlaygroundPanel();
			if (tmpPanel && typeof tmpPanel.collapse === 'function') { tmpPanel.collapse(); }
		}
	}

	expandPlayground()
	{
		let tmpPanel = this.getPlaygroundPanel();
		if (tmpPanel && typeof tmpPanel.expand === 'function') { tmpPanel.expand(); }
	}

	/**
	 * Set the playground drawer's tab-strip label.  pict-section-modal
	 * builds the collapse-tab's innerHTML once at construction time and
	 * exposes no setter, so we reach into the panel's element directly
	 * and rewrite the title span.  Idempotent — safe to call on every
	 * navigation.
	 *
	 * @param {string} pTitle - The label to show on the collapsed tab.
	 */
	setPlaygroundTitle(pTitle)
	{
		let tmpPanel = this.getPlaygroundPanel();
		if (!tmpPanel || !tmpPanel.El) { return; }
		let tmpClean = (typeof pTitle === 'string' && pTitle.length > 0) ? pTitle : 'JS Playground';
		tmpPanel.Title = tmpClean;
		if (tmpPanel._collapseTab)
		{
			tmpPanel._collapseTab.setAttribute('aria-label', 'Toggle ' + tmpClean);
			tmpPanel._collapseTab.title = tmpClean;
			let tmpTitleEl = tmpPanel._collapseTab.querySelector('.pict-modal-shell-panel-collapse-tab-title');
			if (tmpTitleEl) { tmpTitleEl.textContent = tmpClean; }
		}
	}

	collapsePlayground()
	{
		let tmpPanel = this.getPlaygroundPanel();
		if (tmpPanel && typeof tmpPanel.collapse === 'function') { tmpPanel.collapse(); }
	}

	togglePlayground()
	{
		let tmpPanel = this.getPlaygroundPanel();
		if (tmpPanel && typeof tmpPanel.toggle === 'function') { tmpPanel.toggle(); }
	}
}

module.exports = DocuserveLayoutView;
module.exports.default_configuration = _ViewConfiguration;
