#!/usr/bin/env node

// easy-pingdom (c) 2019 Oaks Lab
// This code is licensed under MIT license (see LICENSE for details)

const { normalize } = require('path');
const program = require('commander');
const { readCurrent, logger, helpEnv, helpLogging, setupConfig, packageJson } = require('./lib');
const { readCheck } = require('./pingdom');

program
  .version(packageJson.version)
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
  const current = await readCurrent();
  if (!config.verbose) {
    console.log(JSON.stringify(Array.from(current.values())));
    return;
  }

  const detail = [];
  current.forEach(({ id }) => detail.push(readCheck(id)));
  console.log(JSON.stringify(await Promise.all(detail)));
};

main()
  .then(() => logger.debug('Pingdom query successfully finished'))
  .catch(err => logger.debug('ERROR', err))
;
