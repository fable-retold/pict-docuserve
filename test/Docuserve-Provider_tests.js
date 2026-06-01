/**
* Unit tests for Pict Docuserve Documentation Provider
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var Chai = require("chai");
var Expect = Chai.expect;

var libPict = require('pict');
var libDocuserveProvider = require('../source/providers/Pict-Provider-Docuserve-Documentation.js');

// A mock catalog matching the retold structure
var _MockCatalog =
{
	Generated: '2026-01-01T00:00:00.000Z',
	GitHubOrg: 'stevenvelozo',
	DefaultBranch: 'master',
	Groups:
	[
		{
			Name: 'Fable',
			Key: 'fable',
			Description: 'Core ecosystem',
			Modules:
			[
				{ Name: 'fable', Repo: 'fable', Group: 'fable', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'fable-log', Repo: 'fable-log', Group: 'fable', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'fable-serviceproviderbase', Repo: 'fable-serviceproviderbase', Group: 'fable', Branch: 'master', HasDocs: true, Sidebar: [] }
			]
		},
		{
			Name: 'Meadow',
			Key: 'meadow',
			Description: 'Data access layer',
			Modules:
			[
				{ Name: 'meadow', Repo: 'meadow', Group: 'meadow', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'foxhound', Repo: 'foxhound', Group: 'meadow', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'meadow-endpoints', Repo: 'meadow-endpoints', Group: 'meadow', Branch: 'develop', HasDocs: false, Sidebar: [] }
			]
		},
		{
			Name: 'Pict',
			Key: 'pict',
			Description: 'UI framework',
			Modules:
			[
				{ Name: 'pict', Repo: 'pict', Group: 'pict', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'pict-template', Repo: 'pict-template', Group: 'pict', Branch: 'master', HasDocs: true, Sidebar: [] }
			]
		},
		{
			Name: 'Utility',
			Key: 'utility',
			Description: 'Build tools',
			Modules:
			[
				{ Name: 'precedent', Repo: 'precedent', Group: 'utility', Branch: 'master', HasDocs: false, Sidebar: [] }
			]
		}
	]
};

/**
 * Create a provider instance with a pre-loaded mock catalog.
 */
var createProvider = () =>
{
	let tmpPict = new libPict();
	let tmpEnvironment = new libPict.EnvironmentLog(tmpPict);

	tmpPict.AppData.Docuserve =
	{
		CatalogLoaded: false,
		Catalog: null,
		SidebarGroups: [],
		DocsBaseURL: ''
	};

	let tmpProvider = tmpPict.addProvider('Docuserve-Documentation', libDocuserveProvider.default_configuration, libDocuserveProvider);

	// Inject the mock catalog directly
	tmpProvider._Catalog = _MockCatalog;
	tmpPict.AppData.Docuserve.Catalog = _MockCatalog;
	tmpPict.AppData.Docuserve.CatalogLoaded = true;

	return tmpProvider;
};

