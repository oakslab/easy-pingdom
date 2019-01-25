// easy-pingdom (c) 2019 Oak's Lab
// This code is licensed under MIT license (see LICENSE for details)
'use strict';

// 'example' is the project name, there could be multiple projects in this file
exports.example = {

  // There can be multiple 'stages' for the project
  stages: {

    // "staging" endpoints
    staging: {

      // Multiple HTTPS checks can be defined here
      https: {

        // Short version, just the endpoint, that should be checked and expected string
        'example.com': 'Example Domain',
      },
    },

    // "production" endpoints
    production: {

      // Each stage can be notified using different integration ID
      // Integrations are not possible to create using Pingdom API, it must be created manually and fetched using `query --verbose`
      integration: 85749,

      // Multiple HTTPS checks can be defined here
      https: {
        // Name of Pingdom check
        'Production example frontend': {

          // Checked host
          host: 'example.com',

          // Whether to use IPv6 (default is false)
          ipv6: false,

          // What port to use (default is 443)
          port: 443,

          // Checked url on host (default is empty string)
          // url: 'liveness-readiness-check',

          // Expected string (default is empty string)
          shouldContain: 'This domain is established to be used for illustrative examples in documents. You may use this domain in examples without prior coordination or asking for permission.',
 
          // Whether to verify certificate (default is `true`)
          verifyCertificate: true,

          // Whether to setup check as paused (default is `true`)
          paused: true,
        },

        // Another HTTPS check
        'Production example backend': {
          host: 'example.com',
          shouldContain: 'Example',
        },
      },
    },
  },
};


