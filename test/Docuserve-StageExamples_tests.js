/**
* Unit tests for the stage-examples shared-vendor extension.
*
* `_stageSharedVendor` copies an example's declared heavy vendor files + asset
* directories into docs/examples/_shared/<Key>/ exactly once per run, rewrites
* every example's references to that shared copy, and skips the per-example
* copy — so N Excalidraw demos share one ~25MB runtime instead of carrying it N
* times.
*
* @license     MIT
* @author      Steven Velozo <steven@velozo.com>
*/

var Chai = require("chai");
var Expect = Chai.expect;

var libFS = require('fs');
var libPath = require('path');
var libOS = require('os');

var libStageExamples = require('../source/cli/commands/Docuserve-Command-StageExamples.js');

// Build a command instance WITHOUT running the constructor (which wires the
// command line program). The method under test only touches this.log and
// this._SharedVendorStaged, so a bare prototype instance is enough.
var makeCommand = () =>
{
	var tmpCommand = Object.create(libStageExamples.prototype);
	tmpCommand.log = { info: () => {}, warn: () => {} };
	return tmpCommand;
};

var rmrf = (pPath) =>
{
	try { libFS.rmSync(pPath, { recursive: true, force: true }); } catch (pError) { /* ignore */ }
};

suite
(
	'Docuserve stage-examples — shared vendor',
	() =>
	{
		var _Root = libPath.join(libOS.tmpdir(), 'docuserve-sharedvendor-test');
		var _Dist = libPath.join(_Root, 'dist');
		var _Docs = libPath.join(_Root, 'docs');
		var _SharedDir = libPath.join(_Docs, 'examples', '_shared', 'excalidraw');

		var makeFlag = () => (
		{
			SharedVendor:
			{
				Key: 'excalidraw',
				Scripts: [ 'excalidraw-wrapper.min.js' ],
				Styles: [ 'excalidraw-wrapper.css' ],
				AssetDirs: [ 'excalidraw-assets' ]
			}
		});

		setup
		(
			() =>
			{
				rmrf(_Root);
				libFS.mkdirSync(libPath.join(_Dist, 'excalidraw-assets', 'fonts'), { recursive: true });
				libFS.mkdirSync(_Docs, { recursive: true });
				// A .js with a sourceMappingURL pragma (must be stripped on stage).
				libFS.writeFileSync(libPath.join(_Dist, 'excalidraw-wrapper.min.js'), 'console.log("wrap");\n//# sourceMappingURL=excalidraw-wrapper.min.js.map\n');
				libFS.writeFileSync(libPath.join(_Dist, 'excalidraw-wrapper.css'), '.x{color:red}');
				libFS.writeFileSync(libPath.join(_Dist, 'excalidraw-assets', 'fonts', 'a.woff2'), 'FONTDATA');
			}
		);

		teardown(() => rmrf(_Root));

		test
		(
			'stages declared scripts, styles and asset dirs into examples/_shared/<Key>/',
			() =>
			{
				var tmpCommand = makeCommand();
				tmpCommand._stageSharedVendor({ Name: 'ex1', Flag: makeFlag() }, _Dist, _Docs);

				Expect(libFS.existsSync(libPath.join(_SharedDir, 'excalidraw-wrapper.min.js'))).to.equal(true);
				Expect(libFS.existsSync(libPath.join(_SharedDir, 'excalidraw-wrapper.css'))).to.equal(true);
				Expect(libFS.existsSync(libPath.join(_SharedDir, 'excalidraw-assets', 'fonts', 'a.woff2'))).to.equal(true);
			}
		);

		test
		(
			'strips the sourceMappingURL pragma from staged shared JS',
			() =>
			{
				var tmpCommand = makeCommand();
				tmpCommand._stageSharedVendor({ Name: 'ex1', Flag: makeFlag() }, _Dist, _Docs);

				var tmpJS = libFS.readFileSync(libPath.join(_SharedDir, 'excalidraw-wrapper.min.js'), 'utf8');
				Expect(tmpJS).to.not.contain('sourceMappingURL');
			}
		);

		test
		(
			'returns relative rewrites + a skip set for every shared file and asset dir',
			() =>
			{
				var tmpCommand = makeCommand();
				var tmpResult = tmpCommand._stageSharedVendor({ Name: 'ex1', Flag: makeFlag() }, _Dist, _Docs);

				Expect(tmpResult.Rewrites.get('excalidraw-wrapper.min.js')).to.equal('../_shared/excalidraw/excalidraw-wrapper.min.js');
				Expect(tmpResult.Rewrites.get('excalidraw-wrapper.css')).to.equal('../_shared/excalidraw/excalidraw-wrapper.css');
				Expect(tmpResult.Skip.has('excalidraw-wrapper.min.js')).to.equal(true);
				Expect(tmpResult.Skip.has('excalidraw-wrapper.css')).to.equal(true);
				Expect(tmpResult.Skip.has('excalidraw-assets')).to.equal(true);
			}
		);

		test
		(
			'copies the shared bundle only ONCE per run (dedup across examples)',
			() =>
			{
				var tmpCommand = makeCommand();

				// First example stages the bundle.
				tmpCommand._stageSharedVendor({ Name: 'ex1', Flag: makeFlag() }, _Dist, _Docs);
				Expect(libFS.existsSync(libPath.join(_SharedDir, 'excalidraw-wrapper.min.js'))).to.equal(true);

				// Remove it, then run a second example with the same Key. Because the
				// key was already staged this run, the file must NOT be re-copied...
				libFS.rmSync(_SharedDir, { recursive: true, force: true });
				var tmpResult = tmpCommand._stageSharedVendor({ Name: 'ex2', Flag: makeFlag() }, _Dist, _Docs);

				Expect(libFS.existsSync(libPath.join(_SharedDir, 'excalidraw-wrapper.min.js'))).to.equal(false);
				// ...but the second example still gets its rewrites + skip set.
				Expect(tmpResult.Rewrites.get('excalidraw-wrapper.min.js')).to.equal('../_shared/excalidraw/excalidraw-wrapper.min.js');
				Expect(tmpResult.Skip.has('excalidraw-assets')).to.equal(true);
			}
		);

		test
		(
			'is a no-op for examples without a SharedVendor declaration',
			() =>
			{
				var tmpCommand = makeCommand();
				var tmpResult = tmpCommand._stageSharedVendor({ Name: 'plain', Flag: {} }, _Dist, _Docs);

				Expect(tmpResult.Rewrites.size).to.equal(0);
				Expect(tmpResult.Skip.size).to.equal(0);
				Expect(libFS.existsSync(libPath.join(_Docs, 'examples', '_shared'))).to.equal(false);
			}
		);
	}
);
