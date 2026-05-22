const libCLIProgram = require('pict-service-commandlineutility');

let _PictCLIProgram = new libCLIProgram(
	{
		Product: 'pict-docuserve',
		Version: require('../../package.json').version,

		Command: 'pict-docuserve',
		Description: 'Documentation viewer powered by Pict.  Serve or inject documentation assets for any markdown folder.'
	},
	[
		require('./commands/Docuserve-Command-Serve.js'),
		require('./commands/Docuserve-Command-Inject.js'),
		require('./commands/Docuserve-Command-PrepareLocal.js'),
		require('./commands/Docuserve-Command-StageExamples.js'),
		require('./commands/Docuserve-Command-CheckLinks.js')
	]);

module.exports = _PictCLIProgram;
