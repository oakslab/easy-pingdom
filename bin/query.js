// easy-pingdom (c) 2019 Oak's Lab
// This code is licensed under MIT license (see LICENSE for details)
const { readCurrent, logger, helpEnv, helpLogging } = require('../lib');
const { readCheck } = require('../pingdom');

const queryCommand = program => {
  program
    .command('query')
    .usage('[options]')
    .option(
      '-f, --filter <regexp>',
      'Expression for filtering input and current check names, ignore case',
    )
    .option('    --current-tag <tag>', 'Tag name to be filtered on current')
    .option('-v, --verbose', 'Display detailed info about each check');

  program.on('--help', () => {
    console.log('');

    console.log('# Description');
    console.log('Display current Pingdom configuration in JSON format to stdout');
    console.log('');

    helpLogging();
    helpEnv();

    console.log('# Examples:');
    console.log('## Display all current checks:');
    console.log('./easy-pingdom/query.js | jq -C . | less -R');
  });

  program.action(async ({ currentTag, filter, verbose }) => {
    try {
      const current = await readCurrent({ currentTag, filter });
      if (!verbose) {
        console.log(JSON.stringify(Array.from(current.values())));
        return;
      }

      const detail = [];
      current.forEach(({ id }) => detail.push(readCheck(id)));
      console.log(JSON.stringify(await Promise.all(detail)));

      logger.debug('Pingdom query successfully finished');
    } catch (err) {
      logger.debug('ERROR', err);
    }
  });
};

module.exports = queryCommand;
