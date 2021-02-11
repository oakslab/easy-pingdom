const { readCurrent, logger, helpEnv, helpLogging } = require('./lib');
const { readCheck } = require('./pingdom');

const queryCommand = (program) => {
  const command = program.command('query');

  command
    .usage('[options]')
    .option(
      '-f, --filter <regexp>',
      'Expression for filtering input and current check names, ignore case'
    )
    .option('    --filter-tag <tag>', 'Include only checks with this tag')
    .option('-v, --verbose', 'Display detailed info about each check');

  command.on('--help', () => {
    console.log('');

    console.log('# Description');
    console.log('Display current Pingdom configuration in JSON format to stdout');
    console.log('');

    helpLogging();
    helpEnv();

    console.log('# Examples:');
    console.log('## Display all current checks:');
    console.log('./bin/easy-pingdom.js query | jq -C . | less -R');
  });

  command.action(async ({ filterTag, filter, verbose }) => {
    try {
      const current = await readCurrent({ filterTag, filter });
      if (!verbose) {
        console.log(JSON.stringify(Array.from(current.values()), null, 2));
        return;
      }

      const detail = [];
      current.forEach(({ id }) => detail.push(readCheck(id)));
      console.log(JSON.stringify(await Promise.all(detail), null, 2));

      logger.debug('Pingdom query successfully finished');
    } catch (err) {
      logger.debug('ERROR', err);
    }
  });
};

module.exports = queryCommand;
