#!/usr/bin/env node

const program = require('commander');
const { setupConfig, helpEnv, helpLogging, logger, update } = require('./lib');

program
  .version('0.1.0')
  .option('-i, --input <file>', 'Path to the input file')
  .option('-f, --filter <regexp>', 'Expression for filtering input and current check names, ignore case')
  .option('    --input-tag <tag>', 'Tag name to be filtered on input')
  .option('    --current-tag <tag>', 'Tag name to be filtered on current')
  .option('-U, --update', 'Create or update checks')
  .option('    --force-update', 'Update checks even without need to be updated')
  .option('-D, --delete', 'Delete all managed checks not included in input')
  .option('    --no-paused', 'Whether to set updated or created checks into paused state. Default is to set updated or created checks to paused state to be able to manualy verify it.')
  .option('    --json', 'Display info about all actions as JSON to stdout')
  .option('    --critical-integration <id>', 'Integration ID for critical checks. All checks in "production" stage are critical by default')
;

program.on('--help', () => {
  console.log('');
  console.log('# Description');
  console.log('Script takes input JSON file and updates current Pingdom configuration');
  console.log('');

  helpLogging();
  helpEnv();

  console.log('# Examples:');
  console.log('## Display what would be done:');
  console.log('scripts/update.js --filter "likewise" --json | jq -C . | less -R');
  console.log('');
  console.log('## Update:');
  console.log('scripts/update.js --filter "likewise" --update');
  console.log('');
  console.log('## Update everything:');
  console.log('./easy-pingdom/update.js --update --delete --no-paused');
});

const config = setupConfig(program);
  
update()
  .then(() => logger.debug('SUCCESS'))
  .catch(err => logger.debug('ERROR', err))
;
