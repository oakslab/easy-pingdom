# Easy Pingdom
Package containing scripts to automate configuration of Pingdom https checks. It can be easily integrated with travis.

Scripts:
- query.js - Query pingdom configuration
- update.js - Update configuration based on input file

## Example
Setup or update checking of https://example.com site to your Pingdom configuration
```
git clone git@github.com:oakslab/easy-pingdom.git
cd easy-pingdom
npm install

export PD_USERNAME='me@example.com'       # Change to your pingdom login
export PD_PASSWORD='my pingdom password'  # Change to your pingdom password
export PD_KEY='my pingdom api key'        # Create API key here: https://my.pingdom.com/account/appkeys

./update.js --no-paused --filter example --update example.js
```

## update.js
To get help run `update.js --help`

Updates all checks that has `managed` tag assigned.

## query.js
To get help run `query.js --help`

Query configured checks from pingdom.com

# License
Licensed under MIT license (see LICENSE for details)
