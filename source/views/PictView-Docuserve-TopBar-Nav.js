const libPictView = require('pict-view');

/**
 * PictView-Docuserve-TopBar-Nav — slot view rendered into Theme-TopBar's
 * NavView slot. Hosts navigation links (Home + any links declared in
 * _topbar.md) and the version chip (sourced from _version.json).
 *
 * Re-renders on demand when AppData.Docuserve.TopBar / Version data
 * is loaded by the documentation provider.
 */

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-TopBar-Nav",

	DefaultRenderable: "Docuserve-TopBar-Nav-Display",
	DefaultDestinationAddress: "#Theme-TopBar-Nav",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-nav
		{
			display: flex;
			align-items: center;
			height: 100%;
			gap: 0.6em;
			padding: 0 0.75em;
			color: var(--theme-color-text-on-brand, var(--theme-color-text-primary, #E8E0D4));
		}
		.docuserve-nav-links
		{
			display: flex;
			align-items: center;
			gap: 0.25em;
		}
		.docuserve-nav-links a
		{
			color: var(--theme-color-text-on-brand, var(--theme-color-text-primary, #E8E0D4));
			text-decoration: none;
			padding: 0.45em 0.7em;
			border-radius: 4px;
			font-size: 0.9em;
			transition: background-color 0.15s, color 0.15s;
			cursor: pointer;
		}
		.docuserve-nav-links a:hover
		{
			background-color: var(--theme-color-background-hover, rgba(255, 255, 255, 0.06));
			/* Keep the text token chain on hover — falling to background-panel
			   here inverts contrast (dark text on dark hover) in themes that
			   don't define text-on-brand (e.g. night, twilight). */
			color: var(--theme-color-text-on-brand, var(--theme-color-text-primary, #ffffff));
		}
		.docuserve-nav-version
		{
			font-size: 0.72em;
			font-weight: 500;
			color: var(--theme-color-text-on-brand, var(--theme-color-text-muted, #B5AA9A));
			background: var(--theme-color-background-hover, rgba(255, 255, 255, 0.06));
			border: 1px solid var(--theme-color-border-light, rgba(255, 255, 255, 0.08));
			padding: 0.12em 0.55em;
			border-radius: 10px;
			font-family: var(--theme-typography-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
			letter-spacing: 0.02em;
			white-space: nowrap;
		}
		.docuserve-nav-version:empty
		{
			display: none;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-TopBar-Nav-Template",
			Template: /*html*/`
<div class="docuserve-nav">
	<div id="Docuserve-Nav-Links" class="docuserve-nav-links"></div>
	<span id="Docuserve-Nav-Version" class="docuserve-nav-version" title=""></span>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-TopBar-Nav-Display",
			TemplateHash: "Docuserve-TopBar-Nav-Template",
			DestinationAddress: "#Theme-TopBar-Nav",
			RenderMethod: "replace"
		}
	]
};

class DocuserveTopBarNavView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();
		this._renderNavLinks();
		this._renderVersionChip();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_renderNavLinks()
	{
		let tmpDocuserve = this.pict.AppData.Docuserve || {};
		let tmpLinksEl = document.getElementById('Docuserve-Nav-Links');
		if (!tmpLinksEl) { return; }

		let tmpHTML = '<a href="#/Home">Home</a>';
		if (tmpDocuserve.TopBarLoaded && tmpDocuserve.TopBar && Array.isArray(tmpDocuserve.TopBar.NavLinks))
		{
			for (let i = 0; i < tmpDocuserve.TopBar.NavLinks.length; i++)
			{
				let tmpLink = tmpDocuserve.TopBar.NavLinks[i];
				tmpHTML += '<a href="' + this._escapeHTML(tmpLink.Href || '#') + '">' + this._escapeHTML(tmpLink.Text || '') + '</a>';
			}
		}
		tmpLinksEl.innerHTML = tmpHTML;
	}

	_renderVersionChip()
	{
		let tmpDocuserve = this.pict.AppData.Docuserve || {};
		let tmpEl = document.getElementById('Docuserve-Nav-Version');
		if (!tmpEl) { return; }

		if (!tmpDocuserve.VersionLoaded || !tmpDocuserve.Version || !tmpDocuserve.Version.Version)
		{
			tmpEl.innerHTML = '';
			tmpEl.setAttribute('title', '');
			return;
		}

		let tmpVersion = tmpDocuserve.Version;
		tmpEl.innerHTML = 'v' + this._escapeHTML(tmpVersion.Version);

		let tmpTooltipParts = [];
		tmpTooltipParts.push((tmpVersion.Name ? tmpVersion.Name + ' ' : '') + 'v' + tmpVersion.Version);
		if (tmpVersion.GeneratedAt)
		{
			let tmpMatch = String(tmpVersion.GeneratedAt).match(/^(\d{4}-\d{2}-\d{2})/);
			tmpTooltipParts.push('built ' + (tmpMatch ? tmpMatch[1] : tmpVersion.GeneratedAt));
		}
		if (tmpVersion.GitCommit)
		{
			tmpTooltipParts.push(tmpVersion.GitCommit);
		}
		tmpEl.setAttribute('title', tmpTooltipParts.join(' · '));
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

module.exports = DocuserveTopBarNavView;
module.exports.default_configuration = _ViewConfiguration;
