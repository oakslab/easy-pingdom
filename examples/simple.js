// easy-pingdom (c) 2019 Oak's Lab
// This code is licensed under MIT license (see LICENSE for details)
'use strict';

// Simple example, one project, one check
exports.example = {
  stages: {
    production: {
      https: {
        'example.com': 'Example Domain',
      },
    },
  },
};

