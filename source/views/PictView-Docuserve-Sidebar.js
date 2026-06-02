const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Sidebar",

	DefaultRenderable: "Docuserve-Sidebar-Content",
	DefaultDestinationAddress: "#Docuserve-Sidebar-Container",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-sidebar {
			display: flex;
			flex-direction: column;
			background: var(--theme-color-background-secondary, #FAF7F1);
			border-right: 1px solid var(--theme-color-border-default, #DDD6CA);
			padding: 1em 0;
			padding-top: 0;
			min-height: 100%;
			position: relative;
			transition: background-color 0.15s ease;
		}
		.docuserve-sidebar-header {
			display: none;
			justify-content: flex-end;
			padding: 0.4em 0.5em 0;
		}
		/* The "X" close button is only useful when the sidebar is acting
		   as a responsive drawer (narrow viewports where the panel slid
		   in over the content area). In docked desktop mode the
		   pict-section-modal collapse tab on the panel's outer edge is
		   the canonical collapse affordance — a second X inside the
		   panel competes with it and looks messy. Show the X only in
		   drawer mode. */
		.pict-modal-shell-panel-drawer .docuserve-sidebar-header {
			display: flex;
		}
		.docuserve-sidebar-close {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: none;
			border: none;
			color: var(--theme-color-text-muted, #8A7F72);
			font-size: 1.1em;
			cursor: pointer;
			padding: 0.2em 0.4em;
			line-height: 1;
		}
		.docuserve-sidebar-close:hover {
			color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-sidebar-search {
			padding: 0 1em 1em 1em;
			border-bottom: 1px solid var(--theme-color-border-light, #E5DED1);
			margin-bottom: 0.5em;
		}
		.docuserve-sidebar-search input {
			width: 100%;
			padding: 0.5em 0.75em;
			background: var(--theme-color-background-panel, #FFFFFF);
			color: var(--theme-color-text-primary, #2A241E);
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			border-radius: 4px;
			font-size: 0.85em;
			outline: none;
			box-sizing: border-box;
		}
		.docuserve-sidebar-search input:focus {
			border-color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-sidebar-search-results {
			margin-top: 0.5em;
		}
		.docuserve-sidebar-search-results a {
			display: block;
			padding: 0.4em 0.5em;
			color: var(--theme-color-text-primary, #423D37);
			text-decoration: none;
			font-size: 0.82em;
			border-radius: 3px;
			transition: background-color 0.1s;
			cursor: pointer;
		}
		.docuserve-sidebar-search-results a:hover {
			background-color: var(--theme-color-background-hover, #EAE3D8);
			color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-sidebar-search-result-title {
			font-weight: 600;
			color: var(--theme-color-text-primary, #3D3229);
		}
		.docuserve-sidebar-search-results a:hover .docuserve-sidebar-search-result-title {
			color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-sidebar-search-result-meta {
			font-size: 0.9em;
			color: var(--theme-color-text-muted, #8A7F72);
		}
		.docuserve-sidebar-search-all {
			display: block;
			padding: 0.4em 0.5em;
			font-size: 0.82em;
			color: var(--theme-color-brand-primary, #2E7D74);
			text-decoration: none;
			font-weight: 600;
			cursor: pointer;
			border-top: 1px solid var(--theme-color-border-light, #E5DED1);
			margin-top: 0.25em;
			padding-top: 0.5em;
		}
		.docuserve-sidebar-search-all:hover {
			text-decoration: underline;
		}
		.docuserve-sidebar-search-empty {
			padding: 0.4em 0.5em;
			font-size: 0.82em;
			color: var(--theme-color-text-muted, #8A7F72);
		}
		.docuserve-sidebar-home {
			padding: 0.5em 1.25em;
			font-weight: 600;
			font-size: 0.85em;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.docuserve-sidebar-home a {
			color: var(--theme-color-text-secondary, #5E5549);
			text-decoration: none;
			cursor: pointer;
			user-select: none;
		}
		.docuserve-sidebar-home a:hover {
			color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-sidebar-group {
			margin-top: 0.25em;
		}
		.docuserve-sidebar-group-title {
			display: block;
			padding: 0.5em 1.25em;
			font-weight: 600;
			font-size: 0.85em;
			color: var(--theme-color-text-primary, #3D3229);
			text-decoration: none;
			text-transform: uppercase;
			letter-spacing: 0.03em;
			cursor: pointer;
			user-select: none;
			transition: background-color 0.1s, color 0.1s;
		}
		.docuserve-sidebar-group-title:hover {
			color: var(--theme-color-brand-primary, #2E7D74);
			background-color: var(--theme-color-background-hover, #EAE3D8);
		}
		a.docuserve-sidebar-group-title.active {
			color: var(--theme-color-brand-primary, #2E7D74);
			background-color: var(--theme-color-background-tertiary, #E5DED1);
		}
		.docuserve-sidebar-modules {
			list-style: none;
			margin: 0;
			padding: 0;
		}
		.docuserve-sidebar-modules li {
			padding: 0;
		}
		.docuserve-sidebar-modules a {
			display: block;
			padding: 0.3em 1.25em 0.3em 2em;
			color: var(--theme-color-text-secondary, #5E5549);
			text-decoration: none;
			font-size: 0.85em;
			transition: background-color 0.1s, color 0.1s;
			cursor: pointer;
		}
		.docuserve-sidebar-modules a:hover {
			background-color: var(--theme-color-background-hover, #EAE3D8);
			color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-sidebar-modules a.active {
			color: var(--theme-color-brand-primary, #2E7D74);
			font-weight: 600;
			background-color: var(--theme-color-background-tertiary, #E5DED1);
		}
		.docuserve-sidebar-modules .no-docs {
			display: block;
			padding: 0.3em 1.25em 0.3em 2em;
			color: var(--theme-color-text-muted, #8A7F72);
			font-size: 0.85em;
		}
		.docuserve-sidebar-module-nav {
			border-top: 1px solid var(--theme-color-border-light, #E5DED1);
			margin-top: 0.5em;
			padding-top: 0.5em;
		}
		.docuserve-sidebar-module-nav:empty {
			display: none;
		}
		.docuserve-sidebar-module-nav-section {
			padding: 0.4em 1.25em;
			font-weight: 600;
			font-size: 0.8em;
			color: var(--theme-color-text-muted, #8A7F72);
			text-transform: uppercase;
			letter-spacing: 0.02em;
		}
		.docuserve-sidebar-module-nav a {
			display: block;
			padding: 0.25em 1.25em 0.25em 2.25em;
			color: var(--theme-color-text-secondary, #5E5549);
			text-decoration: none;
			font-size: 0.82em;
			transition: background-color 0.1s, color 0.1s;
			cursor: pointer;
		}
		.docuserve-sidebar-module-nav a:hover {
			background-color: var(--theme-color-background-hover, #EAE3D8);
			color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-sidebar-module-nav a.active {
			color: var(--theme-color-brand-primary, #2E7D74);
			font-weight: 600;
			background-color: var(--theme-color-background-tertiary, #E5DED1);
		}
		.docuserve-sidebar-footer {
			margin-top: auto;
			padding: 0.9em 1.25em 1em 1.25em;
			border-top: 1px solid var(--theme-color-border-light, #E5DED1);
		}
		.docuserve-sidebar-footer:empty {
			display: none;
		}
		.docuserve-version-placard {
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			line-height: 1.35;
		}
		.docuserve-version-name {
			font-size: 0.78em;
			font-weight: 600;
			color: var(--theme-color-text-secondary, #5E5549);
			letter-spacing: 0.02em;
		}
		.docuserve-version-number {
			font-size: 0.82em;
			font-weight: 500;
			color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-version-meta {
			font-size: 0.7em;
			color: var(--theme-color-text-muted, #8A7F72);
			margin-top: 0.15em;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Sidebar-Template",
			Template: /*html*/`
<div class="docuserve-sidebar">
	<div class="docuserve-sidebar-header">
		<button class="docuserve-sidebar-close" onclick="{~P~}.views['Docuserve-Sidebar'].toggleSidebar()" aria-label="Close sidebar">{~I:Close~}</button>
	</div>
	{~TS:Docuserve-Sidebar-Search-Slot-Template:AppData.Docuserve.SidebarSearchSlot~}
	<div class="docuserve-sidebar-home">
		<a onclick="{~P~}.PictApplication.navigateTo('/Home')">Home</a>
	</div>
	<div id="Docuserve-Sidebar-Groups">
		{~TS:Docuserve-Sidebar-Group-Template:AppData.Docuserve.SidebarGroupRecords~}
	</div>
	<div id="Docuserve-Sidebar-ModuleNav" class="docuserve-sidebar-module-nav">
		{~TS:Docuserve-Sidebar-ModuleNav-Section-Template:AppData.Docuserve.ModuleNavSections~}
	</div>
	<div class="docuserve-sidebar-footer">
		{~TS:Docuserve-Sidebar-Footer-Template:AppData.Docuserve.FooterSlot~}
	</div>
</div>
`
		},
		{
			Hash: "Docuserve-Sidebar-Search-Slot-Template",
			Template: /*html*/`<div id="Docuserve-Sidebar-Search" class="docuserve-sidebar-search">
	<input type="text" placeholder="Search docs..." id="Docuserve-Sidebar-Search-Input" oninput="{~P~}.views['Docuserve-Sidebar'].onSidebarSearchInput(this.value)">
	<div id="Docuserve-Sidebar-Search-Results" class="docuserve-sidebar-search-results"></div>
</div>`
		},
		{
			Hash: "Docuserve-Sidebar-Group-Template",
			Template: /*html*/`<div class="docuserve-sidebar-group">
	{~TS:Docuserve-Sidebar-Group-Title-Link-Template:Record.TitleLink~}{~TS:Docuserve-Sidebar-Group-Title-Plain-Template:Record.TitlePlain~}
	<ul class="docuserve-sidebar-modules">
		{~TS:Docuserve-Sidebar-Module-Doc-Template:Record.Modules~}
	</ul>
</div>`
		},
		{
			Hash: "Docuserve-Sidebar-Group-Title-Link-Template",
			Template: /*html*/`<a class="docuserve-sidebar-group-title{~D:Record.ActiveClass~}" href="{~D:Record.Route~}">{~D:Record.Name~}</a>`
		},
		{
			Hash: "Docuserve-Sidebar-Group-Title-Plain-Template",
			Template: /*html*/`<div class="docuserve-sidebar-group-title">{~D:Record.Name~}</div>`
		},
		{
			Hash: "Docuserve-Sidebar-Module-Doc-Template",
			Template: /*html*/`<li>{~TS:Docuserve-Sidebar-Module-Link-Template:Record.LinkSlot~}{~TS:Docuserve-Sidebar-Module-NoDoc-Template:Record.NoDocSlot~}</li>`
		},
		{
			Hash: "Docuserve-Sidebar-Module-Link-Template",
			Template: /*html*/`<a class="{~D:Record.ActiveClass~}" href="{~D:Record.Route~}">{~D:Record.Name~}</a>`
		},
		{
			Hash: "Docuserve-Sidebar-Module-NoDoc-Template",
			Template: /*html*/`<span class="no-docs">{~D:Record.Name~}</span>`
		},
		{
			Hash: "Docuserve-Sidebar-ModuleNav-Section-Template",
			Template: /*html*/`{~TS:Docuserve-Sidebar-ModuleNav-SectionTitle-Template:Record.TitleSlot~}{~TS:Docuserve-Sidebar-ModuleNav-Item-Template:Record.Items~}`
		},
		{
			Hash: "Docuserve-Sidebar-ModuleNav-SectionTitle-Template",
			Template: /*html*/`<div class="docuserve-sidebar-module-nav-section">{~D:Record.Title~}</div>`
		},
		{
			Hash: "Docuserve-Sidebar-ModuleNav-Item-Template",
			Template: /*html*/`<a class="{~D:Record.ActiveClass~}" href="{~D:Record.Route~}">{~D:Record.Title~}</a>`
		},
		{
			Hash: "Docuserve-Sidebar-Footer-Template",
			Template: /*html*/`<div class="docuserve-version-placard">
	{~TS:Docuserve-Sidebar-Footer-Name-Template:Record.NameSlot~}
	<div class="docuserve-version-number">v{~D:Record.Version~}</div>
	{~TS:Docuserve-Sidebar-Footer-Meta-Template:Record.MetaSlot~}
</div>`
		},
		{
			Hash: "Docuserve-Sidebar-Footer-Name-Template",
			Template: /*html*/`<div class="docuserve-version-name">{~D:Record.Name~}</div>`
		},
		{
			Hash: "Docuserve-Sidebar-Footer-Meta-Template",
			Template: /*html*/`<div class="docuserve-version-meta">{~D:Record.Meta~}</div>`
		},
		{
			Hash: "Docuserve-Sidebar-Search-ResultsBody-Template",
			Template: /*html*/`{~TS:Docuserve-Sidebar-Search-Result-Template:AppData.Docuserve.SidebarSearchResults~}{~TS:Docuserve-Sidebar-Search-Overflow-Template:AppData.Docuserve.SidebarSearchOverflow~}{~TS:Docuserve-Sidebar-Search-Empty-Template:AppData.Docuserve.SidebarSearchEmpty~}`
		},
		{
			Hash: "Docuserve-Sidebar-Search-Result-Template",
			Template: /*html*/`<a href="{~D:Record.Route~}">
	<div class="docuserve-sidebar-search-result-title">{~D:Record.Title~}</div>
	{~TS:Docuserve-Sidebar-Search-Result-Meta-Template:Record.MetaSlot~}
</a>`
		},
		{
			Hash: "Docuserve-Sidebar-Search-Result-Meta-Template",
			Template: /*html*/`<div class="docuserve-sidebar-search-result-meta">{~D:Record.Meta~}</div>`
		},
		{
			Hash: "Docuserve-Sidebar-Search-Overflow-Template",
			Template: /*html*/`<a class="docuserve-sidebar-search-all" href="#/search/{~D:Record.EncodedQuery~}">See all {~D:Record.TotalCount~} results</a>`
		},
		{
			Hash: "Docuserve-Sidebar-Search-Empty-Template",
			Template: /*html*/`<div class="docuserve-sidebar-search-empty">No results found.</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Sidebar-Content",
			TemplateHash: "Docuserve-Sidebar-Template",
			DestinationAddress: "#Docuserve-Sidebar-Container",
			RenderMethod: "replace"
		}
	]
};

class DocusserveSidebarView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._SidebarSearchDebounceTimer = null;
	}

	onBeforeRender(pRenderable)
	{
		// Derive every template-iteration record from raw AppData state.
		// Each refresh writes a single AppData address that drives one
		// {~TS:~} tag in the template tree.  Doing this here keeps the
		// public surface tiny — callers just set the navigation state
		// and call render(), and every derived field updates atomically.
		this._refreshSearchSlot();
		this._refreshFooterSlot();
		this._refreshSidebarGroupRecords();
		this._refreshModuleNavSections();

		return super.onBeforeRender(pRenderable);
	}

	// ─────────────────────────────────────────────
	//  Public API consumed by the application.
	//
	//  These are thin render-triggers — the actual derivation runs in
	//  onBeforeRender.  Kept as named methods for API back-compat with
	//  consumers that called them directly on the previous version.
	// ─────────────────────────────────────────────

	renderSidebarGroups()    { this.render(); }
	renderModuleNav()        { this.render(); }
	clearModuleNav()         { this.render(); }

	/**
	 * Inline handler for the sidebar search input.  Debounces the live
	 * search dispatch so we don't run the lunr index on every keystroke.
	 *
	 * @param {string} pValue - The current value of the input
	 */
	onSidebarSearchInput(pValue)
	{
		if (this._SidebarSearchDebounceTimer)
		{
			clearTimeout(this._SidebarSearchDebounceTimer);
		}
		this._SidebarSearchDebounceTimer = setTimeout(() =>
		{
			this.performSidebarSearch(pValue);
		}, 250);
	}

	/**
	 * Run a sidebar search and update the results region.  Top 8 results
	 * become live links; if there are more, an overflow row links to the
	 * full search page.  Empty-string queries clear the results.
	 *
	 * Updates AppData and re-renders only the search-results destination
	 * so the typing focus is preserved.
	 *
	 * @param {string} pQuery - The search query
	 */
	performSidebarSearch(pQuery)
	{
		this._refreshSearchResults(pQuery);

		let tmpHTML = this.pict.parseTemplateByHash('Docuserve-Sidebar-Search-ResultsBody-Template', {});
		this.pict.ContentAssignment.assignContent('#Docuserve-Sidebar-Search-Results', tmpHTML);
	}

	/**
	 * Toggle the sidebar visibility via the layout's shell panel.
	 *
	 * The pict-section-modal shell owns the collapse / resize / persist
	 * chrome for the sidebar panel; we delegate to its toggle() so the
	 * persisted state stays in sync with the actual visual state.
	 *
	 * Falls back to the legacy display:none toggle when the shell isn't
	 * available (e.g. apps still on the pre-migration layout).
	 */
	toggleSidebar()
	{
		let tmpLayout = this.pict.views['Docuserve-Layout'];
		if (tmpLayout && typeof tmpLayout.toggleSidebar === 'function')
		{
			tmpLayout.toggleSidebar();
			return;
		}

		// Legacy fallback for hosts not yet on the shell-driven layout.
		this.pict.AppData.Docuserve.SidebarVisible = !this.pict.AppData.Docuserve.SidebarVisible;
		let tmpContainer = document.getElementById('Docuserve-Sidebar-Container');
		if (tmpContainer)
		{
			tmpContainer.style.display = this.pict.AppData.Docuserve.SidebarVisible ? '' : 'none';
		}
	}

	// ─────────────────────────────────────────────
	//  Record builders (private — drive the {~TS:~} tags)
	// ─────────────────────────────────────────────

	_refreshSearchSlot()
	{
		// Single-element-array trick: render the search box only when the
		// keyword index has loaded.
		this.pict.AppData.Docuserve.SidebarSearchSlot =
			this.pict.AppData.Docuserve.KeywordIndexLoaded ? [{}] : [];
	}

	_refreshFooterSlot()
	{
		let tmpDocuserve = this.pict.AppData.Docuserve;
		if (!tmpDocuserve.VersionLoaded || !tmpDocuserve.Version || !tmpDocuserve.Version.Version)
		{
			tmpDocuserve.FooterSlot = [];
			return;
		}

		let tmpVersion = tmpDocuserve.Version;
		let tmpRecord =
		{
			Version: tmpVersion.Version,
			NameSlot: tmpVersion.Name ? [{ Name: tmpVersion.Name }] : [],
			MetaSlot: []
		};

		let tmpMetaParts = [];
		if (tmpVersion.GeneratedAt)
		{
			let tmpDate = String(tmpVersion.GeneratedAt).match(/^(\d{4}-\d{2}-\d{2})/);
			if (tmpDate)
			{
				tmpMetaParts.push('built ' + tmpDate[1]);
			}
		}
		if (tmpVersion.GitCommit)
		{
			tmpMetaParts.push(tmpVersion.GitCommit);
		}
		if (tmpMetaParts.length > 0)
		{
			tmpRecord.MetaSlot = [{ Meta: tmpMetaParts.join(' · ') }];
		}

		tmpDocuserve.FooterSlot = [tmpRecord];
	}

	_refreshSidebarGroupRecords()
	{
		let tmpGroups = this.pict.AppData.Docuserve.SidebarGroups || [];
		let tmpCurrentGroup  = this.pict.AppData.Docuserve.CurrentGroup;
		let tmpCurrentModule = this.pict.AppData.Docuserve.CurrentModule;
		let tmpCurrentHash   = (typeof window !== 'undefined' && window.location) ? (window.location.hash || '') : '';

		let tmpRecords = [];
		for (let i = 0; i < tmpGroups.length; i++)
		{
			let tmpGroup = tmpGroups[i];

			// Resolve the group's route: use the group's own route, or
			// fall back to the first module with docs.
			let tmpGroupRoute = tmpGroup.Route || '';
			if (!tmpGroupRoute)
			{
				for (let k = 0; k < tmpGroup.Modules.length; k++)
				{
					if (tmpGroup.Modules[k].HasDocs && tmpGroup.Modules[k].Route)
					{
						tmpGroupRoute = tmpGroup.Modules[k].Route;
						break;
					}
				}
			}

			let tmpGroupActive = (tmpCurrentGroup === tmpGroup.Key) || (tmpCurrentHash === tmpGroupRoute);
			let tmpTitleLink = [];
			let tmpTitlePlain = [];
			if (tmpGroupRoute)
			{
				tmpTitleLink.push(
				{
					Name: tmpGroup.Name,
					Route: tmpGroupRoute,
					ActiveClass: tmpGroupActive ? ' active' : ''
				});
			}
			else
			{
				tmpTitlePlain.push({ Name: tmpGroup.Name });
			}

			let tmpModuleRecords = [];
			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.HasDocs)
				{
					let tmpModuleActive = (tmpCurrentGroup === tmpModule.Group && tmpCurrentModule === tmpModule.Name);
					tmpModuleRecords.push(
					{
						LinkSlot: [{
							Name: tmpModule.Name,
							Route: tmpModule.Route,
							ActiveClass: tmpModuleActive ? 'active' : ''
						}],
						NoDocSlot: []
					});
				}
				else
				{
					tmpModuleRecords.push(
					{
						LinkSlot: [],
						NoDocSlot: [{ Name: tmpModule.Name }]
					});
				}
			}

			tmpRecords.push(
			{
				TitleLink: tmpTitleLink,
				TitlePlain: tmpTitlePlain,
				Modules: tmpModuleRecords
			});
		}

		this.pict.AppData.Docuserve.SidebarGroupRecords = tmpRecords;
	}

	// A module-sidebar entry path is normally a docs-relative page that routes
	// under #/doc/<group>/<module>/.  External and non-document links (absolute
	// or protocol-relative URLs, in-page anchors, mailto:/tel:) are navigation
	// targets verbatim -- prefixing them with the doc route is what turned the
	// Retold Ecosystem links into dead "#/doc/.../https://..." pages.
	_moduleSidebarRoute(pPath, pRoutePrefix)
	{
		if (/^(?:[a-z][a-z0-9+.\-]*:\/\/|\/\/|mailto:|tel:|#)/i.test(pPath))
		{
			return pPath;
		}
		return pRoutePrefix + pPath;
	}

	_refreshModuleNavSections()
	{
		let tmpGroup  = this.pict.AppData.Docuserve.CurrentGroup;
		let tmpModule = this.pict.AppData.Docuserve.CurrentModule;
		if (!tmpGroup || !tmpModule)
		{
			this.pict.AppData.Docuserve.ModuleNavSections = [];
			return;
		}

		let tmpDocProvider   = this.pict.providers['Docuserve-Documentation'];
		let tmpDemosProvider = this.pict.providers['Docuserve-Demos'];

		let tmpSidebar = tmpDocProvider ? tmpDocProvider.getModuleSidebar(tmpGroup, tmpModule) : null;
		let tmpDemos   = tmpDemosProvider ? tmpDemosProvider.listByModule(tmpGroup, tmpModule) : [];

		if ((!tmpSidebar || tmpSidebar.length < 1) && tmpDemos.length < 1)
		{
			this.pict.AppData.Docuserve.ModuleNavSections = [];
			return;
		}

		let tmpRoutePrefix = '#/doc/' + tmpGroup + '/' + tmpModule + '/';
		let tmpDemoPrefix  = '#/demo/' + tmpGroup + '/' + tmpModule + '/';
		let tmpCurrentDemo = this.pict.AppData.Docuserve.CurrentDemo || '';

		let tmpSections = [];

		// Flattened sidebar entries into one section.  Entries with
		// children become a titled sub-section; flat entries form an
		// untitled run.  We preserve the original ordering by emitting a
		// new section each time the title changes.
		if (tmpSidebar && tmpSidebar.length > 0)
		{
			let tmpCurrentSection = null;
			for (let i = 0; i < tmpSidebar.length; i++)
			{
				let tmpEntry = tmpSidebar[i];

				if (tmpEntry.Children)
				{
					tmpCurrentSection =
					{
						TitleSlot: [{ Title: tmpEntry.Title }],
						Items: []
					};
					tmpSections.push(tmpCurrentSection);
					for (let j = 0; j < tmpEntry.Children.length; j++)
					{
						let tmpChild = tmpEntry.Children[j];
						if (tmpChild.Path)
						{
							tmpCurrentSection.Items.push(
							{
								Title: tmpChild.Title,
								Route: this._moduleSidebarRoute(tmpChild.Path, tmpRoutePrefix),
								ActiveClass: ''
							});
						}
					}
				}
				else if (tmpEntry.Path)
				{
					if (!tmpCurrentSection || tmpCurrentSection.TitleSlot.length > 0)
					{
						tmpCurrentSection = { TitleSlot: [], Items: [] };
						tmpSections.push(tmpCurrentSection);
					}
					tmpCurrentSection.Items.push(
					{
						Title: tmpEntry.Title,
						Route: this._moduleSidebarRoute(tmpEntry.Path, tmpRoutePrefix),
						ActiveClass: ''
					});
				}
			}
		}

		// Demos sub-section: titled, with active state mirroring the
		// current demo route.
		if (tmpDemos.length > 0)
		{
			let tmpDemoSection =
			{
				TitleSlot: [{ Title: 'Demos' }],
				Items: []
			};
			for (let i = 0; i < tmpDemos.length; i++)
			{
				let tmpDemo = tmpDemos[i];
				tmpDemoSection.Items.push(
				{
					Title: tmpDemo.Name || tmpDemo.Hash,
					Route: tmpDemoPrefix + tmpDemo.Hash,
					ActiveClass: (tmpDemo.Hash === tmpCurrentDemo) ? 'active' : ''
				});
			}
			tmpSections.push(tmpDemoSection);
		}

		this.pict.AppData.Docuserve.ModuleNavSections = tmpSections;
	}

	_refreshSearchResults(pQuery)
	{
		let tmpDocuserve = this.pict.AppData.Docuserve;

		if (!pQuery || !pQuery.trim())
		{
			tmpDocuserve.SidebarSearchResults  = [];
			tmpDocuserve.SidebarSearchOverflow = [];
			tmpDocuserve.SidebarSearchEmpty    = [];
			return;
		}

		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		let tmpResults     = tmpDocProvider.search(pQuery);

		if (tmpResults.length === 0)
		{
			tmpDocuserve.SidebarSearchResults  = [];
			tmpDocuserve.SidebarSearchOverflow = [];
			tmpDocuserve.SidebarSearchEmpty    = [{}];
			return;
		}

		let tmpMaxResults = 8;
		let tmpDisplayResults = [];
		for (let i = 0; i < tmpResults.length && i < tmpMaxResults; i++)
		{
			let tmpResult = tmpResults[i];
			let tmpMeta = (tmpResult.Group && tmpResult.Module)
				? tmpResult.Group + ' / ' + tmpResult.Module
				: '';
			tmpDisplayResults.push(
			{
				Title: tmpResult.Title,
				Route: tmpResult.Route,
				MetaSlot: tmpMeta ? [{ Meta: tmpMeta }] : []
			});
		}

		tmpDocuserve.SidebarSearchResults = tmpDisplayResults;
		tmpDocuserve.SidebarSearchEmpty   = [];

		if (tmpResults.length > tmpMaxResults)
		{
			tmpDocuserve.SidebarSearchOverflow =
			[{
				EncodedQuery: encodeURIComponent(pQuery),
				TotalCount:   tmpResults.length
			}];
		}
		else
		{
			tmpDocuserve.SidebarSearchOverflow = [];
		}
	}
}

module.exports = DocusserveSidebarView;

module.exports.default_configuration = _ViewConfiguration;
