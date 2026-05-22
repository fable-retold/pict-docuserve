const libCommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

const libFS = require('fs');
const libPath = require('path');

/**
 * Recursively collect every .md file beneath a folder.
 *
 * @param {string} pRoot - The folder to walk.
 * @returns {string[]} Absolute paths of every markdown file found, sorted.
 */
function collectMarkdownFiles(pRoot)
{
	let tmpResults = [];
	let tmpStack = [pRoot];

	while (tmpStack.length > 0)
	{
		let tmpDir = tmpStack.pop();
		let tmpEntries;
		try
		{
			tmpEntries = libFS.readdirSync(tmpDir, { withFileTypes: true });
		}
		catch (pError)
		{
			continue;
		}

		for (let i = 0; i < tmpEntries.length; i++)
		{
			let tmpEntry = tmpEntries[i];
			let tmpFullPath = libPath.join(tmpDir, tmpEntry.name);
			if (tmpEntry.isDirectory())
			{
				tmpStack.push(tmpFullPath);
			}
			else if (tmpEntry.isFile() && /\.md$/i.test(tmpEntry.name))
			{
				tmpResults.push(tmpFullPath);
			}
		}
	}

	tmpResults.sort();
	return tmpResults;
}

/**
 * True when a file exists on disk and is a regular file.
 */
function fileExists(pPath)
{
	try
	{
		return libFS.statSync(pPath).isFile();
	}
	catch (pError)
	{
		return false;
	}
}

/**
 * True when a path exists on disk and is a directory.
 */
function directoryExists(pPath)
{
	try
	{
		return libFS.statSync(pPath).isDirectory();
	}
	catch (pError)
	{
		return false;
	}
}

/**
 * Resolve a relative href against a base directory, collapsing "." and ".."
 * segments.  ".." is clamped at the docs root.  Mirrors docuserve module-mode
 * resolution (Pict-Provider-Docuserve-Documentation._resolveRelativeDocPath)
 * so the checker resolves .md links exactly the way the viewer routes them.
 *
 * @param {string} pBaseDir - The directory the href is relative to (POSIX, docs-root-relative).
 * @param {string} pHref - The href to resolve.
 * @returns {string} The resolved docs-root-relative path (no leading slash).
 */
function resolveRelativeDocPath(pBaseDir, pHref)
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
 * True when a link target points outside the docs site and must never be
 * resolved against the filesystem: an absolute or protocol-relative URL, a
 * scheme such as mailto:/data:/tel:, or a pure #anchor.
 */
function isExternalOrAnchor(pTarget)
{
	if (!pTarget)
	{
		return true;
	}
	if (pTarget.charAt(0) === '#')
	{
		return true;
	}
	if (pTarget.indexOf('//') === 0)
	{
		return true;
	}
	if (/^[a-z][a-z0-9+.-]*:/i.test(pTarget))
	{
		return true;
	}
	return false;
}

/**
 * Normalize a raw link target extracted from markdown: drop a surrounding
 * <...>, drop a link title (` "Title"`), drop a #fragment / ?query, and
 * decode the %5F underscore escape that docuserve's mdSafeUrl introduces.
 *
 * @param {string} pRawTarget - The target captured between the link parens.
 * @returns {string} The cleaned target, ready for filesystem resolution.
 */
function cleanTarget(pRawTarget)
{
	let tmpTarget = String(pRawTarget || '').trim();

	// Drop an angle-bracket wrapper: [text](<url>) -> url
	tmpTarget = tmpTarget.replace(/^<+/, '').replace(/>+$/, '');

	// Drop a link title: (url "Title") -> url
	let tmpSpaceIndex = tmpTarget.search(/\s/);
	if (tmpSpaceIndex >= 0)
	{
		tmpTarget = tmpTarget.substring(0, tmpSpaceIndex);
	}

	// Drop a #fragment and/or ?query
	tmpTarget = tmpTarget.split('#')[0].split('?')[0];

	// docuserve's mdSafeUrl percent-encodes underscores; the HTTP layer
	// decodes them back on fetch, so resolve against the decoded path.
	tmpTarget = tmpTarget.replace(/%5[fF]/g, '_');

	return tmpTarget.trim();
}

