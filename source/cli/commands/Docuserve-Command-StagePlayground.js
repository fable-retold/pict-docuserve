const libCommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

const libFS = require('fs');
const libPath = require('path');

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
 * `pict-docuserve stage-playground <docs>` — read `<docs>/_playground.json`
 * and copy every `Imports[]` entry with `Source: "local"` from its resolved
 * source bundle into `<docs>/<Path>`.
 *
 * This is the per-module half of the section-playground story: each module's
 * `_playground.json` declares which UMD bundles its iframe needs, this
 * command stages them into the docs tree so the iframe can `<script src=...>`
 * them relative to the docs root.  Without it, the bundles either have to be
 * hand-copied (the original section-form workflow) or loaded from the CDN —
 * which doesn't work for un-published in-development versions.
 *
 * Resolution order for each Import's source bundle:
 *   1. `<moduleRoot>/node_modules/<Name>/dist/<Name>.min.js` — the normal
 *      case for peer dependencies.
 *   2. `<moduleRoot>/dist/<Name>.min.js` — when the Import IS the module
 *      being staged (e.g. pict-section-form staging itself).
 *   3. Sibling monorepo checkout — walks up looking for a `modules/`
 *      directory and searches `modules/<group>/<Name>/dist/<Name>.min.js`.
 *      Lets in-monorepo dev workflows pick up a freshly-built bundle even
 *      when the umbrella `node_modules/` is stale.
 *
 * Clean no-op when `_playground.json` is absent — safe to wire into
 * `quack prepare-docs` for every module.
 */
