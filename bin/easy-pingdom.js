#!/usr/bin/env node

// easy-pingdom (c) 2019 Oak's Lab
// This code is licensed under MIT license (see LICENSE for details)
'use strict';

const program = require('commander');
const packageJson = require('../package.json');

program.version(packageJson.version);

require('../lib/query')(program);
require('../lib/update')(program);

program.parse(process.argv);
