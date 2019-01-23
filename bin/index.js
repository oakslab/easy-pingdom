#!/usr/bin/env node

// easy-pingdom (c) 2019 Oak's Lab
// This code is licensed under MIT license (see LICENSE for details)

const program = require('commander');
const packageJson = require('../package.json');

program.version(packageJson.version);

require('./query')(program);
require('./update')(program);

program.parse(process.argv);
