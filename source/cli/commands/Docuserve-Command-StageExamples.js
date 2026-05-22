const libCommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

const libFS = require('fs');
const libPath = require('path');
const libChildProcess = require('child_process');

/**
 * Built-in package -> CDN URL map.
 *
 * When a staged example vendors one of these packages (declared as a
 * `copyFiles` glob in the example's package.json that points into
 * `node_modules/<pkg>/dist/`), the large library bundle is NOT copied into
 * the docs folder.  Instead the staged index.html is rewritten to load the
 * library from jsDelivr.  Add entries here to make additional dependencies
 * CDN-externalizable.
 *
 * Vendored files of a package with NO entry here are copied normally, so
 * the staged example still works (just heavier).
 */
const _PackageCDNMap = (
{
	'pict': 'https://cdn.jsdelivr.net/npm/pict@1/dist/pict.min.js',
	'chart.js': 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js'
});

/**
 * Marker comments delimiting the generated regions this command maintains.
 *
 * Everything BETWEEN a marker pair is regenerated on every run; everything
 * outside the markers is hand-authored prose and is never modified.
 */
const _Marker = (
{
	LaunchStart:     '<!-- docuserve:example-launch:start -->',
	LaunchEnd:       '<!-- docuserve:example-launch:end -->',
	IndexStart:      '<!-- docuserve:examples-index:start -->',
	IndexEnd:        '<!-- docuserve:examples-index:end -->',
	QuickLinksStart: '<!-- docuserve:examples:start -->',
	QuickLinksEnd:   '<!-- docuserve:examples:end -->'
});

/**
 * Recursively create a directory if it does not exist.
 */
function ensureDir(pPath)
{
	if (!libFS.existsSync(pPath))
	{
		libFS.mkdirSync(pPath, { recursive: true });
	}
}

/**
 * Escape a string for safe literal use inside a regular expression.
 */
