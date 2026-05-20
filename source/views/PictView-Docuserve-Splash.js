const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Splash",

	DefaultRenderable: "Docuserve-Splash-Content",
	DefaultDestinationAddress: "#Docuserve-Content-Container",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-splash {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: calc(100vh - 56px);
			padding: 3em 2em;
			text-align: center;
			background: var(--theme-color-background-primary, #FDFBF7);
		}
		.docuserve-splash h1 {
			font-size: 3em;
			font-weight: 700;
			color: var(--theme-color-text-primary, #3D3229);
			margin: 0 0 0.25em 0;
		}
		.docuserve-splash h1 small {
			font-size: 0.4em;
			font-weight: 400;
			color: var(--theme-color-text-muted, #8A7F72);
			vertical-align: middle;
			margin-left: 0.15em;
		}
		.docuserve-splash-tagline {
			font-size: 1.25em;
			color: var(--theme-color-text-secondary, #5E5549);
			margin-bottom: 1.5em;
			font-style: italic;
		}
		.docuserve-splash-description {
			font-size: 1em;
			color: var(--theme-color-text-secondary, #5E5549);
			max-width: 600px;
			line-height: 1.7;
			margin-bottom: 2em;
		}
		.docuserve-splash-highlights {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1.25em;
			max-width: 900px;
			width: 100%;
			margin-bottom: 2.5em;
		}
		.docuserve-splash-highlight-card {
			background: var(--theme-color-background-panel, #FFFFFF);
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			border-radius: 8px;
			padding: 1.25em;
			text-align: left;
			transition: box-shadow 0.2s, border-color 0.2s;
		}
		.docuserve-splash-highlight-card:hover {
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
			border-color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-splash-highlight-card h3 {
			margin: 0 0 0.5em 0;
			color: var(--theme-color-text-primary, #3D3229);
			font-size: 1em;
		}
		.docuserve-splash-highlight-card p {
			margin: 0;
			color: var(--theme-color-text-secondary, #5E5549);
			font-size: 0.85em;
			line-height: 1.5;
		}
		.docuserve-splash-actions {
			display: flex;
			gap: 1em;
			flex-wrap: wrap;
			justify-content: center;
		}
		.docuserve-splash-actions a {
			display: inline-block;
			padding: 0.7em 1.5em;
			border-radius: 6px;
			font-size: 0.95em;
			font-weight: 600;
			text-decoration: none;
			transition: background-color 0.15s, color 0.15s;
			cursor: pointer;
		}
		.docuserve-splash-actions .primary {
			background-color: var(--theme-color-brand-primary, #2E7D74);
			/* text-on-brand falls to a fixed light hex — never to background-panel,
			   which inverts contrast in dark themes (dark text on brand bg). */
			color: var(--theme-color-text-on-brand, #fff);
		}
		.docuserve-splash-actions .primary:hover {
			background-color: var(--theme-color-brand-primary-hover, #236660);
		}
		.docuserve-splash-actions .secondary {
			background-color: var(--theme-color-background-panel, #FFFFFF);
			color: var(--theme-color-text-primary, #3D3229);
			border: 2px solid var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-splash-actions .secondary:hover {
			border-color: var(--theme-color-brand-primary-hover, #236660);
			color: var(--theme-color-brand-primary, #2E7D74);
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Splash-Template",
			Template: /*html*/`
<div class="docuserve-splash">
	<h1 id="Docuserve-Splash-Title"></h1>
	<div class="docuserve-splash-tagline" id="Docuserve-Splash-Tagline"></div>
	<div class="docuserve-splash-description" id="Docuserve-Splash-Description"></div>
	<div class="docuserve-splash-highlights" id="Docuserve-Splash-Highlights"></div>
	<div class="docuserve-splash-actions" id="Docuserve-Splash-Actions"></div>
</div>
`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Splash-Content",
			TemplateHash: "Docuserve-Splash-Template",
			DestinationAddress: "#Docuserve-Content-Container",
			RenderMethod: "replace"
		}
	]
};

class DocusserveSplashView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpDocuserve = this.pict.AppData.Docuserve;

		if (tmpDocuserve.CoverLoaded && tmpDocuserve.Cover)
		{
			this.renderFromCover(tmpDocuserve.Cover);
		}
		else
		{
			this.renderFromCatalog(tmpDocuserve);
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	/**
	 * Render the splash screen from parsed _cover.md data.
	 *
	 * @param {Object} pCover - The parsed cover data { Title, Tagline, Description, Highlights, Actions }
	 */
	renderFromCover(pCover)
	{
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Title', this.sanitizeTitle(pCover.Title));
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Tagline', this.escapeHTML(pCover.Tagline));
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Description', this.escapeHTML(pCover.Description));

		// Render highlight cards
		let tmpHighlightsHTML = '';
		for (let i = 0; i < pCover.Highlights.length; i++)
		{
			let tmpHighlight = pCover.Highlights[i];
			tmpHighlightsHTML += '<div class="docuserve-splash-highlight-card">';
			if (tmpHighlight.Label)
			{
				tmpHighlightsHTML += '<h3>' + this.escapeHTML(tmpHighlight.Label) + '</h3>';
			}
			tmpHighlightsHTML += '<p>' + this.escapeHTML(tmpHighlight.Text) + '</p>';
			tmpHighlightsHTML += '</div>';
		}
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Highlights', tmpHighlightsHTML);

		// Render action buttons
		let tmpActionsHTML = '';
		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		for (let i = 0; i < pCover.Actions.length; i++)
		{
			let tmpAction = pCover.Actions[i];
			let tmpClass = (i === 0) ? 'primary' : 'secondary';
			let tmpHref = tmpAction.Href;

			// External links open in new tab
			if (tmpHref.match(/^https?:\/\//))
			{
				tmpActionsHTML += '<a class="' + tmpClass + '" href="' + this.escapeHTML(tmpHref) + '" target="_blank" rel="noopener">' + this.escapeHTML(tmpAction.Text) + '</a>';
			}
			else
			{
				// Internal links go through the app router
				let tmpRoute = tmpDocProvider.convertSidebarLink(tmpHref);
				tmpActionsHTML += '<a class="' + tmpClass + '" href="' + this.escapeHTML(tmpRoute) + '">' + this.escapeHTML(tmpAction.Text) + '</a>';
			}
		}
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Actions', tmpActionsHTML);
	}

	/**
	 * Render the splash screen from catalog data as a fallback when _cover.md
	 * is not available.
	 *
	 * @param {Object} pDocuserve - The AppData.Docuserve state
	 */
	renderFromCatalog(pDocuserve)
	{
		// Derive the title from whatever data is available, falling back to the page title or 'Documentation'
		let tmpTitle = 'Documentation';
		let tmpTagline = '';

		if (pDocuserve.CatalogLoaded && pDocuserve.Catalog && pDocuserve.Catalog.Name)
		{
			tmpTitle = pDocuserve.Catalog.Name;
		}
		else if (pDocuserve.TopBarLoaded && pDocuserve.TopBar && pDocuserve.TopBar.Brand)
		{
			tmpTitle = pDocuserve.TopBar.Brand;
		}
		else if (typeof document !== 'undefined' && document.title)
		{
			tmpTitle = document.title;
		}

		if (pDocuserve.CatalogLoaded && pDocuserve.Catalog && pDocuserve.Catalog.Description)
		{
			tmpTagline = pDocuserve.Catalog.Description;
		}

		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Title', this.escapeHTML(tmpTitle));
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Tagline', this.escapeHTML(tmpTagline));
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Description', '');

		// Build highlight cards from catalog groups
		let tmpHighlightsHTML = '';
		let tmpGroups = pDocuserve.SidebarGroups || [];
		for (let i = 0; i < tmpGroups.length; i++)
		{
			let tmpGroup = tmpGroups[i];
			// Skip groups with no modules (like "Home" or "Getting Started")
			if (!tmpGroup.Modules || tmpGroup.Modules.length < 1)
			{
				continue;
			}
			let tmpDescription = tmpGroup.Description || (tmpGroup.Modules.length + ' modules');
			tmpHighlightsHTML += '<div class="docuserve-splash-highlight-card">';
			tmpHighlightsHTML += '<h3>' + this.escapeHTML(tmpGroup.Name) + '</h3>';
			tmpHighlightsHTML += '<p>' + this.escapeHTML(tmpDescription) + '</p>';
			tmpHighlightsHTML += '</div>';
		}
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Highlights', tmpHighlightsHTML);

		// Default action buttons
		this.pict.ContentAssignment.assignContent('#Docuserve-Splash-Actions', '');
	}

	/**
	 * Sanitize a title string, preserving only <small> tags.
	 * All other HTML is escaped.
	 *
	 * @param {string} pText - The raw title text
	 * @returns {string} The sanitized title HTML
	 */
	sanitizeTitle(pText)
	{
		if (!pText)
		{
			return '';
		}
		// Escape everything first, then restore <small> and </small>
		return this.escapeHTML(pText)
			.replace(/&lt;small&gt;/gi, '<small>')
			.replace(/&lt;\/small&gt;/gi, '</small>');
	}

	/**
	 * Escape HTML special characters.
	 *
	 * @param {string} pText - The text to escape
	 * @returns {string} The escaped text
	 */
	escapeHTML(pText)
	{
		if (!pText)
		{
			return '';
		}
		return pText
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
}

module.exports = DocusserveSplashView;

module.exports.default_configuration = _ViewConfiguration;