suite
(
	'Pict Docuserve Documentation Provider',
	function()
	{
		setup
		(
			() =>
			{
			}
		);

		suite
		(
			'Object Sanity',
			function()
			{
				test
				(
					'The provider should initialize itself into a happy little object.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider).to.be.an('object', 'Provider should initialize as an object.');
						Expect(tmpProvider._Catalog).to.be.an('object', 'Catalog should be loaded.');
						Expect(tmpProvider._ContentCache).to.be.an('object', 'Content cache should exist.');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Catalog Lookups',
			function()
			{
				test
				(
					'isGroupInCatalog should find known groups.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.isGroupInCatalog('fable')).to.equal(true);
						Expect(tmpProvider.isGroupInCatalog('meadow')).to.equal(true);
						Expect(tmpProvider.isGroupInCatalog('pict')).to.equal(true);
						Expect(tmpProvider.isGroupInCatalog('utility')).to.equal(true);
						fDone();
					}
				);
				test
				(
					'isGroupInCatalog should return false for unknown groups.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.isGroupInCatalog('nonexistent')).to.equal(false);
						Expect(tmpProvider.isGroupInCatalog('')).to.equal(false);
						Expect(tmpProvider.isGroupInCatalog(null)).to.equal(false);
						fDone();
					}
				);
				test
				(
					'isGroupInCatalog should handle missing catalog gracefully.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.isGroupInCatalog('fable')).to.equal(false);
						fDone();
					}
				);
				test
				(
					'isModuleInCatalog should find known modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.isModuleInCatalog('fable', 'fable')).to.equal(true);
						Expect(tmpProvider.isModuleInCatalog('fable', 'fable-log')).to.equal(true);
						Expect(tmpProvider.isModuleInCatalog('meadow', 'foxhound')).to.equal(true);
						Expect(tmpProvider.isModuleInCatalog('pict', 'pict-template')).to.equal(true);
						Expect(tmpProvider.isModuleInCatalog('utility', 'precedent')).to.equal(true);
						fDone();
					}
				);
				test
				(
					'isModuleInCatalog should return false for wrong group/module combos.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// Right module, wrong group
						Expect(tmpProvider.isModuleInCatalog('pict', 'fable')).to.equal(false);
						// Nonexistent module
						Expect(tmpProvider.isModuleInCatalog('fable', 'nonexistent')).to.equal(false);
						// Nonexistent group
						Expect(tmpProvider.isModuleInCatalog('fake', 'fable')).to.equal(false);
						fDone();
					}
				);
				test
				(
					'isModuleInCatalog should handle missing catalog gracefully.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.isModuleInCatalog('fable', 'fable')).to.equal(false);
						fDone();
					}
				);
			}
		);

		suite
		(
			'GitHub URL Resolution',
			function()
			{
				test
				(
					'resolveGitHubURLToRoute should resolve known catalog modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable')).to.equal('#/doc/fable/fable');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable-log')).to.equal('#/doc/fable/fable-log');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/foxhound')).to.equal('#/doc/meadow/foxhound');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/pict')).to.equal('#/doc/pict/pict');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/pict-template')).to.equal('#/doc/pict/pict-template');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/precedent')).to.equal('#/doc/utility/precedent');
						fDone();
					}
				);
				test
				(
					'the link resolver leaves github.com links external (no hijacking).',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResolver = tmpProvider._createLinkResolver('pict', 'pict', 'README.md');
						// github.com URLs must NOT be auto-rewritten into internal #/doc/ routes;
						// returning null lets the content renderer emit a normal external link.
						Expect(tmpResolver('https://github.com/stevenvelozo/fable', 'Source')).to.equal(null);
						Expect(tmpResolver('https://github.com/stevenvelozo/pict/blob/main/source/Pict.js', 'Pict.js')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should handle trailing slashes and paths.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable/')).to.equal('#/doc/fable/fable');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable/tree/master')).to.equal('#/doc/fable/fable');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/meadow-endpoints/issues')).to.equal('#/doc/meadow/meadow-endpoints');
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should return null for unknown repos.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/nonexistent')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should return null for different GitHub orgs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/otherorg/fable')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/facebook/react')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should return null for non-GitHub URLs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://npmjs.com/package/fable')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('https://example.com/stevenvelozo/fable')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should handle edge cases gracefully.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute(null)).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('not a url')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should handle http URLs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('http://github.com/stevenvelozo/fable')).to.equal('#/doc/fable/fable');
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute with no catalog should return null.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable')).to.equal(null);
						fDone();
					}
				);
			}
		);

		suite
		(
			'GitHub Repo URL Resolution',
			function()
			{
				test
				(
					'resolveGitHubRepoURL should return the source repo URL for catalog modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubRepoURL('fable', 'fable')).to.equal('https://github.com/stevenvelozo/fable');
						Expect(tmpProvider.resolveGitHubRepoURL('meadow', 'foxhound')).to.equal('https://github.com/stevenvelozo/foxhound');
						Expect(tmpProvider.resolveGitHubRepoURL('pict', 'pict-template')).to.equal('https://github.com/stevenvelozo/pict-template');
						fDone();
					}
				);
				test
				(
					'resolveGitHubRepoURL should return a repo URL even when the module has no docs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// A repo exists regardless of whether it publishes a docs site, so the
						// "view source" link is still offered when resolveGitHubPagesURL is null.
						Expect(tmpProvider.resolveGitHubPagesURL('meadow', 'meadow-endpoints')).to.equal(null);
						Expect(tmpProvider.resolveGitHubRepoURL('meadow', 'meadow-endpoints')).to.equal('https://github.com/stevenvelozo/meadow-endpoints');
						Expect(tmpProvider.resolveGitHubRepoURL('utility', 'precedent')).to.equal('https://github.com/stevenvelozo/precedent');
						fDone();
					}
				);
				test
				(
					'resolveGitHubRepoURL should return null for unknown modules and no catalog.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubRepoURL('fable', 'nonexistent')).to.equal(null);
						Expect(tmpProvider.resolveGitHubRepoURL('nogroup', 'fable')).to.equal(null);
						tmpProvider._Catalog = null;
						Expect(tmpProvider.resolveGitHubRepoURL('fable', 'fable')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubRepoURL should resolve a module-mode catalog (per-module docs site).',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// A per-module site serves a module-mode catalog: one Module, empty Groups.
						// Its route handlers leave CurrentModule blank, so a blank module name must
						// still resolve the single documented module (this powers the topbar octocat).
						tmpProvider._Catalog =
						{
							Mode: 'module',
							GitHubOrg: 'stevenvelozo',
							Module: { Name: 'ultravisor-file-stream', Repo: 'ultravisor-file-stream', Group: '', HasDocs: true },
							Groups: []
						};
						Expect(tmpProvider.resolveGitHubRepoURL('', '')).to.equal('https://github.com/stevenvelozo/ultravisor-file-stream');
						Expect(tmpProvider.resolveGitHubRepoURL('', 'ultravisor-file-stream')).to.equal('https://github.com/stevenvelozo/ultravisor-file-stream');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Document URL Resolution',
			function()
			{
				test
				(
					'resolveDocumentURL should build correct raw GitHub URLs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpURL = tmpProvider.resolveDocumentURL('fable', 'fable', 'README.md');
						Expect(tmpURL).to.equal('https://raw.githubusercontent.com/stevenvelozo/fable/master/docs/README.md');
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL should default path to README.md.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpURL = tmpProvider.resolveDocumentURL('fable', 'fable');
						Expect(tmpURL).to.equal('https://raw.githubusercontent.com/stevenvelozo/fable/master/docs/README.md');
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL should use module-specific branch.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpURL = tmpProvider.resolveDocumentURL('meadow', 'meadow-endpoints', 'api.md');
						Expect(tmpURL).to.equal('https://raw.githubusercontent.com/stevenvelozo/meadow-endpoints/develop/docs/api.md');
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL should handle nested paths.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpURL = tmpProvider.resolveDocumentURL('fable', 'fable', 'services/logging.md');
						Expect(tmpURL).to.equal('https://raw.githubusercontent.com/stevenvelozo/fable/master/docs/services/logging.md');
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL should return null for unknown modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveDocumentURL('fable', 'nonexistent', 'README.md')).to.equal(null);
						Expect(tmpProvider.resolveDocumentURL('fake', 'fable', 'README.md')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL with no catalog should return null.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.resolveDocumentURL('fable', 'fable', 'README.md')).to.equal(null);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Sidebar Link Conversion',
			function()
			{
				test
				(
					'convertSidebarLink should convert root to Home.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('/')).to.equal('#/Home');
						fDone();
					}
				);
				test
				(
					'convertSidebarLink should convert catalog module paths to doc routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('/fable/fable/')).to.equal('#/doc/fable/fable');
						Expect(tmpProvider.convertSidebarLink('/meadow/foxhound/')).to.equal('#/doc/meadow/foxhound');
						Expect(tmpProvider.convertSidebarLink('/pict/pict/')).to.equal('#/doc/pict/pict');
						fDone();
					}
				);
				test
				(
					'convertSidebarLink should convert .md files to page routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('architecture.md')).to.equal('#/page/architecture');
						Expect(tmpProvider.convertSidebarLink('getting-started.md')).to.equal('#/page/getting-started');
						fDone();
					}
				);
				test
				(
					'convertSidebarLink should handle non-catalog paths as page routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('/unknown/path/')).to.equal('#/page/unknown/path');
						fDone();
					}
				);
				test
				(
					'convertSidebarLink should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('')).to.equal('');
						Expect(tmpProvider.convertSidebarLink(null)).to.equal('');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Document Link Conversion',
			function()
			{
				test
				(
					'convertDocLink should handle absolute catalog paths.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// Trailing slash is preserved in the route
						Expect(tmpProvider.convertDocLink('/fable/fable/')).to.equal('#/doc/fable/fable/');
						Expect(tmpProvider.convertDocLink('/meadow/foxhound/api.md')).to.equal('#/doc/meadow/foxhound/api.md');
						fDone();
					}
				);
				test
				(
					'convertDocLink should resolve relative paths within module context.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// Relative link within fable/fable docs
						Expect(tmpProvider.convertDocLink('api.md', 'fable', 'fable')).to.equal('#/doc/fable/fable/api.md');
						Expect(tmpProvider.convertDocLink('./api.md', 'fable', 'fable')).to.equal('#/doc/fable/fable/api.md');
						fDone();
					}
				);
				test
				(
					'convertDocLink should resolve relative paths within subdirectories.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// When viewing fable/fable/services/README.md, a relative link to logging.md
						Expect(tmpProvider.convertDocLink('logging.md', 'fable', 'fable', 'services/README.md')).to.equal('#/doc/fable/fable/services/logging.md');
						fDone();
					}
				);
				test
				(
					'convertDocLink should fall back to page routes without module context.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertDocLink('architecture.md')).to.equal('#/page/architecture');
						Expect(tmpProvider.convertDocLink('getting-started.md')).to.equal('#/page/getting-started');
						fDone();
					}
				);
				test
				(
					'convertDocLink should handle non-catalog absolute paths as page routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertDocLink('/unknown/path')).to.equal('#/page/unknown/path');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Module-Mode Link Resolution',
			function()
			{
				test
				(
					'_toModulePageRoute resolves a sibling link against the current document directory.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._toModulePageRoute('001-select.md', 'input_providers/README.md')).to.equal('#/page/input_providers/001-select');
						Expect(tmpProvider._toModulePageRoute('./settings-manager.md', 'services/README.md')).to.equal('#/page/services/settings-manager');
						fDone();
					}
				);
				test
				(
					'_toModulePageRoute resolves ../ against the current document directory.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._toModulePageRoute('../../Layouts.md', 'examples/gradebook/README.md')).to.equal('#/page/Layouts');
						Expect(tmpProvider._toModulePageRoute('../Configuration.md', 'input_providers/001-select.md')).to.equal('#/page/Configuration');
						fDone();
					}
				);
				test
				(
					'_toModulePageRoute treats a /-rooted href as docs-root-relative.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._toModulePageRoute('/Configuration.md', 'examples/gradebook/README.md')).to.equal('#/page/Configuration');
						fDone();
					}
				);
				test
				(
					'_toModulePageRoute clamps ../ at the docs root.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._toModulePageRoute('../../../../Layouts.md', 'examples/gradebook/README.md')).to.equal('#/page/Layouts');
						fDone();
					}
				);
				test
				(
					'_toModulePageRoute resolves from the docs root when no document path is given.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._toModulePageRoute('input_providers/001-select.md')).to.equal('#/page/input_providers/001-select');
						Expect(tmpProvider._toModulePageRoute('/')).to.equal('#/Home');
						fDone();
					}
				);
				test
				(
					'convertDocLink resolves module-mode links against the current document directory.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = { Mode: 'module', Groups: [] };
						Expect(tmpProvider.convertDocLink('../../Solvers.md', '', '', 'examples/gradebook/README.md')).to.equal('#/page/Solvers');
						Expect(tmpProvider.convertDocLink('002-datetime.md', '', '', 'input_providers/001-select.md')).to.equal('#/page/input_providers/002-datetime');
						fDone();
					}
				);
				test
				(
					'_toModuleAssetHref resolves a relative asset link against the current document directory.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._toModuleAssetHref('index.html', 'examples/gradebook/README.md')).to.equal('examples/gradebook/index.html');
						Expect(tmpProvider._toModuleAssetHref('../assets/diagram.svg', 'examples/gradebook/README.md')).to.equal('examples/assets/diagram.svg');
						fDone();
					}
				);
				test
				(
					'_toModuleAssetHref treats a /-rooted asset link as docs-root-relative.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._toModuleAssetHref('/shared/logo.png', 'examples/gradebook/README.md')).to.equal('shared/logo.png');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Sidebar Markdown Parsing',
			function()
			{
				test
				(
					'parseSidebarMarkdown should parse groups and modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpSidebar = tmpProvider.parseSidebarMarkdown(
							'- [Home](/)\n'
							+ '- [Fable — Core Ecosystem](fable.md)\n'
							+ '  - [fable](/fable/fable/)\n'
							+ '  - [fable-log](/fable/fable-log/)\n'
							+ '- [Meadow — Data Access](meadow.md)\n'
							+ '  - [meadow](/meadow/meadow/)\n'
						);
						Expect(tmpSidebar).to.be.an('array');
						Expect(tmpSidebar.length).to.equal(3);

						// Home group
						Expect(tmpSidebar[0].Name).to.equal('Home');
						Expect(tmpSidebar[0].Route).to.equal('#/Home');
						Expect(tmpSidebar[0].Modules.length).to.equal(0);

						// Fable group
						Expect(tmpSidebar[1].Name).to.equal('Fable — Core Ecosystem');
						Expect(tmpSidebar[1].Key).to.equal('fable');
						Expect(tmpSidebar[1].Modules.length).to.equal(2);
						Expect(tmpSidebar[1].Modules[0].Name).to.equal('fable');
						Expect(tmpSidebar[1].Modules[0].Route).to.equal('#/doc/fable/fable');
						Expect(tmpSidebar[1].Modules[1].Name).to.equal('fable-log');

						// Meadow group
						Expect(tmpSidebar[2].Name).to.equal('Meadow — Data Access');
						Expect(tmpSidebar[2].Key).to.equal('meadow');
						Expect(tmpSidebar[2].Modules.length).to.equal(1);
						fDone();
					}
				);
				test
				(
					'parseSidebarMarkdown should handle plain text group headers.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpSidebar = tmpProvider.parseSidebarMarkdown(
							'- Getting Started\n'
							+ '  - [Architecture](architecture.md)\n'
						);
						Expect(tmpSidebar.length).to.equal(1);
						Expect(tmpSidebar[0].Name).to.equal('Getting Started');
						Expect(tmpSidebar[0].Route).to.equal('');
						Expect(tmpSidebar[0].Modules.length).to.equal(1);
						Expect(tmpSidebar[0].Modules[0].Name).to.equal('Architecture');
						fDone();
					}
				);
				test
				(
					'parseSidebarMarkdown should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpSidebar = tmpProvider.parseSidebarMarkdown('');
						Expect(tmpSidebar).to.be.an('array');
						Expect(tmpSidebar.length).to.equal(0);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Cover Markdown Parsing',
			function()
			{
				test
				(
					'parseCover should extract all cover components.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpCover = tmpProvider.parseCover(
							'# Retold\n'
							+ '> A story-obsessed application suite\n'
							+ 'Build amazing web applications.\n'
							+ '- **Fable** — Core ecosystem\n'
							+ '- **Meadow** — Data access layer\n'
							+ '[Get Started](getting-started.md)\n'
							+ '[GitHub](https://github.com/stevenvelozo/retold)\n'
						);
						Expect(tmpCover).to.be.an('object');
						Expect(tmpCover.Title).to.equal('Retold');
						Expect(tmpCover.Tagline).to.equal('A story-obsessed application suite');
						Expect(tmpCover.Description).to.equal('Build amazing web applications.');
						Expect(tmpCover.Highlights.length).to.equal(2);
						Expect(tmpCover.Highlights[0].Label).to.equal('Fable');
						Expect(tmpCover.Highlights[0].Text).to.equal('Core ecosystem');
						Expect(tmpCover.Highlights[1].Label).to.equal('Meadow');
						Expect(tmpCover.Actions.length).to.equal(2);
						Expect(tmpCover.Actions[0].Text).to.equal('Get Started');
						Expect(tmpCover.Actions[0].Href).to.equal('getting-started.md');
						fDone();
					}
				);
				test
				(
					'parseCover should handle minimal input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpCover = tmpProvider.parseCover('# My Docs\n');
						Expect(tmpCover.Title).to.equal('My Docs');
						Expect(tmpCover.Tagline).to.equal('');
						Expect(tmpCover.Highlights.length).to.equal(0);
						Expect(tmpCover.Actions.length).to.equal(0);
						fDone();
					}
				);
				test
				(
					'parseCover should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpCover = tmpProvider.parseCover('');
						Expect(tmpCover.Title).to.equal('');
						Expect(tmpCover.Tagline).to.equal('');
						Expect(tmpCover.Description).to.equal('');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Top Bar Parsing',
			function()
			{
				test
				(
					'parseTopbar should extract brand and links.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpTopbar = tmpProvider.parseTopbar(
							'# Retold\n'
							+ '- [Getting Started](getting-started.md)\n'
							+ '- [Modules](modules.md)\n'
							+ '- [GitHub](https://github.com/stevenvelozo/retold)\n'
						);
						Expect(tmpTopbar.Brand).to.equal('Retold');
						Expect(tmpTopbar.NavLinks.length).to.equal(2);
						Expect(tmpTopbar.NavLinks[0].Text).to.equal('Getting Started');
						Expect(tmpTopbar.ExternalLinks.length).to.equal(1);
						Expect(tmpTopbar.ExternalLinks[0].Text).to.equal('GitHub');
						Expect(tmpTopbar.ExternalLinks[0].Href).to.equal('https://github.com/stevenvelozo/retold');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Content Provider Integration',
			function()
			{
				test
				(
					'The docuserve provider should have a content provider instance.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._ContentProvider).to.be.an('object', 'Content provider should be available.');
						Expect(tmpProvider._ContentProvider.parseMarkdown).to.be.a('function', 'parseMarkdown should be a function.');
						Expect(tmpProvider._ContentProvider.parseInline).to.be.a('function', 'parseInline should be a function.');
						Expect(tmpProvider._ContentProvider.escapeHTML).to.be.a('function', 'escapeHTML should be a function.');
						fDone();
					}
				);
				test
				(
					'parseMarkdown via content provider should handle headings.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider._ContentProvider.parseMarkdown('# Hello World\n## Subheading');
						Expect(tmpResult).to.contain('<h1');
						Expect(tmpResult).to.contain('Hello World');
						Expect(tmpResult).to.contain('<h2');
						Expect(tmpResult).to.contain('Subheading');
						fDone();
					}
				);
				test
				(
					'parseMarkdown via content provider should handle code blocks.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider._ContentProvider.parseMarkdown('```javascript\nvar x = 1;\n```');
						Expect(tmpResult).to.contain('<pre>');
						Expect(tmpResult).to.contain('<code');
						Expect(tmpResult).to.contain('language-javascript');
						// Syntax highlighting wraps tokens in spans
						Expect(tmpResult).to.contain('var');
						Expect(tmpResult).to.contain('x = ');
						Expect(tmpResult).to.contain('1');
						fDone();
					}
				);
				test
				(
					'parseMarkdown via content provider should handle tables.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider._ContentProvider.parseMarkdown(
							'| Name | Type |\n'
							+ '|------|------|\n'
							+ '| foo  | bar  |'
						);
						Expect(tmpResult).to.contain('<table>');
						Expect(tmpResult).to.contain('<th>');
						Expect(tmpResult).to.contain('foo');
						Expect(tmpResult).to.contain('</table>');
						fDone();
					}
				);
				test
				(
					'escapeHTML via content provider should escape special characters.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider._ContentProvider.escapeHTML('<script>alert("xss")</script>')).to.equal('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
						Expect(tmpProvider._ContentProvider.escapeHTML("it's")).to.equal("it&#39;s");
						Expect(tmpProvider._ContentProvider.escapeHTML('a & b')).to.equal('a &amp; b');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Link Resolver Integration',
			function()
			{
				test
				(
					'_createLinkResolver should convert internal .md links to hash routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResolver = tmpProvider._createLinkResolver('fable', 'fable');
						var tmpResult = tmpProvider._ContentProvider.parseInline('[Architecture](/fable/fable/architecture.md)', tmpResolver);
						Expect(tmpResult).to.contain('#/doc/fable/fable/architecture.md');
						Expect(tmpResult).to.not.contain('target="_blank"');
						fDone();
					}
				);
				test
				(
					'_createLinkResolver should open external links in new tab.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResolver = tmpProvider._createLinkResolver();
						var tmpResult = tmpProvider._ContentProvider.parseInline('[NPM](https://npmjs.com/package/fable)', tmpResolver);
						Expect(tmpResult).to.contain('href="https://npmjs.com/package/fable"');
						Expect(tmpResult).to.contain('target="_blank"');
						fDone();
					}
				);
				test
				(
					'_createLinkResolver should NOT hijack catalog-module GitHub URLs (they stay external).',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResolver = tmpProvider._createLinkResolver();
						var tmpResult = tmpProvider._ContentProvider.parseInline('[fable](https://github.com/stevenvelozo/fable)', tmpResolver);
						Expect(tmpResult).to.contain('href="https://github.com/stevenvelozo/fable"');
						Expect(tmpResult).to.contain('target="_blank"');
						Expect(tmpResult).to.not.contain('#/doc/');
						fDone();
					}
				);
				test
				(
					'_createLinkResolver should leave non-catalog GitHub URLs as external links.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResolver = tmpProvider._createLinkResolver();
						var tmpResult = tmpProvider._ContentProvider.parseInline('[react](https://github.com/facebook/react)', tmpResolver);
						Expect(tmpResult).to.contain('href="https://github.com/facebook/react"');
						Expect(tmpResult).to.contain('target="_blank"');
						fDone();
					}
				);
				test
				(
					'_createLinkResolver should resolve relative links within module context.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResolver = tmpProvider._createLinkResolver('fable', 'fable');
						var tmpResult = tmpProvider._ContentProvider.parseInline('[API](api.md)', tmpResolver);
						Expect(tmpResult).to.contain('#/doc/fable/fable/api.md');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Error Page',
			function()
			{
				test
				(
					'getErrorPageHTML should return default page when no custom page loaded.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.getErrorPageHTML('/some/missing/path');
						Expect(tmpResult).to.contain('Page Not Found');
						Expect(tmpResult).to.contain('/some/missing/path');
						Expect(tmpResult).to.contain('#/Home');
						fDone();
					}
				);
				test
				(
					'getErrorPageHTML should use custom page when loaded.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider.pict.AppData.Docuserve.ErrorPageLoaded = true;
						tmpProvider.pict.AppData.Docuserve.ErrorPageHTML = '<div>Custom error for {{path}}</div>';
						var tmpResult = tmpProvider.getErrorPageHTML('test/doc.md');
						Expect(tmpResult).to.contain('Custom error for test/doc.md');
						fDone();
					}
				);
				test
				(
					'getErrorPageHTML should escape path in custom pages.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider.pict.AppData.Docuserve.ErrorPageLoaded = true;
						tmpProvider.pict.AppData.Docuserve.ErrorPageHTML = '<div>Error: {{path}}</div>';
						var tmpResult = tmpProvider.getErrorPageHTML('<script>alert("xss")</script>');
						Expect(tmpResult).to.not.contain('<script>');
						Expect(tmpResult).to.contain('&lt;script&gt;');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Sidebar Data from Catalog',
			function()
			{
				test
				(
					'buildSidebarData should build groups and modules from catalog.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider.buildSidebarData(_MockCatalog);
						var tmpGroups = tmpProvider.pict.AppData.Docuserve.SidebarGroups;
						Expect(tmpGroups).to.be.an('array');
						Expect(tmpGroups.length).to.equal(4);

						Expect(tmpGroups[0].Name).to.equal('Fable');
						Expect(tmpGroups[0].Key).to.equal('fable');
						Expect(tmpGroups[0].Modules.length).to.equal(3);
						Expect(tmpGroups[0].Modules[0].Route).to.equal('#/doc/fable/fable');

						Expect(tmpGroups[1].Name).to.equal('Meadow');
						Expect(tmpGroups[1].Modules.length).to.equal(3);

						Expect(tmpGroups[2].Name).to.equal('Pict');
						Expect(tmpGroups[2].Modules.length).to.equal(2);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Module Sidebar',
			function()
			{
				test
				(
					'getModuleSidebar should return sidebar for known modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpSidebar = tmpProvider.getModuleSidebar('fable', 'fable');
						Expect(tmpSidebar).to.be.an('array');
						fDone();
					}
				);
				test
				(
					'getModuleSidebar should return null for unknown modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.getModuleSidebar('fable', 'nonexistent')).to.equal(null);
						Expect(tmpProvider.getModuleSidebar('fake', 'fable')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'getModuleSidebar with no catalog should return null.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.getModuleSidebar('fable', 'fable')).to.equal(null);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Content Cache',
			function()
			{
				test
				(
					'Content cache should be empty on initialization.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(Object.keys(tmpProvider._ContentCache).length).to.equal(0);
						fDone();
					}
				);
			}
		);
	}
);
