const libPictView = require('pict-view');

/**
 * PictView-Docuserve-TopBar-User — slot view rendered into Theme-TopBar's
 * UserView slot. Hosts the Search link (when a keyword index is loaded)
 * and any external links declared in _topbar.md.
 *
 * The theme button (Theme-Section's 'Button' view) renders into the
 * Theme-TopBar chrome alongside this view — it's the right-most cluster
 * that opens the picker / mode-toggle / scale-select popover.
 *
 * Re-renders on demand when AppData.Docuserve.TopBar /
 * KeywordIndexLoaded changes.
 */

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-TopBar-User",

	DefaultRenderable: "Docuserve-TopBar-User-Display",
	DefaultDestinationAddress: "#Theme-TopBar-User",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-user
		{
			display: flex;
			align-items: center;
			height: 100%;
			gap: 0.25em;
			padding: 0 0.75em;
			color: var(--theme-color-text-on-brand, var(--theme-color-text-secondary, #B5AA9A));
		}
		.docuserve-user a
		{
			color: var(--theme-color-text-on-brand, var(--theme-color-text-secondary, #B5AA9A));
			text-decoration: none;
			font-size: 0.85em;
			padding: 0.4em 0.6em;
			border-radius: 4px;
			transition: background-color 0.15s, color 0.15s;
		}
		.docuserve-user a:hover
		{
			background-color: var(--theme-color-background-hover, rgba(255, 255, 255, 0.06));
			color: var(--theme-color-text-on-brand, var(--theme-color-text-primary, #E8E0D4));
		}
		.docuserve-user a.docuserve-repo-link
		{
			display: inline-flex;
			align-items: center;
			font-size: 1.15em;
			padding: 0.35em 0.5em;
		}
		.docuserve-user a.docuserve-repo-link .docuserve-octocat
		{
			line-height: 0;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-TopBar-User-Template",
			Template: /*html*/`<div class="docuserve-user" id="Docuserve-User-Links"></div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-TopBar-User-Display",
			TemplateHash: "Docuserve-TopBar-User-Template",
			DestinationAddress: "#Theme-TopBar-User",
			RenderMethod: "replace"
		}
	]
};

class DocuserveTopBarUserView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();
		this._renderLinks();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_renderLinks()
	{
		let tmpDocuserve = this.pict.AppData.Docuserve || {};
		let tmpEl = document.getElementById('Docuserve-User-Links');
		if (!tmpEl) { return; }

		let tmpHTML = '';
		// Search link comes first when a keyword index is available.
		if (tmpDocuserve.KeywordIndexLoaded)
		{
			tmpHTML += '<a href="#/search/">Search</a>';
		}
		// External links from _topbar.md.
		if (tmpDocuserve.TopBarLoaded && tmpDocuserve.TopBar && Array.isArray(tmpDocuserve.TopBar.ExternalLinks))
		{
			for (let i = 0; i < tmpDocuserve.TopBar.ExternalLinks.length; i++)
			{
				let tmpLink = tmpDocuserve.TopBar.ExternalLinks[i];
				let tmpHref = this._escapeHTML(tmpLink.Href || '#');
				let tmpText = this._escapeHTML(tmpLink.Text || '');
				let tmpIsExternal = /^https?:/i.test(tmpLink.Href || '');
				tmpHTML += '<a href="' + tmpHref + '"' + (tmpIsExternal ? ' target="_blank" rel="noopener"' : '') + '>' + tmpText + '</a>';
			}
		}
		// "View source" — octocat link to the current module's GitHub repo, so
		// every docs site links back to the source it documents (fixed on a
		// per-module site, follows the current module on the aggregate).
		let tmpGroup = tmpDocuserve.CurrentGroup;
		let tmpModule = tmpDocuserve.CurrentModule;
		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		// On a per-module (module-mode) site the route handlers leave
		// CurrentModule blank; the single documented module lives on the catalog.
		if ((!tmpModule) && tmpDocProvider && tmpDocProvider._Catalog && tmpDocProvider._Catalog.Module)
		{
			tmpModule = tmpDocProvider._Catalog.Module.Name;
		}
		if (tmpModule && tmpDocProvider && (typeof tmpDocProvider.resolveGitHubRepoURL === 'function'))
		{
			let tmpRepoURL = tmpDocProvider.resolveGitHubRepoURL(tmpGroup, tmpModule);
			if (tmpRepoURL)
			{
				let tmpIcon = this.pict.icon('GitHub', { class: 'docuserve-octocat', ariaLabel: 'View source on GitHub' });
				tmpHTML += '<a class="docuserve-repo-link" href="' + this._escapeHTML(tmpRepoURL) + '"'
					+ ' target="_blank" rel="noopener"'
					+ ' title="View ' + this._escapeHTML(tmpModule) + ' source on GitHub">'
					+ tmpIcon + '</a>';
			}
		}
		tmpEl.innerHTML = tmpHTML;
	}

	_escapeHTML(pText)
	{
		if (pText == null) { return ''; }
		return String(pText)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}

module.exports = DocuserveTopBarUserView;
module.exports.default_configuration = _ViewConfiguration;