function escapeRegExp(pText)
{
	return String(pText).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve the package name from a `copyFiles` `from` glob that points into
 * a node_modules folder.  Returns null when the glob is not a node_modules
 * vendor glob (e.g. `./html/*`).
 */
function packageNameFromGlob(pFromGlob)
{
	let tmpNormalized = String(pFromGlob).replace(/\\/g, '/');
	let tmpMatch = tmpNormalized.match(/node_modules\/(@[^/]+\/[^/]+|[^/@][^/]*)\//);
	return tmpMatch ? tmpMatch[1] : null;
}

/**
 * List the actual files on disk that a `copyFiles` `from` glob resolves to.
 *
 * Only the trailing path segment is treated as a glob (the examples use
 * simple `*` patterns like `dist/*` or `dist/chart.umd*`).
 *
 * @param {string} pBaseDir - Directory the glob is relative to (the example dir).
 * @param {string} pFromGlob - The `from` glob value.
 * @returns {string[]} Matching file basenames.
 */
function listGlobFiles(pBaseDir, pFromGlob)
{
	let tmpAbsGlob = libPath.resolve(pBaseDir, pFromGlob);
	let tmpDir = libPath.dirname(tmpAbsGlob);
	let tmpBasenamePattern = libPath.basename(tmpAbsGlob);

	if (!libFS.existsSync(tmpDir))
	{
		return [];
	}

	let tmpRegEx = new RegExp('^' + escapeRegExp(tmpBasenamePattern).replace(/\\\*/g, '.*') + '$');
	return libFS.readdirSync(tmpDir).filter((pName) =>
	{
		if (!tmpRegEx.test(pName))
		{
			return false;
		}
		try
		{
			return libFS.statSync(libPath.join(tmpDir, pName)).isFile();
		}
		catch (pError)
		{
			return false;
		}
	});
}

/**
 * Replace (or insert) a marker-delimited generated region within a body of
 * text.  When both markers are present the content between them is
 * replaced; otherwise fInsert decides placement.
 *
 * @param {string} pText - The current file contents.
 * @param {string} pStartMarker - The opening marker comment.
 * @param {string} pEndMarker - The closing marker comment.
 * @param {string} pInnerBlock - The generated content for between the markers.
 * @param {Function} fInsert - (pText, pRegion) => newText, used when markers are absent.
 * @returns {string} The updated text.
 */
function replaceRegion(pText, pStartMarker, pEndMarker, pInnerBlock, fInsert)
{
	let tmpRegion = pStartMarker + '\n' + pInnerBlock + '\n' + pEndMarker;

	let tmpStartIndex = pText.indexOf(pStartMarker);
	let tmpEndIndex = pText.indexOf(pEndMarker);

	if ((tmpStartIndex >= 0) && (tmpEndIndex > tmpStartIndex))
	{
		return pText.substring(0, tmpStartIndex) + tmpRegion + pText.substring(tmpEndIndex + pEndMarker.length);
	}

	return fInsert(pText, tmpRegion);
}

/**
 * Escape a value for safe use inside a markdown table cell.
 */
function escapeTableCell(pText)
{
	return String(pText || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

/**
 * Percent-encode underscores in a generated link URL.
 *
 * docuserve's markdown renderer applies emphasis (`_text_`) even inside
 * link URLs, so an href containing underscores — e.g. an example folder
 * named `simple_form` — is corrupted into `<em>` markup.  Encoding the
 * underscore as %5F sidesteps the renderer; the HTTP layer decodes it back
 * on fetch, so the staged files still resolve on both the dev server and
 * GitHub Pages.
 */
function mdSafeUrl(pURL)
{
	return String(pURL).replace(/_/g, '%5F');
}

class DocuserveCommandStageExamples extends libCommandLineCommand
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.options.CommandKeyword = 'stage-examples';
		this.options.Description = 'Build flagged example applications and stage them into a docs folder for static hosting.';

		this.options.CommandArguments.push({ Name: '[docs-path]', Description: 'Target documentation folder to stage examples into (defaults to ./docs/).' });

		this.options.CommandOptions.push({ Name: '-m, --module_root [module_root]', Description: 'Module root containing the example_applications/ folder (defaults to CWD).', Default: '' });

		this.addCommand();
	}

	onRun()
	{
		let tmpDocsFolder = libPath.resolve(this.ArgumentString || './docs/');
		let tmpModuleRoot = libPath.resolve(this.CommandOptions.module_root || process.cwd());
		let tmpExamplesRoot = libPath.join(tmpModuleRoot, 'example_applications');

		// No example_applications/ folder -> clean no-op.  This command is
		// wired into `quack prepare-docs` and must be safe to run for any
		// module, whether or not it ships example applications.
		if (!libFS.existsSync(tmpExamplesRoot))
		{
			this.log.info(`No example_applications/ folder at [${tmpExamplesRoot}]; nothing to stage.`);
			return;
		}

		this.log.info(`Staging example applications from [${tmpExamplesRoot}] into [${tmpDocsFolder}]...`);

		// Discover flagged examples: example_applications/<name>/package.json
		// carrying retold.ExampleApplication.Stage === true.
		let tmpDiscovered = [];
		let tmpEntries = [];
		try
		{
			tmpEntries = libFS.readdirSync(tmpExamplesRoot);
		}
		catch (pError)
		{
			this.log.warn(`Could not read [${tmpExamplesRoot}]: ${pError.message}`);
			return;
		}

		for (let i = 0; i < tmpEntries.length; i++)
		{
			let tmpName = tmpEntries[i];
			let tmpExampleDir = libPath.join(tmpExamplesRoot, tmpName);

			try
			{
				if (!libFS.statSync(tmpExampleDir).isDirectory())
				{
					continue;
				}
			}
			catch (pError)
			{
				continue;
			}

			let tmpPackagePath = libPath.join(tmpExampleDir, 'package.json');
			if (!libFS.existsSync(tmpPackagePath))
			{
				continue;
			}

			let tmpPackage;
			try
			{
				tmpPackage = JSON.parse(libFS.readFileSync(tmpPackagePath, 'utf8'));
			}
			catch (pError)
			{
				this.log.warn(`Could not parse [${tmpPackagePath}]: ${pError.message}`);
				continue;
			}

			let tmpFlag = tmpPackage.retold && tmpPackage.retold.ExampleApplication;
			if (!tmpFlag || (tmpFlag.Stage !== true))
			{
				continue;
			}

			tmpDiscovered.push({ Name: tmpName, Dir: tmpExampleDir, Package: tmpPackage, Flag: tmpFlag });
		}

		if (tmpDiscovered.length < 1)
		{
			this.log.info(`No example applications are flagged for staging (retold.ExampleApplication.Stage); nothing to do.`);
			return;
		}

		ensureDir(libPath.join(tmpDocsFolder, 'examples'));

		// Build + stage each flagged example.  A per-example failure is
		// logged and skipped — it is never fatal to the overall run.
		let tmpStaged = [];
		for (let i = 0; i < tmpDiscovered.length; i++)
		{
			let tmpResult = this._stageExample(tmpDiscovered[i], tmpDocsFolder);
			if (tmpResult)
			{
				tmpStaged.push(tmpResult);
			}
		}

		if (tmpStaged.length < 1)
		{
			this.log.warn(`No example applications were staged successfully.`);
			return;
		}

		// Regenerate the marker-delimited index + intro quick-links.
		try
		{
			this._writeExamplesIndex(tmpStaged, tmpDocsFolder);
		}
		catch (pError)
		{
			this.log.warn(`Could not update examples index: ${pError.message}`);
		}

		try
		{
			this._writeIntroQuickLinks(tmpStaged, tmpDocsFolder);
		}
		catch (pError)
		{
			this.log.warn(`Could not update intro quick-links: ${pError.message}`);
		}

		this.log.info(`Staged ${tmpStaged.length} example application(s): ${tmpStaged.map((pEx) => pEx.Name).join(', ')}`);
	}

	/**
	 * Build a single example application and stage it into the docs folder.
	 *
	 * @param {object} pExample - { Name, Dir, Package, Flag }
	 * @param {string} pDocsFolder - The target documentation folder.
	 * @returns {object|null} { Name, Title, Summary, Complexity } on success, null on failure.
	 */
	_stageExample(pExample, pDocsFolder)
	{
		let tmpName = pExample.Name;
		this.log.info(`  [${tmpName}] building...`);

		// 1. Build the example with quackage (cwd = the example directory).
		try
		{
			libChildProcess.execSync('npx quack build && npx quack copy',
				{ cwd: pExample.Dir, stdio: 'pipe', timeout: 600000 });
		}
		catch (pError)
		{
			let tmpDetail = '';
			if (pError.stderr)
			{
				tmpDetail = pError.stderr.toString().split('\n').slice(-6).join('\n');
			}
			this.log.warn(`  [${tmpName}] build failed; skipping. ${pError.message}`);
			if (tmpDetail)
			{
				this.log.warn(`  [${tmpName}] build output tail:\n${tmpDetail}`);
			}
			return null;
		}

		try
		{
			let tmpDistPath = libPath.join(pExample.Dir, 'dist');
			let tmpIndexSource = libPath.join(tmpDistPath, 'index.html');
			if (!libFS.existsSync(tmpIndexSource))
			{
				this.log.warn(`  [${tmpName}] no dist/index.html after build; skipping.`);
				return null;
			}

			// 2. Compute the CDN-externalized vendored file set from the
			// example's own copyFiles globs.  Only files belonging to a
			// CDN-mapped package are externalized; everything else is
			// staged normally so the example still runs.
			let tmpVendoredBasenames = new Set();
			let tmpBasenameToCDN = new Map();
			let tmpCopyFiles = Array.isArray(pExample.Package.copyFiles) ? pExample.Package.copyFiles : [];
			for (let i = 0; i < tmpCopyFiles.length; i++)
			{
				let tmpFrom = tmpCopyFiles[i] && tmpCopyFiles[i].from;
				if (!tmpFrom)
				{
					continue;
				}
				let tmpPackageName = packageNameFromGlob(tmpFrom);
				if (!tmpPackageName || !_PackageCDNMap[tmpPackageName])
				{
					continue;
				}
				let tmpFiles = listGlobFiles(pExample.Dir, tmpFrom);
				for (let f = 0; f < tmpFiles.length; f++)
				{
					tmpVendoredBasenames.add(tmpFiles[f]);
					if (tmpFiles[f].endsWith('.js'))
					{
						tmpBasenameToCDN.set(tmpFiles[f], _PackageCDNMap[tmpPackageName]);
					}
				}
			}

			let tmpStageDir = libPath.join(pDocsFolder, 'examples', tmpName);
			ensureDir(tmpStageDir);

			// 3. Read the built index.html and rewrite vendored <script src>
			// references to their CDN URLs.  The app's own bundle <script>
			// (a sibling file) is left untouched.
			let tmpHTML = libFS.readFileSync(tmpIndexSource, 'utf8');
			tmpBasenameToCDN.forEach((pCDNURL, pBasename) =>
			{
				let tmpPattern = new RegExp('(\\bsrc\\s*=\\s*)(["\'])\\.?/?' + escapeRegExp(pBasename) + '\\2', 'gi');
				tmpHTML = tmpHTML.replace(tmpPattern, '$1$2' + pCDNURL + '$2');
			});
			libFS.writeFileSync(libPath.join(tmpStageDir, 'index.html'), tmpHTML);

			// 4. Determine which local (non-CDN) JS bundles the rewritten
			// index.html actually references — only those are staged.
			let tmpReferencedFiles = new Set();
			let tmpRefMatch;
			let tmpRefRegEx = /(?:src|href)\s*=\s*(["'])([^"']+)\1/gi;
			while ((tmpRefMatch = tmpRefRegEx.exec(tmpHTML)) !== null)
			{
				let tmpRef = tmpRefMatch[2];
				if (/^(?:[a-z]+:)?\/\//i.test(tmpRef) || /^(?:data:|mailto:|#)/i.test(tmpRef))
				{
					continue;
				}
				tmpReferencedFiles.add(libPath.basename(tmpRef.split('?')[0].split('#')[0]));
			}

			// 5. Stage dist/* into docs/examples/<name>/, skipping the
			// CDN-externalized libraries and sourcemaps.  JS files are
			// staged only when index.html references them (the app
			// bundle); data/asset files (json, css, svg, ...) are always
			// staged.
			let tmpStagedFiles = [];
			let tmpDistEntries = libFS.readdirSync(tmpDistPath);
			for (let i = 0; i < tmpDistEntries.length; i++)
			{
				let tmpFile = tmpDistEntries[i];
				if (tmpFile === 'index.html')
				{
					continue;
				}
				if (tmpFile.endsWith('.map'))
				{
					continue;
				}
				if (tmpVendoredBasenames.has(tmpFile))
				{
					continue;
				}

				let tmpSourceFile = libPath.join(tmpDistPath, tmpFile);
				try
				{
					if (!libFS.statSync(tmpSourceFile).isFile())
					{
						continue;
					}
				}
				catch (pError)
				{
					continue;
				}

				if (tmpFile.endsWith('.js') && !tmpReferencedFiles.has(tmpFile))
				{
					continue;
				}

				let tmpDestFile = libPath.join(tmpStageDir, tmpFile);
				if (tmpFile.endsWith('.js'))
				{
					// Strip the sourceMappingURL pragma — the .map sibling
					// is intentionally not staged, so leaving the pragma
					// would 404 in the browser devtools.
					let tmpJS = libFS.readFileSync(tmpSourceFile, 'utf8');
					tmpJS = tmpJS.replace(/\s*\/\/[#@]\s*sourceMappingURL=\S*\s*$/, '\n');
					libFS.writeFileSync(tmpDestFile, tmpJS);
				}
				else
				{
					libFS.copyFileSync(tmpSourceFile, tmpDestFile);
				}
				tmpStagedFiles.push(tmpFile);
			}

			// 6. Maintain the launch block in the example's writeup.
			this._writeLaunchBlock(pExample, pDocsFolder);

			this.log.info(`  [${tmpName}] staged -> ${tmpStageDir} (index.html, ${tmpStagedFiles.join(', ') || 'no extra files'})`);

			return {
				Name: tmpName,
				Title: (pExample.Flag.Title || tmpName),
				Summary: (pExample.Flag.Summary || pExample.Package.description || ''),
				Complexity: (pExample.Flag.Complexity || '')
			};
		}
		catch (pError)
		{
			this.log.warn(`  [${tmpName}] staging failed; skipping. ${pError.message}`);
			return null;
		}
	}

	/**
	 * Maintain the generated launch block inside an example's writeup at
	 * docs/examples/<name>/README.md.  When the writeup does not exist a
	 * minimal stub is scaffolded; an existing writeup's hand-authored prose
	 * is never overwritten.
	 *
	 * @param {object} pExample - { Name, Package, Flag }
	 * @param {string} pDocsFolder - The target documentation folder.
	 */
	_writeLaunchBlock(pExample, pDocsFolder)
	{
		let tmpName = pExample.Name;
		let tmpReadmePath = libPath.join(pDocsFolder, 'examples', tmpName, 'README.md');
		let tmpTitle = pExample.Flag.Title || tmpName;
		let tmpSummary = pExample.Flag.Summary || pExample.Package.description || '';

		let tmpInner = `> **[&#9654; Launch the live app](${mdSafeUrl('examples/' + tmpName + '/index.html')})** — runs in your browser, opens in a new tab.`;

		let tmpText;
		if (libFS.existsSync(tmpReadmePath))
		{
			tmpText = libFS.readFileSync(tmpReadmePath, 'utf8');
		}
		else
		{
			// Scaffold a minimal stub — only ever created when no writeup
			// exists.  Hand-authored writeups are never invented over.
			tmpText = `# ${tmpTitle}\n\n${tmpSummary}\n`;
		}

		tmpText = replaceRegion(tmpText, _Marker.LaunchStart, _Marker.LaunchEnd, tmpInner,
			(pBody, pRegion) =>
			{
				// No markers — insert the block right after the first H1.
				let tmpH1 = pBody.match(/^#\s+.*$/m);
				if (tmpH1)
				{
					let tmpIndex = pBody.indexOf(tmpH1[0]) + tmpH1[0].length;
					return pBody.substring(0, tmpIndex) + '\n\n' + pRegion + '\n' + pBody.substring(tmpIndex);
				}
				return pRegion + '\n\n' + pBody;
			});

		libFS.writeFileSync(tmpReadmePath, tmpText);
	}

	/**
	 * Maintain the generated quick-reference table inside the examples
	 * index at docs/examples/README.md.
	 *
	 * @param {object[]} pStaged - Staged example metadata.
	 * @param {string} pDocsFolder - The target documentation folder.
	 */
	_writeExamplesIndex(pStaged, pDocsFolder)
	{
		let tmpIndexPath = libPath.join(pDocsFolder, 'examples', 'README.md');

		let tmpRows = pStaged.map((pEx) =>
		{
			let tmpComplexity = escapeTableCell(pEx.Complexity) || '—';
			return `| [${escapeTableCell(pEx.Title)}](${mdSafeUrl('examples/' + pEx.Name + '/README.md')}) | ${tmpComplexity} | ${escapeTableCell(pEx.Summary)} | [&#9654; Launch](${mdSafeUrl('examples/' + pEx.Name + '/index.html')}) |`;
		});
		let tmpInner = [
			'| Example | Complexity | Summary | Live |',
			'|---------|------------|---------|------|'
		].concat(tmpRows).join('\n');

		let tmpText = libFS.existsSync(tmpIndexPath)
			? libFS.readFileSync(tmpIndexPath, 'utf8')
			: '# Example Applications\n';

		tmpText = replaceRegion(tmpText, _Marker.IndexStart, _Marker.IndexEnd, tmpInner,
			(pBody, pRegion) =>
			{
				// No markers — append a new "Live Examples" section.
				return pBody.replace(/\s*$/, '') + '\n\n## Live Examples\n\n' + pRegion + '\n';
			});

		libFS.writeFileSync(tmpIndexPath, tmpText);
	}

	/**
	 * Maintain the generated "Example Applications" quick-links block on the
	 * documentation intro page at docs/README.md.
	 *
	 * @param {object[]} pStaged - Staged example metadata.
	 * @param {string} pDocsFolder - The target documentation folder.
	 */
	_writeIntroQuickLinks(pStaged, pDocsFolder)
	{
		let tmpReadmePath = libPath.join(pDocsFolder, 'README.md');

		let tmpBullets = pStaged.map((pEx) =>
		{
			let tmpSummary = String(pEx.Summary || '').replace(/\r?\n/g, ' ').trim();
			return `- **[${pEx.Title}](${mdSafeUrl('examples/' + pEx.Name + '/README.md')})** — ${tmpSummary} · [&#9654; Launch live app](${mdSafeUrl('examples/' + pEx.Name + '/index.html')})`;
		});
		let tmpInner = '*Live, runnable example applications — each opens in a new browser tab:*\n\n' + tmpBullets.join('\n');

		let tmpText = libFS.existsSync(tmpReadmePath)
			? libFS.readFileSync(tmpReadmePath, 'utf8')
			: '# Documentation\n';

		tmpText = replaceRegion(tmpText, _Marker.QuickLinksStart, _Marker.QuickLinksEnd, tmpInner,
			(pBody, pRegion) =>
			{
				// Prefer to place the block directly under an existing
				// "Example Applications" heading.
				let tmpHeading = pBody.match(/^#{2,}\s+Example Applications\s*$/m);
				if (tmpHeading)
				{
					let tmpIndex = pBody.indexOf(tmpHeading[0]) + tmpHeading[0].length;
					return pBody.substring(0, tmpIndex) + '\n\n' + pRegion + '\n' + pBody.substring(tmpIndex);
				}
				// Otherwise append a new section at the end of the page.
				return pBody.replace(/\s*$/, '') + '\n\n## Example Applications\n\n' + pRegion + '\n';
			});

		libFS.writeFileSync(tmpReadmePath, tmpText);
	}
}

module.exports = DocuserveCommandStageExamples;
