// easy-pingdom (c) 2019 Oak's Lab
// This code is licensed under MIT license (see LICENSE for details)
'use strict';

const { helpEnv, helpLogging, logger, update, packageJson } = require('./lib');

const updateCommand = program => {
  const command = program.command('update <inputFile>');

  command
    .usage('[options] <input file>')
    .option(
      '-f, --filter <regexp>',
      'Expression for filtering input and current check names, ignore case',
    )
    .option('    --filter-tag <tag>', 'Include only checks with this tag')
    .option('-U, --update', 'Create or update checks')
    .option('    --force-update', 'Update checks even without need to be updated')
    .option('-D, --delete', 'Delete all managed checks not included in input')
    .option(
      '    --no-paused',
      'Whether to set updated or created checks into paused state. Default is to set updated or created checks to paused state to be able to manualy verify it.',
    )
    .option('    --json', 'Display info about all actions as JSON to stdout')
    .option(
      '    --critical-integration <id>',
      'Integration ID for critical checks. All checks in "production" stage are critical by default',
      parseInt,
    );

  command.on('--help', () => {
    console.log('');
    console.log('# Description');
    console.log('Script takes input JSON file and updates current Pingdom configuration');
    console.log('');

    helpLogging();
    helpEnv();

    console.log('# Examples:');
    console.log('## Display what would be done:');
    console.log('./bin/easy-pingdom.js update --filter "example" --json examples/simple.js | jq -C . | less -R');
    console.log('');
    console.log('## Update:');
    console.log('./bin/easy-pingdom.js update --filter "example" --update examples/simple.js');
    console.log('');
    console.log('## Update everything:');
    console.log('./bin/easy-pingdom.js update --update --delete --no-paused examples/simple.js');
  });

  command.action((inputFile, options) => {
    // const config = setupConfig(program);

    update(inputFile, options)
      .then(() => logger.debug('SUCCESS'))
      .catch(err => {
        logger.debug('ERROR', err);
        process.exit(1);
      });
  });
};

module.exports = updateCommand;
