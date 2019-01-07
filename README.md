# Easy Pingdom
Package containing scripts to automate configuration of Pingdom https checks. It can be easily integrated with travis.

- query.js - Query pingdom configuration
- update.js - Update configuration based on input file

## Example
Setup or update checking of https://example.com site to your Pingdom configuration
```
git clone git@github.com:oakslab/easy-pingdom.git
cd easy-pingdom
npm install
export PD_USERNAME='example@example.com'  # Change to your pingdom login
export PD_PASSWORD='examplepassword'      # Change to your pingdom password
export PD_KEY=''                          # Create API key here: https://my.pingdom.com/account/appkeys
./update.js --no-paused --filter example --update --input example.js
```

## Update
Updates all checks that has `managed` tag assigned.
