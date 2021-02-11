Status: BETA
Pingdom API Version: 3.1

# Easy Pingdom
Package containing scripts to automate configuration of Pingdom https checks. It can be easily integrated with travis.

Scripts:
- `bin/easy-pingdom.js query [options]` - Query pingdom configuration
- `bin/easy-pingdom.js update [options] <input file>` - Update configuration based on input file

## Example
Setup or update checking of https://example.com site to your Pingdom configuration
```
git clone git@github.com:oakslab/easy-pingdom.git
cd easy-pingdom
npm install

export PD_API_TOKEN='my pingdom api token'    # Create API token here: https://my.pingdom.com/app/api-tokens

# See what will be done
./bin/easy-pingdom.js update --no-paused --filter example examples/simple.js

# Update Pingdom configuration
./bin/easy-pingdom.js update --no-paused --filter example examples/simple.js --update
```

## update.js
To get help run `./bin/easy-pingdom.js update --help`

Updates all checks that has `managed` tag assigned. For reference see `examples/advanced.js` file.

## query.js
To get help run `./bin/easy-pingdom.js query --help`

Query configured checks from pingdom.com

# License
Licensed under MIT license (see LICENSE for details)
