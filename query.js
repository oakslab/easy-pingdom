#!/usr/bin/env node

const { normalize } = require('path');
const program = require('commander');
const { readCurrent, api, logger, helpEnv, helpLogging, setupConfig } = require('./lib');

program
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --filter <regexp>', 'Expression for filtering input and current check names, ignore case')
  .option('    --current-tag <tag>', 'Tag name to be filtered on current')
  .option('-v, --verbose', 'Display detailed info about each check')
;

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

const config = setupConfig(program);

const main = async () => {
  let output = await readCurrent();
  if (config.verbose) {
    output = output.map(item => readCurrentItem(item.id));
  }
  console.log(JSON.stringify(Array.from(output.values())));
};

main()
  .then(() => logger.debug('Pingdom query successfully finished'))
  .catch(err => logger.debug('ERROR', err))
;