class DocuserveCommandCheckLinks extends libCommandLineCommand
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.options.CommandKeyword = 'check-links';
		this.options.Description = 'Scan a docs folder for unresolvable local links and image/media references.';

		this.options.CommandArguments.push({ Name: '[docs-path]', Description: 'Documentation folder to check (defaults to ./docs/).' });

		this.addCommand();
	}

	onRun()
	{
		let tmpDocsRoot = libPath.resolve(this.ArgumentString || './docs/');

		if (!directoryExists(tmpDocsRoot))
		{
			this.log.error(`Docs folder not found at [${tmpDocsRoot}].`);
			process.exit(1);
			return;
		}

		this.log.info(`Checking local links + media references under [${tmpDocsRoot}]...`);

		let tmpFiles = collectMarkdownFiles(tmpDocsRoot);
		if (tmpFiles.length < 1)
		{
			this.log.info(`No markdown files found; nothing to check.`);
			return;
		}

		let tmpLinkCount = 0;
		let tmpImageCount = 0;
		let tmpBroken = [];

		for (let f = 0; f < tmpFiles.length; f++)
		{
			let tmpFilePath = tmpFiles[f];
			let tmpContent;
			try
			{
				tmpContent = libFS.readFileSync(tmpFilePath, 'utf8');
			}
			catch (pError)
			{
				this.log.warn(`Could not read [${tmpFilePath}]: ${pError.message}`);
				continue;
			}

			let tmpReferences = this._extractReferences(tmpContent);
			for (let r = 0; r < tmpReferences.length; r++)
			{
				let tmpReference = tmpReferences[r];

				if (tmpReference.IsImage)
				{
					tmpImageCount++;
				}
				else
				{
					tmpLinkCount++;
				}

				let tmpTarget = cleanTarget(tmpReference.Target);
				if (isExternalOrAnchor(tmpTarget) || (tmpTarget === ''))
				{
					continue;
				}

				let tmpResolution = tmpReference.IsImage
					? this._resolveImageReference(tmpTarget, tmpFilePath, tmpDocsRoot)
					: this._resolveDocumentLink(tmpTarget, tmpFilePath, tmpDocsRoot);

				if (!tmpResolution.OK)
				{
					tmpBroken.push(
					{
						File: libPath.relative(tmpDocsRoot, tmpFilePath),
						Line: tmpReference.Line,
						Snippet: tmpReference.Snippet,
						Reason: tmpResolution.Reason
					});
				}
			}
		}

		this.log.info(`Checked ${tmpLinkCount} link(s) + ${tmpImageCount} image reference(s) across ${tmpFiles.length} file(s).`);

		if (tmpBroken.length > 0)
		{
			this.log.error(`Found ${tmpBroken.length} broken reference(s):`);
			for (let i = 0; i < tmpBroken.length; i++)
			{
				let tmpEntry = tmpBroken[i];
				this.log.error(`  ${tmpEntry.File}:${tmpEntry.Line}  ${tmpEntry.Snippet}  -> ${tmpEntry.Reason}`);
			}
			process.exit(1);
			return;
		}

		this.log.info(`All local links + media references resolve.`);
	}

	/**
	 * Extract every inline link and image reference from a markdown document.
	 *
	 * Fenced code blocks and inline code spans are skipped so that example
	 * code containing `[text](target)` is never treated as a real link.
	 *
	 * @param {string} pContent - The raw markdown text.
	 * @returns {object[]} { Target, IsImage, Line, Snippet } per reference.
	 */
	_extractReferences(pContent)
	{
		let tmpReferences = [];
		let tmpLines = String(pContent).split(/\r?\n/);
		let tmpInFence = false;

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i];

			// Toggle on fenced code block boundaries (backtick fences, to
			// match the content provider's markdown parser).
			if (/^\s*`{3,}/.test(tmpLine))
			{
				tmpInFence = !tmpInFence;
				continue;
			}
			if (tmpInFence)
			{
				continue;
			}

			// Drop inline code spans so `[x](y)` in backticks is not a link.
			let tmpScrubbed = tmpLine.replace(/`[^`]*`/g, ' ');

			// Images: ![alt](target)
			let tmpImageRegEx = /!\[[^\]]*\]\(([^)]+)\)/g;
			let tmpImageMatch;
			while ((tmpImageMatch = tmpImageRegEx.exec(tmpScrubbed)) !== null)
			{
				tmpReferences.push(
				{
					Target: tmpImageMatch[1],
					IsImage: true,
					Line: i + 1,
					Snippet: tmpImageMatch[0]
				});
			}

			// Links: [text](target) — the [^!] guard excludes image links.
			let tmpLinkRegEx = /(^|[^!])(\[[^\]]*\]\(([^)]+)\))/g;
			let tmpLinkMatch;
			while ((tmpLinkMatch = tmpLinkRegEx.exec(tmpScrubbed)) !== null)
			{
				tmpReferences.push(
				{
					Target: tmpLinkMatch[3],
					IsImage: false,
					Line: i + 1,
					Snippet: tmpLinkMatch[2]
				});
			}
		}

		return tmpReferences;
	}

	/**
	 * Resolve a documentation link the way docuserve module-mode renders it,
	 * and report whether the target exists on disk.
	 *
	 * Every relative link — a .md page, a .html app, a directory, a media
	 * file — is resolved against the directory of the document that contains
	 * it, with ../ clamped at the docs root.  A /-rooted link is resolved
	 * against the docs root.
	 *
	 * @param {string} pTarget - The cleaned link target.
	 * @param {string} pCurrentFile - Absolute path of the file the link is in.
	 * @param {string} pDocsRoot - The absolute docs root folder.
	 * @returns {object} { OK, Reason }
	 */
	_resolveDocumentLink(pTarget, pCurrentFile, pDocsRoot)
	{
		let tmpBaseDir = '';
		let tmpHref = pTarget;
		if (pTarget.charAt(0) === '/')
		{
			tmpHref = pTarget.replace(/^\/+/, '');
		}
		else
		{
			tmpBaseDir = libPath.relative(pDocsRoot, libPath.dirname(pCurrentFile)).split(libPath.sep).join('/');
		}
		let tmpResolved = libPath.join(pDocsRoot, resolveRelativeDocPath(tmpBaseDir, tmpHref));

		if (fileExists(tmpResolved) || directoryExists(tmpResolved))
		{
			return { OK: true };
		}

		// An extensionless target may be a directory or an extensionless page
		// route — docuserve's page route also tries <target>.md and
		// <target>/README.md, so accept those too.
		let tmpBareTarget = pTarget.replace(/[#?].*$/, '').replace(/\/+$/, '');
		if (/\.md$/i.test(pTarget) || !/\.[a-z0-9]+$/i.test(tmpBareTarget))
		{
			if (fileExists(tmpResolved + '.md') || fileExists(libPath.join(tmpResolved, 'README.md')))
			{
				return { OK: true };
			}
		}

		return { OK: false, Reason: `no file at ${libPath.relative(pDocsRoot, tmpResolved) || '.'}` };
	}

	/**
	 * Resolve an image/media reference the way docuserve's image resolver does
	 * — relative to the containing document's directory, or docs-root-relative
	 * when the target is /-rooted — and report whether it exists on disk.
	 *
	 * @param {string} pTarget - The cleaned image target.
	 * @param {string} pCurrentFile - Absolute path of the file the ref is in.
	 * @param {string} pDocsRoot - The absolute docs root folder.
	 * @returns {object} { OK, Reason }
	 */
	_resolveImageReference(pTarget, pCurrentFile, pDocsRoot)
	{
		let tmpResolved;
		if (pTarget.charAt(0) === '/')
		{
			tmpResolved = libPath.normalize(libPath.join(pDocsRoot, pTarget.replace(/^\/+/, '')));
		}
		else
		{
			tmpResolved = libPath.normalize(libPath.join(libPath.dirname(pCurrentFile), pTarget));
		}

		if ((tmpResolved !== pDocsRoot) && (tmpResolved.indexOf(pDocsRoot + libPath.sep) !== 0))
		{
			return { OK: false, Reason: 'resolves outside the docs root' };
		}

		if (fileExists(tmpResolved))
		{
			return { OK: true };
		}

		return { OK: false, Reason: `no file at ${libPath.relative(pDocsRoot, tmpResolved) || '.'}` };
	}
}

module.exports = DocuserveCommandCheckLinks;