class DocuserveCommandStagePlayground extends libCommandLineCommand
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.options.CommandKeyword = 'stage-playground';
		this.options.Description = 'Stage local Imports referenced by docs/_playground.json into the docs playground runtime folder.';

		this.options.CommandArguments.push({ Name: '[docs_folder]', Description: 'The documentation folder to stage into.  Defaults to ./docs.' });
		this.options.CommandOptions.push({ Name: '-m, --module_root [module_root]', Description: 'Root of the module being staged (where node_modules lives).  Defaults to the docs folder\'s parent.', Default: '' });

		this.options.Aliases.push('stage-playground-runtime');

		this.addCommand();
	}

	onRun()
	{
		let tmpDocsFolder = libPath.resolve(this.ArgumentString || './docs');
		let tmpModuleRoot = libPath.resolve(this.CommandOptions.module_root || libPath.dirname(tmpDocsFolder));

		let tmpPlaygroundConfigPath = libPath.join(tmpDocsFolder, '_playground.json');
		if (!libFS.existsSync(tmpPlaygroundConfigPath))
		{
			this.log.info(`No _playground.json at [${tmpPlaygroundConfigPath}]; nothing to stage.`);
			return;
		}

		let tmpConfig;
		try
		{
			tmpConfig = JSON.parse(libFS.readFileSync(tmpPlaygroundConfigPath, 'utf8'));
		}
		catch (pError)
		{
			this.log.error(`Failed to parse _playground.json [${tmpPlaygroundConfigPath}]: ${pError.message}`);
			process.exit(1);
			return;
		}

		let tmpImports = (tmpConfig && Array.isArray(tmpConfig.Imports)) ? tmpConfig.Imports : [];
		let tmpStylesheets = (tmpConfig && Array.isArray(tmpConfig.Stylesheets)) ? tmpConfig.Stylesheets : [];

		// Staging targets — every Import / Stylesheet with Source: "local".
		// Each entry produces { kind, name, source, dest } once resolved.
		let tmpJobs = [];
		for (let i = 0; i < tmpImports.length; i++)
		{
			let tmpImp = tmpImports[i];
			if (!tmpImp || tmpImp.Source !== 'local') { continue; }
			tmpJobs.push({ kind: 'script', spec: tmpImp });
		}
		for (let i = 0; i < tmpStylesheets.length; i++)
		{
			let tmpSheet = tmpStylesheets[i];
			if (!tmpSheet || tmpSheet.Source !== 'local') { continue; }
			tmpJobs.push({ kind: 'stylesheet', spec: tmpSheet });
		}

		if (tmpJobs.length === 0)
		{
			this.log.info(`No local Imports or Stylesheets declared in _playground.json; nothing to stage.`);
			return;
		}

		this.log.info(`Staging ${tmpJobs.length} playground runtime asset(s) from module root [${tmpModuleRoot}]...`);

		let tmpCopied = 0;
		let tmpFailed = 0;
		for (let i = 0; i < tmpJobs.length; i++)
		{
			let tmpJob = tmpJobs[i];
			let tmpKind = tmpJob.kind;
			let tmpSpec = tmpJob.spec;
			let tmpName = tmpSpec.Name;
			let tmpExt = (tmpKind === 'stylesheet') ? 'css' : 'js';

			if (!tmpName && !tmpSpec.Path)
			{
				this.log.warn(`${tmpKind} #${i} has neither Name nor Path; skipping.`);
				tmpFailed++;
				continue;
			}

			let tmpRelativePath = tmpSpec.Path || `playground/runtime/${tmpName}.min.${tmpExt}`;
			let tmpDest = libPath.join(tmpDocsFolder, tmpRelativePath);

			let tmpSource = this._resolveAssetSource(tmpKind, tmpName, tmpSpec.Path, tmpModuleRoot);
			if (!tmpSource)
			{
				this.log.warn(`[${tmpName || tmpRelativePath}] No ${tmpKind} source found; skipping.  Build it (npx quack build) and re-run prepare-docs.`);
				tmpFailed++;
				continue;
			}

			try
			{
				ensureDir(libPath.dirname(tmpDest));
				libFS.copyFileSync(tmpSource, tmpDest);
				this.log.info(`Staged ${tmpKind} ${tmpName || tmpRelativePath}: ${tmpSource} -> ${tmpDest}`);
				tmpCopied++;
			}
			catch (pError)
			{
				this.log.error(`[${tmpName || tmpRelativePath}] Copy failed: ${pError.message}`);
				tmpFailed++;
			}
		}

		this.log.info(`Playground staging complete: ${tmpCopied} copied, ${tmpFailed} failed.`);
		if (tmpFailed > 0 && tmpCopied === 0)
		{
			// Hard failure only when nothing landed — a partial copy is a
			// warning so prepare-docs can keep going.
			process.exit(1);
		}
	}

	/**
	 * Resolve the source asset (script bundle or stylesheet) for an Import
	 * or Stylesheet entry.  Scripts look at `<pkg>/dist/<pkg>.min.js`;
	 * stylesheets look at `<pkg>/dist/<file>` for whatever Path was declared
	 * (since CSS filenames don't follow a single naming convention).
	 *
	 * @param {string} pKind - "script" or "stylesheet".
	 * @param {string} pName - Package name (may be empty for ad-hoc paths).
	 * @param {string} pSpecPath - Optional Path from the spec; for stylesheets
	 *                             we use its basename to find the source CSS.
	 * @param {string} pModuleRoot - Root of the module being staged.
	 * @returns {string|null} Absolute source path, or null if not found.
	 */
	_resolveAssetSource(pKind, pName, pSpecPath, pModuleRoot)
	{
		if (pKind === 'script')
		{
			return this._resolveBundleSource(pName, pModuleRoot);
		}
		// Stylesheet — look under the package's dist (or root) for a matching
		// CSS file.  The spec's Path basename hints at what file to find.
		let tmpBasename = pSpecPath ? libPath.basename(pSpecPath) : (pName ? pName + '.min.css' : null);
		if (!tmpBasename) { return null; }

		let tmpCandidates = [];
		if (pName)
		{
			tmpCandidates.push(libPath.join(pModuleRoot, 'node_modules', pName, 'dist', tmpBasename));
			tmpCandidates.push(libPath.join(pModuleRoot, 'node_modules', pName, tmpBasename));
		}
		// Also check the module root in case the CSS lives alongside source/
		tmpCandidates.push(libPath.join(pModuleRoot, 'dist', tmpBasename));
		tmpCandidates.push(libPath.join(pModuleRoot, tmpBasename));

		for (let i = 0; i < tmpCandidates.length; i++)
		{
			if (libFS.existsSync(tmpCandidates[i]))
			{
				return tmpCandidates[i];
			}
		}
		return null;
	}

	/**
	 * Resolve the source UMD bundle for an Import by Name.
	 *
	 * @param {string} pName - Package name (e.g. "pict", "pict-section-form").
	 * @param {string} pModuleRoot - Root of the module being staged.
	 * @returns {string|null} Absolute path to the bundle, or null if not found.
	 */
	_resolveBundleSource(pName, pModuleRoot)
	{
		let tmpCandidates = [];

		// 1. Peer dependency: <moduleRoot>/node_modules/<Name>/dist/<Name>.min.js
		tmpCandidates.push(libPath.join(pModuleRoot, 'node_modules', pName, 'dist', `${pName}.min.js`));

		// 2. Module IS the package being staged: <moduleRoot>/dist/<Name>.min.js
		try
		{
			let tmpPkgPath = libPath.join(pModuleRoot, 'package.json');
			if (libFS.existsSync(tmpPkgPath))
			{
				let tmpPkg = JSON.parse(libFS.readFileSync(tmpPkgPath, 'utf8'));
				if (tmpPkg && tmpPkg.name === pName)
				{
					tmpCandidates.push(libPath.join(pModuleRoot, 'dist', `${pName}.min.js`));
				}
			}
		}
		catch (pError)
		{
			// Non-fatal — fall through to other candidates.
		}

		// 3. Sibling monorepo checkout — walk up until we find a `modules/`
		// directory, then search modules/<group>/<Name>/dist/<Name>.min.js.
		let tmpUp = pModuleRoot;
		for (let i = 0; i < 5; i++)
		{
			let tmpModulesDir = libPath.join(tmpUp, 'modules');
			if (libFS.existsSync(tmpModulesDir) && libFS.statSync(tmpModulesDir).isDirectory())
			{
				try
				{
					let tmpGroups = libFS.readdirSync(tmpModulesDir);
					for (let g = 0; g < tmpGroups.length; g++)
					{
						let tmpCandidate = libPath.join(tmpModulesDir, tmpGroups[g], pName, 'dist', `${pName}.min.js`);
						tmpCandidates.push(tmpCandidate);
					}
				}
				catch (pError)
				{
					// readdirSync can fail on permission errors; skip silently.
				}
				break;
			}
			let tmpNext = libPath.dirname(tmpUp);
			if (tmpNext === tmpUp)
			{
				break;
			}
			tmpUp = tmpNext;
		}

		for (let i = 0; i < tmpCandidates.length; i++)
		{
			if (libFS.existsSync(tmpCandidates[i]))
			{
				return tmpCandidates[i];
			}
		}
		return null;
	}
}

module.exports = DocuserveCommandStagePlayground;
