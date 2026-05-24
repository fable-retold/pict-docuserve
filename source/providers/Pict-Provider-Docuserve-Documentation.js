const libPictProvider = require('pict-provider');
const libLunr = require('lunr');
const libPictSectionContent = require('pict-section-content');
const libPictContentProvider = libPictSectionContent.PictContentProvider;

/**
 * Documentation Provider for Docuserve
 *
 * Loads the Indoctrinate-generated catalog and keyword index,
 * fetches markdown documents from local paths or raw GitHub URLs,
 * and parses them into HTML for rendering.
 */
class DocuserveDocumentationProvider extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._Catalog = null;
		this._KeywordIndexMode = null;
		this._ContentCache = {};
		// (group, module) -> playground config | null (negative cache).
		// Loaded lazily by loadPlaygroundConfig on first navigation into
		// a module that opts into the playground.
		this._PlaygroundConfigCache = {};

		// Create an instance of the content provider for markdown parsing
		this._ContentProvider = this.pict.addProvider('Pict-Content', libPictContentProvider.default_configuration, libPictContentProvider);
	}

	/**
	 * Create a link resolver closure for the content provider.
	 *
	 * Wraps docuserve-specific link resolution (catalog-aware routing,
	 * GitHub URL matching) into a callback compatible with the
	 * pict-section-content link resolver pattern.
	 *
	 * @param {string} [pCurrentGroup] - The current group key
	 * @param {string} [pCurrentModule] - The current module name
	 * @param {string} [pCurrentDocPath] - The current document path
	 * @returns {Function} A link resolver callback
	 */
	_createLinkResolver(pCurrentGroup, pCurrentModule, pCurrentDocPath)
	{
		return (pHref, pLinkText) =>
		{
			let tmpHref = String(pHref || '');
			let tmpIsModuleMode = (this.getDocsMode() === 'module');

			// Built example applications (and other static .html pages) are
			// plain browser links opened in a new tab — the browser resolves
			// them against the docs-root index.html, never the #/page/ hash.
			// They must therefore carry the full docs-root-relative path, and
			// are emitted exactly as authored regardless of the current page.
			if (!tmpHref.match(/^[a-z][a-z0-9+.-]*:/i) && tmpHref.match(/\.html($|[?#])/i))
			{
				return { href: tmpHref, target: '_blank', rel: 'noopener' };
			}
			// Convert internal doc links to hash routes
			if (tmpHref.match(/^\//) || tmpHref.match(/^[^:]+\.md/))
			{
				let tmpRoute = this.convertDocLink(tmpHref, pCurrentGroup, pCurrentModule, pCurrentDocPath);
				return { href: tmpRoute };
			}
			// Check if this is a GitHub URL that matches a catalog module
			let tmpCatalogRoute = this.resolveGitHubURLToRoute(tmpHref);
			if (tmpCatalogRoute)
			{
				return { href: tmpCatalogRoute };
			}
			// Module mode: a remaining relative link (a directory, a media
			// file, a .json) is resolved against the current document's
			// directory too, so it shares the one base every other link uses
			// rather than silently falling back to the docs root.
			if (tmpIsModuleMode
				&& tmpHref
				&& (tmpHref.charAt(0) !== '#')
				&& (tmpHref.indexOf('//') !== 0)
				&& !tmpHref.match(/^[a-z][a-z0-9+.-]*:/i))
			{
				return { href: this._toModuleAssetHref(tmpHref, pCurrentDocPath) };
			}
			// Use default behavior for other links
			return null;
		};
	}

	/**
	 * Create an image resolver closure for the content provider.
	 *
	 * Resolves relative image URLs against the directory of the document
	 * being rendered, so that images referenced with relative paths in
	 * markdown (e.g. `![graph](diagram.svg)`) resolve correctly even
	 * when the page uses hash-based routing.
	 *
	 * @param {string} pDocURL - The URL the markdown document was fetched from
	 * @returns {Function} An image resolver callback: (pSrc, pAlt) => resolvedSrc
	 */
	_createImageResolver(pDocURL)
	{
		// Extract the directory portion of the document URL
		let tmpBaseDir = '';
		if (pDocURL)
		{
			let tmpLastSlash = pDocURL.lastIndexOf('/');
			if (tmpLastSlash >= 0)
			{
				tmpBaseDir = pDocURL.substring(0, tmpLastSlash + 1);
			}
		}

		return (pSrc, pAlt) =>
		{
			// Leave absolute URLs, data URIs, and root-relative paths unchanged
			if (pSrc.match(/^https?:\/\//) || pSrc.match(/^data:/) || pSrc.match(/^\//))
			{
				return pSrc;
			}
			// Prepend the document's directory to make relative paths work
			return tmpBaseDir + pSrc;
		};
	}

	/**
	 * Load all documentation data sources: catalog, _cover.md, _sidebar.md.
	 *
	 * Loads the catalog first (it provides the fallback data), then attempts
	 * to load _cover.md and _sidebar.md in parallel.  If those markdown files
	 * exist they drive the splash and sidebar views; otherwise the catalog
	 * data is used as a fallback.
	 *
	 * @param {Function} fCallback - Callback when all loading is complete
	 */
	loadCatalog(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};

		let tmpCatalogURL = this.pict.AppData.Docuserve.CatalogURL || 'retold-catalog.json';

		let tmpLoadOptionalFiles = () =>
		{
			// Load _cover.md, _sidebar.md, _topbar.md, errorpage.md and keyword index in parallel.
			// When all are done, if we still have no sidebar data, try to auto-discover
			// a README.md so the site works with plain markdown folders.
			let tmpPending = 6;
			let tmpFinish = () =>
			{
				tmpPending--;
				if (tmpPending <= 0)
				{
					// If no sidebar data was populated by catalog or _sidebar.md,
					// try to auto-discover a README.md to provide minimal navigation.
					if (!this.pict.AppData.Docuserve.SidebarGroups || this.pict.AppData.Docuserve.SidebarGroups.length < 1)
					{
						this.autoDiscoverSidebar(tmpCallback);
					}
					else
					{
						return tmpCallback();
					}
				}
			};

			this.loadCover(tmpFinish);
			this.loadSidebar(tmpFinish);
			this.loadTopbar(tmpFinish);
			this.loadErrorPage(tmpFinish);
			this.loadKeywordIndex(tmpFinish);
			this.loadVersion(tmpFinish);
		};

		fetch(tmpCatalogURL)
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					this.log.info(`Docuserve: No catalog at [${tmpCatalogURL}]; running in standalone mode.`);
					return null;
				}
				return pResponse.json();
			})
			.then((pCatalog) =>
			{
				if (pCatalog)
				{
					this._Catalog = pCatalog;
					this.pict.AppData.Docuserve.Catalog = pCatalog;
					this.pict.AppData.Docuserve.CatalogLoaded = true;

					// Build sidebar navigation data from the catalog as default
					this.buildSidebarData(pCatalog);
				}

				tmpLoadOptionalFiles();
			})
			.catch((pError) =>
			{
				this.log.info(`Docuserve: Catalog load error (${pError}); continuing in standalone mode.`);
				tmpLoadOptionalFiles();
			});
	}

	/**
	 * Auto-discover sidebar content when no catalog or _sidebar.md is available.
	 *
	 * Attempts to fetch README.md from the docs root.  If found, creates a
	 * minimal sidebar with a single "Docs" group containing a README entry.
	 * This lets pict-docuserve work with nothing but a folder of markdown.
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	autoDiscoverSidebar(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + 'README.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (pMarkdown)
				{
					// Extract a title from the first heading in the README
					let tmpTitleMatch = pMarkdown.match(/^#+\s+(.+)/m);
					let tmpTitle = tmpTitleMatch ? tmpTitleMatch[1].trim() : 'Docs';

					// Build a minimal sidebar group so the sidebar has something to show
					this.pict.AppData.Docuserve.SidebarGroups =
					[
						{
							Name: tmpTitle,
							Key: 'docs',
							Route: '#/page/README',
							Modules: []
						}
					];

					// Also set this as a fallback cover title if we have no cover
					if (!this.pict.AppData.Docuserve.CoverLoaded)
					{
						this.pict.AppData.Docuserve.Cover =
						{
							Title: tmpTitle,
							Tagline: '',
							Description: '',
							Highlights: [],
							Actions: [{ Text: 'Read the Docs', Href: 'README.md' }]
						};
						this.pict.AppData.Docuserve.CoverLoaded = true;
					}
				}
				else
				{
					this.log.info('Docuserve: No README.md found; sidebar will be empty.');
				}

				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.info(`Docuserve: README.md discovery failed (${pError}).`);
				return tmpCallback();
			});
	}

	/**
	 * Fetch and parse _cover.md into structured data for the splash view.
	 *
	 * The expected _cover.md format follows the docsify convention:
	 *   # Title
	 *   > Tagline
	 *   Description paragraph text.
	 *   - **Group** — description
	 *   [Link Text](url)
	 *
	 * Parsed result stored in this.pict.AppData.Docuserve.Cover:
	 *   { Title, Tagline, Description, Highlights: [{Label, Text}], Actions: [{Text, Href}] }
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadCover(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + '_cover.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					this.log.info('Docuserve: No _cover.md found; splash will use catalog data.');
					return tmpCallback();
				}

				this.pict.AppData.Docuserve.Cover = this.parseCover(pMarkdown);
				this.pict.AppData.Docuserve.CoverLoaded = true;
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading _cover.md: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Parse _cover.md markdown text into a structured object.
	 *
	 * @param {string} pMarkdown - Raw _cover.md content
	 * @returns {Object} Parsed cover data
	 */
	parseCover(pMarkdown)
	{
		let tmpCover = {
			Title: '',
			Tagline: '',
			Description: '',
			Highlights: [],
			Actions: [],
			ExamplesMarkdown: ''
		};

		let tmpLines = pMarkdown.split('\n');
		let tmpInExamples = false;

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i].trim();

			// Generated examples region — collected verbatim for the splash's
			// "Interactive Examples" section, never parsed as cover fields.
			if (tmpLine === '<!-- docuserve:examples:start -->')
			{
				tmpInExamples = true;
				continue;
			}
			if (tmpLine === '<!-- docuserve:examples:end -->')
			{
				tmpInExamples = false;
				continue;
			}
			if (tmpInExamples)
			{
				if (tmpLine)
				{
					tmpCover.ExamplesMarkdown += (tmpCover.ExamplesMarkdown ? '\n' : '') + tmpLine;
				}
				continue;
			}

			if (!tmpLine)
			{
				continue;
			}

			// Heading — the title
			let tmpHeadingMatch = tmpLine.match(/^#+\s+(.+)/);
			if (tmpHeadingMatch)
			{
				tmpCover.Title = tmpHeadingMatch[1].trim();
				continue;
			}

			// Blockquote — the tagline
			let tmpBlockquoteMatch = tmpLine.match(/^>\s*(.*)/);
			if (tmpBlockquoteMatch)
			{
				tmpCover.Tagline = tmpBlockquoteMatch[1].trim();
				continue;
			}

			// Bullet list — highlights (e.g. "- **Fable** — Core ecosystem, DI, config")
			let tmpBulletMatch = tmpLine.match(/^[-*+]\s+(.*)/);
			if (tmpBulletMatch)
			{
				let tmpBulletContent = tmpBulletMatch[1];
				// Try to split on bold label: **Label** — rest
				let tmpLabelMatch = tmpBulletContent.match(/^\*\*([^*]+)\*\*\s*[-—:]\s*(.*)/);
				if (tmpLabelMatch)
				{
					tmpCover.Highlights.push({ Label: tmpLabelMatch[1].trim(), Text: tmpLabelMatch[2].trim() });
				}
				else
				{
					tmpCover.Highlights.push({ Label: '', Text: tmpBulletContent.trim() });
				}
				continue;
			}

			// Bare link — action button (e.g. "[Get Started](getting-started.md)")
			let tmpLinkMatch = tmpLine.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/);
			if (tmpLinkMatch)
			{
				tmpCover.Actions.push({ Text: tmpLinkMatch[1].trim(), Href: tmpLinkMatch[2].trim() });
				continue;
			}

			// Otherwise it's description text
			if (!tmpCover.Description)
			{
				tmpCover.Description = tmpLine;
			}
			else
			{
				tmpCover.Description += ' ' + tmpLine;
			}
		}

		return tmpCover;
	}

	/**
	 * Fetch and parse _sidebar.md into structured navigation data.
	 *
	 * The expected _sidebar.md format follows the docsify convention:
	 *   - [Home](/)
	 *   - Group Title
	 *     - [module-name](/group/module/)
	 *   - [Group Title](group.md)
	 *     - [module-name](/group/module/)
	 *
	 * If _sidebar.md is successfully loaded and parsed, its data replaces
	 * the catalog-inferred SidebarGroups in AppData.
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadSidebar(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + '_sidebar.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					this.log.info('Docuserve: No _sidebar.md found; sidebar will use catalog data.');
					return tmpCallback();
				}

				let tmpSidebarData = this.parseSidebarMarkdown(pMarkdown);
				if (tmpSidebarData && tmpSidebarData.length > 0)
				{
					this.pict.AppData.Docuserve.SidebarGroups = tmpSidebarData;
					this.pict.AppData.Docuserve.SidebarLoaded = true;
				}
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading _sidebar.md: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Fetch and parse _topbar.md into structured data for the top bar view.
	 *
	 * The expected _topbar.md format:
	 *   # Brand Name
	 *   - [Link Text](url)
	 *   - [Link Text](url)
	 *
	 * The heading becomes the brand/title shown on the left.  List items become
	 * navigation links.  External links (starting with http) render on the
	 * right side; internal links render in the centre nav area.
	 *
	 * Parsed result stored in this.pict.AppData.Docuserve.TopBar:
	 *   { Brand, NavLinks: [{Text, Href, External}], ExternalLinks: [{Text, Href}] }
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadTopbar(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + '_topbar.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					this.log.info('Docuserve: No _topbar.md found; top bar will use defaults.');
					return tmpCallback();
				}

				this.pict.AppData.Docuserve.TopBar = this.parseTopbar(pMarkdown);
				this.pict.AppData.Docuserve.TopBarLoaded = true;
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading _topbar.md: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Parse _topbar.md markdown text into a structured object.
	 *
	 * @param {string} pMarkdown - Raw _topbar.md content
	 * @returns {Object} Parsed top bar data { Brand, NavLinks, ExternalLinks }
	 */
	parseTopbar(pMarkdown)
	{
		let tmpTopBar = {
			Brand: '',
			NavLinks: [],
			ExternalLinks: []
		};

		let tmpLines = pMarkdown.split('\n');

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i].trim();

			if (!tmpLine)
			{
				continue;
			}

			// Heading — the brand name
			let tmpHeadingMatch = tmpLine.match(/^#+\s+(.+)/);
			if (tmpHeadingMatch)
			{
				tmpTopBar.Brand = tmpHeadingMatch[1].trim();
				continue;
			}

			// Bullet list item with link
			let tmpBulletMatch = tmpLine.match(/^[-*+]\s+(.*)/);
			if (tmpBulletMatch)
			{
				let tmpContent = tmpBulletMatch[1].trim();
				let tmpLinkMatch = tmpContent.match(/^\[([^\]]+)\]\(([^)]+)\)/);

				if (tmpLinkMatch)
				{
					let tmpText = tmpLinkMatch[1].trim();
					let tmpHref = tmpLinkMatch[2].trim();

					// External links (http/https) go to the right side
					if (tmpHref.match(/^https?:\/\//))
					{
						tmpTopBar.ExternalLinks.push({ Text: tmpText, Href: tmpHref });
					}
					else
					{
						// Internal link — convert to hash route
						let tmpRoute = this.convertSidebarLink(tmpHref);
						tmpTopBar.NavLinks.push({ Text: tmpText, Href: tmpRoute });
					}
				}
				continue;
			}
		}

		return tmpTopBar;
	}

	/**
	 * Fetch and parse _version.json — an optional sidecar generated by
	 * `quack prepare-docs` that describes the module version, generation
	 * timestamp and git commit for display in the topbar and sidebar.
	 *
	 * Parsed result stored in this.pict.AppData.Docuserve.Version:
	 *   { Name, Version, Description, GeneratedAt, GitCommit }
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadVersion(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + '_version.json')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.json();
			})
			.then((pVersion) =>
			{
				if (!pVersion)
				{
					this.log.info('Docuserve: No _version.json found; version placard disabled.');
					return tmpCallback();
				}

				this.pict.AppData.Docuserve.Version = pVersion;
				this.pict.AppData.Docuserve.VersionLoaded = true;
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading _version.json: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Fetch a module's `_playground.json` config (the file that
	 * declares which `require()` names the playground exposes and
	 * how each one resolves).  Results are cached per (group, module);
	 * a 404 / missing file caches a null so we don't hit the network
	 * repeatedly when a module simply doesn't have a playground.
	 *
	 * Config shape:
	 *   {
	 *     "Imports":
	 *     [
	 *       { "Name": "fable",      "Source": "bundled" },
	 *       { "Name": "meadow",     "Source": "cdn",
	 *         "ScriptUrl": "https://...", "GlobalName": "Meadow" }
	 *     ]
	 *   }
	 *
	 * "Source" today is just `"bundled"` for the fable family (already
	 * inside the page via the live Fable instance).  The schema makes
	 * room for `"cdn"`-style loads when we get to meadow.
	 *
	 * @param {string} pGroup
	 * @param {string} pModule
	 * @returns {Promise<object|null>} Resolves with the parsed config
	 *   or null if the module has no `_playground.json`.
	 */
	loadPlaygroundConfig(pGroup, pModule)
	{
		let tmpKey = (pGroup || '') + '/' + (pModule || '');
		if (Object.prototype.hasOwnProperty.call(this._PlaygroundConfigCache, tmpKey))
		{
			return Promise.resolve(this._PlaygroundConfigCache[tmpKey]);
		}
		// Catalog mode: route to the module's docs/_playground.json on GitHub.
		// Standalone mode: catalog isn't loaded, so the served docs ARE the
		// current module's docs root; use DocsBaseURL.
		let tmpURL;
		if (pGroup && pModule && this._Catalog)
		{
			tmpURL = this.resolveDocumentURL(pGroup, pModule, '_playground.json');
		}
		if (!tmpURL)
		{
			let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';
			tmpURL = tmpDocsBase + '_playground.json';
		}
		return fetch(tmpURL)
			.then((pResponse) =>
			{
				if (!pResponse.ok) { return null; }
				return pResponse.json();
			})
			.then((pConfig) =>
			{
				this._PlaygroundConfigCache[tmpKey] = pConfig || null;
				return this._PlaygroundConfigCache[tmpKey];
			})
			.catch((pError) =>
			{
				this.log.warn('Docuserve: Error loading _playground.json [' + tmpURL + ']: ' + pError);
				this._PlaygroundConfigCache[tmpKey] = null;
				return null;
			});
	}

	/**
	 * Fetch and parse errorpage.md into HTML for use as a custom error page.
	 *
	 * The errorpage.md is a standard markdown file.  If it contains the
	 * placeholder `{{path}}` anywhere in its source, that token will be
	 * replaced with the actual requested path at display time (via
	 * getErrorPageHTML).
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadErrorPage(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + 'errorpage.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					this.log.info('Docuserve: No errorpage.md found; errors will use default page.');
					return tmpCallback();
				}

				this.pict.AppData.Docuserve.ErrorPageHTML = this._ContentProvider.parseMarkdown(pMarkdown);
				this.pict.AppData.Docuserve.ErrorPageLoaded = true;
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading errorpage.md: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Load the keyword search index (retold-keyword-index.json).
	 *
	 * If the index file exists, hydrates a lunr.Index for client-side search
	 * and stores the document metadata map.  If the file is not found, search
	 * features will simply not appear in the UI.
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadKeywordIndex(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + 'retold-keyword-index.json')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.json();
			})
			.then((pIndexData) =>
			{
				if (!pIndexData || !pIndexData.LunrIndex || !pIndexData.Documents)
				{
					this.log.info('Docuserve: No keyword index found; search will be unavailable.');
					return tmpCallback();
				}

				try
				{
					this._LunrIndex = libLunr.Index.load(pIndexData.LunrIndex);
					this._KeywordDocuments = pIndexData.Documents;
					this._KeywordIndexMode = (pIndexData.Mode === 'module' || pIndexData.Mode === 'ecosystem') ? pIndexData.Mode : null;
					this.pict.AppData.Docuserve.KeywordIndexLoaded = true;
					this.pict.AppData.Docuserve.KeywordDocumentCount = pIndexData.DocumentCount || 0;
					this.log.info(`Docuserve: Keyword index loaded (${pIndexData.DocumentCount || 0} documents).`);
				}
				catch (pError)
				{
					this.log.warn(`Docuserve: Error hydrating lunr index: ${pError}`);
				}

				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading keyword index: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Resolve the documentation site mode.
	 *
	 *   'module'    — a single module's own docs site; every doc is a local
	 *                 page (#/page/<docpath>).
	 *   'ecosystem' — a catalog of <group>/<module> repos (#/doc/...).
	 *   'legacy'    — built before the Mode stamp existed; callers keep the
	 *                 pre-Mode heuristic so old docs sites are unaffected.
	 *
	 * @returns {string} 'module' | 'ecosystem' | 'legacy'
	 */
	getDocsMode()
	{
		if (this._Catalog && (this._Catalog.Mode === 'module' || this._Catalog.Mode === 'ecosystem'))
		{
			return this._Catalog.Mode;
		}
		if (this._KeywordIndexMode === 'module' || this._KeywordIndexMode === 'ecosystem')
		{
			return this._KeywordIndexMode;
		}
		return 'legacy';
	}

	/**
	 * Module-mode link resolution: every internal documentation reference is
	 * a local page.  Relative links (./sibling.md, ../other.md, bare names)
	 * resolve against the directory of the document that contains them — the
	 * way the links read on disk — while a /-rooted href resolves against the
	 * docs root.  "." and ".." segments are collapsed; ".." is clamped at the
	 * docs root so a link can never escape above it.
	 *
	 * @param {string} pHref - The raw link href
	 * @param {string} [pCurrentDocPath] - Docs-root-relative path of the
	 *                  document the link lives in (e.g.
	 *                  "examples/gradebook/README.md").  Absent for root-level
	 *                  contexts such as the sidebar.
	 * @returns {string} A #/page/ hash route (#/Home for an empty path)
	 */
	_toModulePageRoute(pHref, pCurrentDocPath)
	{
		let tmpHref = String(pHref || '').trim();

		// A /-rooted href resolves against the docs root; every other href
		// resolves against the current document's directory.
		let tmpBaseDir = '';
		if (tmpHref.charAt(0) === '/')
		{
			tmpHref = tmpHref.replace(/^\/+/, '');
		}
		else if (pCurrentDocPath)
		{
			let tmpDirParts = String(pCurrentDocPath).split('/');
			tmpDirParts.pop();
			tmpBaseDir = tmpDirParts.join('/');
		}

		let tmpPath = this._resolveRelativeDocPath(tmpBaseDir, tmpHref);
		if (!tmpPath)
		{
			return '#/Home';
		}
		return '#/page/' + tmpPath.replace(/\.md$/i, '');
	}

	/**
	 * Resolve a relative href against a base directory, collapsing "." and
	 * ".." segments.  ".." is clamped at the docs root — it can never escape
	 * above it.  Both arguments are POSIX-style docs-root-relative paths.
	 *
	 * @param {string} pBaseDir - The directory the href is relative to.
	 * @param {string} pHref - The href to resolve.
	 * @returns {string} The resolved docs-root-relative path (no leading slash).
	 */
	_resolveRelativeDocPath(pBaseDir, pHref)
	{
		let tmpSegments = [];
		let tmpCombined = (pBaseDir ? pBaseDir + '/' : '') + String(pHref || '');
		let tmpParts = tmpCombined.split('/');
		for (let i = 0; i < tmpParts.length; i++)
		{
			let tmpPart = tmpParts[i];
			if ((tmpPart === '') || (tmpPart === '.'))
			{
				continue;
			}
			if (tmpPart === '..')
			{
				if (tmpSegments.length > 0)
				{
					tmpSegments.pop();
				}
				continue;
			}
			tmpSegments.push(tmpPart);
		}
		return tmpSegments.join('/');
	}

	/**
	 * Module-mode resolution for a non-routed link — a built .html page, a
	 * media file, a directory.  Resolves the href against the current
	 * document's directory (a /-rooted href against the docs root), the same
	 * way _toModulePageRoute resolves a .md link, and returns a plain
	 * docs-root-relative href.  The browser resolves that href against the
	 * docs-root index.html, so it points at the right file from any page.
	 *
	 * @param {string} pHref - The raw link href
	 * @param {string} [pCurrentDocPath] - Docs-root-relative path of the
	 *                  document the link lives in.
	 * @returns {string} A docs-root-relative href.
	 */
	_toModuleAssetHref(pHref, pCurrentDocPath)
	{
		let tmpHref = String(pHref || '').trim();
		if (!tmpHref)
		{
			return tmpHref;
		}

		let tmpBaseDir = '';
		if (tmpHref.charAt(0) === '/')
		{
			tmpHref = tmpHref.replace(/^\/+/, '');
		}
		else if (pCurrentDocPath)
		{
			let tmpDirParts = String(pCurrentDocPath).split('/');
			tmpDirParts.pop();
			tmpBaseDir = tmpDirParts.join('/');
		}

		return this._resolveRelativeDocPath(tmpBaseDir, tmpHref);
	}

	/**
	 * Check whether a group/module pair exists in the loaded catalog.
	 *
	 * Used by search() to decide whether a result should route to
	 * #/doc/ (catalog module → GitHub raw URL) or #/page/ (local doc).
	 *
	 * @param {string} pGroup - The group key (e.g. "fable")
	 * @param {string} pModule - The module name (e.g. "fable")
	 * @returns {boolean} True if the module is found in the catalog
	 */
	isModuleInCatalog(pGroup, pModule)
	{
		if (!this._Catalog || !this._Catalog.Groups)
		{
			return false;
		}

		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];
			if (tmpGroup.Key !== pGroup)
			{
				continue;
			}

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.Name === pModule)
				{
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Find the catalog group key that contains a given module name.
	 *
	 * Searches all groups in the catalog for a module with the given name.
	 * This is used to resolve sidebar links where the path uses a conceptual
	 * group name (e.g. "fable") that doesn't match the catalog group key
	 * (e.g. "modules").
	 *
	 * @param {string} pModuleName - The module name to find (e.g. "fable")
	 * @returns {string|null} The catalog group key (e.g. "modules") or null
	 */
	findModuleGroupKey(pModuleName)
	{
		if (!this._Catalog || !this._Catalog.Groups)
		{
			return null;
		}

		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];
			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				if (tmpGroup.Modules[j].Name === pModuleName)
				{
					return tmpGroup.Key;
				}
			}
		}

		return null;
	}

	/**
	 * Check whether a group key exists in the loaded catalog.
	 *
	 * Used to dynamically validate group keys instead of hardcoding them.
	 *
	 * @param {string} pGroupKey - The group key (e.g. "fable", "example_applications")
	 * @returns {boolean} True if the group is found in the catalog
	 */
	isGroupInCatalog(pGroupKey)
	{
		if (!this._Catalog || !this._Catalog.Groups)
		{
			return false;
		}

		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			if (this._Catalog.Groups[i].Key === pGroupKey)
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * Search the keyword index for documents matching a query.
	 *
	 * Returns an array of result objects sorted by relevance:
	 *   [{ Key, Title, Group, Module, DocPath, Score, Route }]
	 *
	 * @param {string} pQuery - The search query
	 * @returns {Array} Search results (empty if no index or no matches)
	 */
	search(pQuery)
	{
		if (!this._LunrIndex || !this._KeywordDocuments || !pQuery || !pQuery.trim())
		{
			return [];
		}

		let tmpResults = [];

		try
		{
			let tmpLunrResults = this._LunrIndex.search(pQuery);
			let tmpMode = this.getDocsMode();

			for (let i = 0; i < tmpLunrResults.length; i++)
			{
				let tmpRef = tmpLunrResults[i].ref;
				let tmpScore = tmpLunrResults[i].score;
				let tmpDoc = this._KeywordDocuments[tmpRef];

				if (!tmpDoc)
				{
					continue;
				}

				// Build the hash route for this result based on the site mode.
				let tmpRoute = '';
				if (tmpMode === 'module')
				{
					// Single-module site: every doc is a local page; the
					// keyword-index key is the docs-relative path.
					tmpRoute = '#/page/' + (tmpDoc.DocPath || tmpRef);
				}
				else if (tmpMode === 'ecosystem')
				{
					// Ecosystem: catalog modules render from their GitHub docs.
					if (tmpDoc.Group && tmpDoc.Module && tmpDoc.DocPath)
					{
						tmpRoute = '#/doc/' + tmpDoc.Group + '/' + tmpDoc.Module + '/' + tmpDoc.DocPath;
					}
					else
					{
						tmpRoute = '#/page/' + tmpRef;
					}
				}
				else
				{
					// Legacy keyword index (no Mode stamp) — the pre-Mode
					// heuristic: split the key and check the catalog.
					let tmpParts = tmpRef.split('/');
					if (tmpParts.length >= 2 && this.isModuleInCatalog(tmpParts[0], tmpParts[1]))
					{
						tmpRoute = '#/doc/' + tmpRef;
					}
					else
					{
						tmpRoute = '#/page/' + tmpRef;
					}
				}

				tmpResults.push({
					Key: tmpRef,
					Title: tmpDoc.Title || tmpRef,
					Group: tmpDoc.Group || '',
					Module: tmpDoc.Module || '',
					DocPath: tmpDoc.DocPath || '',
					Score: tmpScore,
					Route: tmpRoute
				});
			}
		}
		catch (pError)
		{
			this.log.warn(`Docuserve: Search error: ${pError}`);
		}

		return tmpResults;
	}

	/**
	 * Get the error page HTML for a given requested path.
	 *
	 * If a custom errorpage.md was loaded, its parsed HTML is returned with
	 * the `{{path}}` placeholder replaced by the actual requested path.
	 * Otherwise a default not-found HTML block is returned.
	 *
	 * @param {string} pRequestedPath - The path that was not found
	 * @returns {string} HTML to display
	 */
	getErrorPageHTML(pRequestedPath)
	{
		let tmpPath = pRequestedPath || 'unknown';

		if (this.pict.AppData.Docuserve.ErrorPageLoaded && this.pict.AppData.Docuserve.ErrorPageHTML)
		{
			// Replace the {{path}} placeholder with the actual requested path
			return this.pict.AppData.Docuserve.ErrorPageHTML.replace(/\{\{path\}\}/g, this._ContentProvider.escapeHTML(tmpPath));
		}

		// Default fallback
		return '<div class="docuserve-not-found">'
			+ '<h2>Page Not Found</h2>'
			+ '<p>The document <code>' + this._ContentProvider.escapeHTML(tmpPath) + '</code> could not be loaded.</p>'
			+ '<p><a href="#/Home">Return to the home page</a></p>'
			+ '</div>';
	}

	/**
	 * Parse _sidebar.md into the SidebarGroups format the sidebar view consumes.
	 *
	 * Returns an array of group objects:
	 *   [{ Name, Key, Route, Modules: [{ Name, HasDocs, Group, Route }] }]
	 *
	 * Top-level items (no indent) become groups.  Indented child items become
	 * modules within the preceding group.  The special "Home" entry is stored
	 * as a group with no modules.
	 *
	 * @param {string} pMarkdown - Raw _sidebar.md content
	 * @returns {Array} Parsed sidebar groups
	 */
	parseSidebarMarkdown(pMarkdown)
	{
		let tmpGroups = [];
		let tmpCurrentGroup = null;
		let tmpLines = pMarkdown.split('\n');

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i];

			if (!tmpLine.trim())
			{
				continue;
			}

			// Detect indent level: child items have 2+ leading spaces
			let tmpIndentMatch = tmpLine.match(/^(\s*)/);
			let tmpIndent = tmpIndentMatch ? tmpIndentMatch[1].length : 0;
			let tmpContent = tmpLine.trim();

			// Must start with a list marker
			let tmpListMatch = tmpContent.match(/^[-*+]\s+(.*)/);
			if (!tmpListMatch)
			{
				continue;
			}

			let tmpItemContent = tmpListMatch[1].trim();

			// Parse link if present: [Text](href)
			let tmpLinkMatch = tmpItemContent.match(/^\[([^\]]+)\]\(([^)]+)\)/);

			if (tmpIndent < 2)
			{
				// Top-level item — this is a group header or standalone link
				if (tmpLinkMatch)
				{
					let tmpName = tmpLinkMatch[1].trim();
					let tmpHref = tmpLinkMatch[2].trim();

					// Derive a group key from the href or name
					let tmpKey = this.deriveGroupKey(tmpName, tmpHref);
					let tmpRoute = this.convertSidebarLink(tmpHref);

					tmpCurrentGroup = {
						Name: tmpName,
						Key: tmpKey,
						Route: tmpRoute,
						Modules: []
					};
					tmpGroups.push(tmpCurrentGroup);
				}
				else
				{
					// Plain text group header (no link)
					let tmpName = tmpItemContent;
					let tmpKey = tmpName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

					tmpCurrentGroup = {
						Name: tmpName,
						Key: tmpKey,
						Route: '',
						Modules: []
					};
					tmpGroups.push(tmpCurrentGroup);
				}
			}
			else if (tmpCurrentGroup)
			{
				// Indented item — this is a module within the current group
				if (tmpLinkMatch)
				{
					let tmpModuleName = tmpLinkMatch[1].trim();
					let tmpModuleHref = tmpLinkMatch[2].trim();
					let tmpModuleRoute = this.convertSidebarLink(tmpModuleHref);

					tmpCurrentGroup.Modules.push({
						Name: tmpModuleName,
						HasDocs: true,
						Group: tmpCurrentGroup.Key,
						Route: tmpModuleRoute
					});
				}
				else
				{
					// Plain text child entry (no docs link)
					tmpCurrentGroup.Modules.push({
						Name: tmpItemContent,
						HasDocs: false,
						Group: tmpCurrentGroup.Key,
						Route: ''
					});
				}
			}
		}

		return tmpGroups;
	}

	/**
	 * Convert a docsify-style sidebar link href into a docuserve hash route.
	 *
	 * Handles these forms:
	 *   /                        -> #/Home
	 *   /group/module/           -> #/doc/group/module
	 *   /group/module/path.md    -> #/doc/group/module/path.md
	 *   something.md             -> #/page/something
	 *
	 * @param {string} pHref - The original sidebar link href
	 * @returns {string} The converted hash route
	 */
	convertSidebarLink(pHref)
	{
		if (!pHref)
		{
			return '';
		}

		// Already a fully-formed hash route (e.g. "#/page/examples/foo/README").
		// Pass it straight through — the author has named the exact route, so
		// do not re-derive one (re-deriving would mangle it into "#/page/#/...").
		if (pHref.match(/^#\//))
		{
			return pHref;
		}

		// Root home link
		if (pHref === '/')
		{
			return '#/Home';
		}

		// Bare hash link (e.g. "#fable") — docsify convention for the home/readme page.
		// Navigate to the first available content route in the sidebar, skipping
		// #/Home since the cover page is already displaying that.
		if (pHref.match(/^#[^/]/))
		{
			let tmpSidebarGroups = this.pict.AppData.Docuserve.SidebarGroups;
			if (tmpSidebarGroups)
			{
				for (let g = 0; g < tmpSidebarGroups.length; g++)
				{
					let tmpModules = tmpSidebarGroups[g].Modules;
					if (tmpModules)
					{
						for (let m = 0; m < tmpModules.length; m++)
						{
							if (tmpModules[m].HasDocs && tmpModules[m].Route && tmpModules[m].Route !== '#/Home')
							{
								return tmpModules[m].Route;
							}
						}
					}
					if (tmpSidebarGroups[g].Route && tmpSidebarGroups[g].Route !== '#/Home')
					{
						return tmpSidebarGroups[g].Route;
					}
				}
			}
			return '#/Home';
		}

		// Static .html pages (built example apps, etc.) — link straight to
		// the file rather than SPA-routing it through #/page/.  Scoped
		// strictly to the .html extension.
		if (pHref.match(/\.html($|[?#])/i) && !pHref.match(/^[a-z][a-z0-9+.-]*:/i))
		{
			return pHref;
		}

		// Single-module docs site: every internal reference is a local page —
		// no catalog #/doc/ routing, no group/module guesswork.
		if (this.getDocsMode() === 'module')
		{
			return this._toModulePageRoute(pHref);
		}

		// Strip leading/trailing slashes for parsing
		let tmpPath = pHref.replace(/^\//, '').replace(/\/$/, '');

		if (!tmpPath)
		{
			return '#/Home';
		}

		let tmpParts = tmpPath.split('/');

		// Check if it's a module path (group/module) — both the group
		// AND the module must exist in the catalog, otherwise treat it
		// as a local page reference (e.g. docs subfolder).
		if (tmpParts.length >= 2)
		{
			if (this.isGroupInCatalog(tmpParts[0]) && this.isModuleInCatalog(tmpParts[0], tmpParts[1]))
			{
				return '#/doc/' + tmpPath;
			}

			// Fallback: the path may use a conceptual group name (e.g. "fable/fable")
			// where the first part isn't a catalog group key. Try to find the module
			// (second part) in any catalog group and rewrite the route.
			let tmpActualGroup = this.findModuleGroupKey(tmpParts[1]);
			if (tmpActualGroup)
			{
				let tmpRemainder = tmpParts.slice(2).join('/');
				if (tmpRemainder)
				{
					return '#/doc/' + tmpActualGroup + '/' + tmpParts[1] + '/' + tmpRemainder;
				}
				return '#/doc/' + tmpActualGroup + '/' + tmpParts[1];
			}
		}

		// Local page reference
		if (tmpPath.match(/\.md$/))
		{
			return '#/page/' + tmpPath.replace(/\.md$/, '');
		}

		return '#/page/' + tmpPath;
	}

	/**
	 * Derive a short group key from a sidebar group name or href.
	 *
	 * @param {string} pName - The display name (e.g. "Fable — Core Ecosystem")
	 * @param {string} pHref - The link href (e.g. "fable.md")
	 * @returns {string} A short key (e.g. "fable")
	 */
	deriveGroupKey(pName, pHref)
	{
		// Try href first — "fable.md" -> "fable"
		if (pHref && pHref !== '/')
		{
			let tmpFromHref = pHref.replace(/^\//, '').replace(/\.md$/, '').replace(/\/$/, '');
			if (tmpFromHref && !tmpFromHref.includes('/'))
			{
				return tmpFromHref.toLowerCase();
			}
		}

		// Fall back to first word of name lowercased
		let tmpFirstWord = pName.split(/[\s—\-:]+/)[0];
		return tmpFirstWord.toLowerCase().replace(/[^a-z0-9]/g, '');
	}

	/**
	 * Build structured sidebar data from the catalog for the sidebar view.
	 *
	 * @param {Object} pCatalog - The parsed retold-catalog.json
	 */
	buildSidebarData(pCatalog)
	{
		let tmpSidebarGroups = [];

		for (let i = 0; i < pCatalog.Groups.length; i++)
		{
			let tmpGroup = pCatalog.Groups[i];
			let tmpGroupEntry = {
				Name: tmpGroup.Name,
				Key: tmpGroup.Key,
				Description: tmpGroup.Description,
				Modules: []
			};

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				tmpGroupEntry.Modules.push({
					Name: tmpModule.Name,
					HasDocs: tmpModule.HasDocs,
					Group: tmpGroup.Key,
					Route: '#/doc/' + tmpGroup.Key + '/' + tmpModule.Name
				});
			}

			tmpSidebarGroups.push(tmpGroupEntry);
		}

		this.pict.AppData.Docuserve.SidebarGroups = tmpSidebarGroups;
	}

	/**
	 * Resolve a document URL from group/module/path to a fetchable URL.
	 *
	 * @param {string} pGroup - The group key (e.g. 'fable')
	 * @param {string} pModule - The module name (e.g. 'fable')
	 * @param {string} pPath - The document path within the module docs (e.g. 'README.md')
	 * @returns {string} The resolved URL
	 */
	resolveDocumentURL(pGroup, pModule, pPath)
	{
		if (!this._Catalog)
		{
			return null;
		}

		let tmpOrg = this._Catalog.GitHubOrg || 'stevenvelozo';
		let tmpDefaultBranch = this._Catalog.DefaultBranch || 'master';

		// Find the module in the catalog
		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];
			if (tmpGroup.Key !== pGroup)
			{
				continue;
			}

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.Name !== pModule)
				{
					continue;
				}

				let tmpBranch = tmpModule.Branch || tmpDefaultBranch;
				let tmpDocPath = pPath || 'README.md';
				return 'https://raw.githubusercontent.com/' + tmpOrg + '/' + tmpModule.Repo + '/' + tmpBranch + '/docs/' + tmpDocPath;
			}
		}

		return null;
	}

	/**
	 * Resolve a GitHub repository URL to an internal hash route.
	 *
	 * If the URL matches a module in the loaded catalog, returns the
	 * corresponding #/doc/ route so the link navigates within docuserve
	 * instead of leaving to GitHub.
	 *
	 * @param {string} pURL - A GitHub URL (e.g. "https://github.com/stevenvelozo/fable")
	 * @returns {string|null} The hash route (e.g. "#/doc/fable/fable") or null if not a catalog module
	 */
	resolveGitHubURLToRoute(pURL)
	{
		if (!this._Catalog || !this._Catalog.Groups || !pURL)
		{
			return null;
		}

		// Match https://github.com/{org}/{repo} with optional trailing path/slash
		let tmpMatch = pURL.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)/);
		if (!tmpMatch)
		{
			return null;
		}

		let tmpOrg = tmpMatch[1];
		let tmpRepo = tmpMatch[2];

		// Only resolve URLs that match the catalog's GitHub org
		if (tmpOrg !== this._Catalog.GitHubOrg)
		{
			return null;
		}

		// Search catalog for a module with a matching Repo
		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.Repo === tmpRepo)
				{
					return '#/doc/' + tmpGroup.Key + '/' + tmpModule.Name;
				}
			}
		}

		return null;
	}

	/**
	 * Resolve the GitHub Pages documentation URL for a module.
	 *
	 * Returns a URL like https://stevenvelozo.github.io/pict-view/ if the
	 * module exists in the catalog.
	 *
	 * @param {string} pGroup - The group key
	 * @param {string} pModule - The module name
	 * @returns {string|null} The GitHub Pages URL or null
	 */
	resolveGitHubPagesURL(pGroup, pModule)
	{
		if (!this._Catalog || !this._Catalog.Groups)
		{
			return null;
		}

		let tmpOrg = this._Catalog.GitHubOrg || 'stevenvelozo';

		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];
			if (tmpGroup.Key !== pGroup)
			{
				continue;
			}

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.Name !== pModule)
				{
					continue;
				}

				if (!tmpModule.HasDocs)
				{
					return null;
				}

				return 'https://' + tmpOrg + '.github.io/' + tmpModule.Repo + '/';
			}
		}

		return null;
	}

	/**
	 * Get the module-specific sidebar entries for a given group/module.
	 *
	 * @param {string} pGroup - The group key
	 * @param {string} pModule - The module name
	 * @returns {Array|null} The sidebar entries or null
	 */
	getModuleSidebar(pGroup, pModule)
	{
		if (!this._Catalog)
		{
			return null;
		}

		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];
			if (tmpGroup.Key !== pGroup)
			{
				continue;
			}

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.Name !== pModule)
				{
					continue;
				}

				return tmpModule.Sidebar || null;
			}
		}

		return null;
	}

	/**
	 * Decide whether the **Fable bottom-drawer** playground panel should
	 * be enabled for the given group/module.
	 *
	 * Resolution order:
	 *   1. If `_playground.json` is cached AND its `Kind` is `"section"`,
	 *      return false.  Section-playground modules use the full-page
	 *      `#/playground/section` route and explicitly do NOT want the
	 *      Fable JS REPL drawer popping up on every doc page.
	 *   2. Otherwise the opt-in signal is a `playground.md` entry in the
	 *      module's sidebar (catalog mode) or the root SidebarGroups
	 *      (standalone mode).  Presence of that entry → drawer + tab
	 *      strip + "Try in Playground" buttons on code blocks.
	 *
	 * The cache is populated by `loadPlaygroundConfig()` (called on each
	 * navigation by `_syncPlaygroundVisibility`).  On the first visit to
	 * a module, the cache may not yet be populated — this method
	 * conservatively falls through to the sidebar check, and the caller
	 * re-invokes once the async config load resolves.
	 *
	 * @param {string} [pGroup]  - Current group key (may be empty)
	 * @param {string} [pModule] - Current module name (may be empty)
	 * @returns {boolean}
	 */
	isPlaygroundEnabled(pGroup, pModule)
	{
		// Check the _playground.json cache for an explicit Kind: 'section'
		// declaration — that module uses the full-page playground and
		// the Fable drawer must stay out of its way on every doc page,
		// not just on the playground route itself.
		let tmpCacheKey = (pGroup || '') + '/' + (pModule || '');
		if (Object.prototype.hasOwnProperty.call(this._PlaygroundConfigCache, tmpCacheKey))
		{
			let tmpConfig = this._PlaygroundConfigCache[tmpCacheKey];
			if (tmpConfig && tmpConfig.Kind === 'section')
			{
				return false;
			}
		}

		// Per-module sidebar (catalog mode).
		if (pGroup && pModule)
		{
			let tmpSidebar = this.getModuleSidebar(pGroup, pModule);
			if (Array.isArray(tmpSidebar) && this._sidebarEntriesIncludePlayground(tmpSidebar))
			{
				return true;
			}
		}
		// Root sidebar (standalone-mode fallback) — checks both group-level
		// Route entries and per-module Route entries for a playground link.
		let tmpGroups = this.pict.AppData.Docuserve.SidebarGroups;
		if (Array.isArray(tmpGroups) && this._sidebarGroupsIncludePlayground(tmpGroups))
		{
			return true;
		}
		return false;
	}

	/**
	 * Recursive search for a playground.md path in a per-module Sidebar
	 * tree (shape: `[{Title, Path}|{Title, Children:[...]}]`).
	 */
	_sidebarEntriesIncludePlayground(pEntries)
	{
		for (let i = 0; i < pEntries.length; i++)
		{
			let tmpEntry = pEntries[i];
			if (typeof tmpEntry.Path === 'string' && /(^|\/)playground\.md$/i.test(tmpEntry.Path))
			{
				return true;
			}
			if (Array.isArray(tmpEntry.Children)
				&& this._sidebarEntriesIncludePlayground(tmpEntry.Children))
			{
				return true;
			}
		}
		return false;
	}

	/**
	 * Search the root SidebarGroups (shape from parseSidebarMarkdown:
	 * `[{Name, Route, Modules: [{Name, Route, ...}]}]`) for a playground
	 * route.  Used in standalone mode where there's no catalog.
	 *
	 * `convertSidebarLink('playground.md')` strips the `.md` and emits
	 * `#/page/playground`, so we match either the raw filename OR the
	 * page route.
	 */
	_sidebarGroupsIncludePlayground(pGroups)
	{
		let tmpRegex = /(^|\/)playground(\.md|$)/i;
		for (let i = 0; i < pGroups.length; i++)
		{
			let tmpGroup = pGroups[i];
			if (typeof tmpGroup.Route === 'string' && tmpRegex.test(tmpGroup.Route))
			{
				return true;
			}
			if (Array.isArray(tmpGroup.Modules))
			{
				for (let j = 0; j < tmpGroup.Modules.length; j++)
				{
					let tmpMod = tmpGroup.Modules[j];
					if (typeof tmpMod.Route === 'string' && tmpRegex.test(tmpMod.Route))
					{
						return true;
					}
				}
			}
		}
		return false;
	}

	/**
	 * Fetch a markdown document and convert it to HTML.
	 *
	 * @param {string} pURL - The URL to fetch
	 * @param {Function} fCallback - Callback receiving (error, htmlContent)
	 * @param {string} [pCurrentGroup] - The current group key for link resolution
	 * @param {string} [pCurrentModule] - The current module name for link resolution
	 * @param {string} [pCurrentDocPath] - The current document path for link resolution
	 */
	fetchDocument(pURL, fCallback, pCurrentGroup, pCurrentModule, pCurrentDocPath)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};

		if (!pURL)
		{
			return tmpCallback('No URL provided', '');
		}

		// Check cache
		if (this._ContentCache[pURL])
		{
			return tmpCallback(null, this._ContentCache[pURL]);
		}

		fetch(pURL)
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					return tmpCallback('Document not found', this.getErrorPageHTML(pURL));
				}

				let tmpHTML = this._ContentProvider.parseMarkdown(pMarkdown, this._createLinkResolver(pCurrentGroup, pCurrentModule, pCurrentDocPath), this._createImageResolver(pURL));
				this._ContentCache[pURL] = tmpHTML;
				return tmpCallback(null, tmpHTML);
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error fetching document [${pURL}]: ${pError}`);
				return tmpCallback(pError, this.getErrorPageHTML(pURL));
			});
	}

	/**
	 * Fetch a local document relative to the docs folder.
	 *
	 * @param {string} pPath - The relative path (e.g. 'architecture.md')
	 * @param {Function} fCallback - Callback receiving (error, htmlContent)
	 * @param {string} [pCurrentGroup] - The current group key for link resolution
	 * @param {string} [pCurrentModule] - The current module name for link resolution
	 * @param {string} [pCurrentDocPath] - The current document path for link resolution
	 */
	fetchLocalDocument(pPath, fCallback, pCurrentGroup, pCurrentModule, pCurrentDocPath)
	{
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';
		let tmpURL = tmpDocsBase + pPath;
		this.fetchDocument(tmpURL, fCallback, pCurrentGroup, pCurrentModule, pCurrentDocPath);
	}

	/**
	 * Convert a docsify-style internal link to a hash route for docuserve.
	 *
	 * When module context is provided, relative links (e.g. "api.md" or
	 * "./settings-manager.md") are resolved within the current module and
	 * document directory rather than falling back to the docs root.
	 *
	 * @param {string} pHref - The original link href
	 * @param {string} [pCurrentGroup] - The current group key (e.g. "fable")
	 * @param {string} [pCurrentModule] - The current module name (e.g. "fable")
	 * @param {string} [pCurrentDocPath] - The current document path within the module (e.g. "services/README.md")
	 * @returns {string} The converted hash route
	 */
	convertDocLink(pHref, pCurrentGroup, pCurrentModule, pCurrentDocPath)
	{
		// Single-module docs site: every internal reference is a local page,
		// resolved relative to the current document's directory.
		if (this.getDocsMode() === 'module')
		{
			return this._toModulePageRoute(pHref, pCurrentDocPath);
		}

		// Strip leading ./ prefix for relative paths
		let tmpPath = pHref.replace(/^\.\//, '');
		// Remove leading slash
		tmpPath = tmpPath.replace(/^\//, '');

		// If it looks like an absolute module path (group/module/...), route directly.
		// Both the group AND the module must exist in the catalog, otherwise treat
		// as a local page reference (e.g. docs subfolder like modules/modules.md).
		let tmpParts = tmpPath.split('/');
		if (tmpParts.length >= 2)
		{
			if (this.isGroupInCatalog(tmpParts[0]) && this.isModuleInCatalog(tmpParts[0], tmpParts[1]))
			{
				return '#/doc/' + tmpPath;
			}
		}

		// If we have module context, resolve relative to current document's directory
		if (pCurrentGroup && pCurrentModule)
		{
			// Determine the directory of the current document
			let tmpDocDir = '';
			if (pCurrentDocPath)
			{
				let tmpDirParts = pCurrentDocPath.split('/');
				if (tmpDirParts.length > 1)
				{
					tmpDirParts.pop(); // Remove filename
					tmpDocDir = tmpDirParts.join('/') + '/';
				}
			}
			return '#/doc/' + pCurrentGroup + '/' + pCurrentModule + '/' + tmpDocDir + tmpPath;
		}

		// Local doc page (no module context)
		if (tmpPath.match(/\.md$/))
		{
			let tmpPageKey = tmpPath.replace(/\.md$/, '');
			return '#/page/' + tmpPageKey;
		}

		return '#/page/' + tmpPath;
	}

}

module.exports = DocuserveDocumentationProvider;

module.exports.default_configuration =
{
	ProviderIdentifier: "Docuserve-Documentation",

	AutoInitialize: true,
	AutoInitializeOrdinal: 0
};
