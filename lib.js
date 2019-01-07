const { inspect } = require('util');
const { normalize } = require('path');
const pingdomApi = require('pingdom-api');

const config = {};
exports.config = config;

const logger = {
  debug: console.error,
  info: console.error,
  notice: console.error,
  error: console.error,
};
exports.logger = logger;

exports.readCurrent = async () => {
  const { currentTag, filter } = config;

  logger.info('Reading all pingdom checks');

  // Fetch all pingdom checks
  const [ list ] = await exports.api.getChecks({ qs: { include_tags: true} } );

  const res = new Map();
  list.forEach(check => {
    if (currentTag && !check.tags.some(tag => tag.name === currentTag)) return;
    if (filter && !RegExp(filter, 'i').test(check.name)) return;

    res.set(check.name, check);
  });

  // logger.debug('PINGDOM CHECKS', list);
  return res;
};

exports.helpEnv = () => {
  console.log('# Environmnent variables');
  console.log('For script to be working properly the following environment variables needs to be set up:');
  console.log('export PD_USERNAME="me@example.com"');
  console.log('export PD_PASSWORD="my pingdom password"');
  console.log('export PD_KEY="my pingdom api key"');
  console.log('');
};

exports.helpLogging = () => {
  console.log('# Logging');
  console.log('Logging is directed to stderr');
  console.log('Output on stdout is stringified JSON. It\'s possible to pipe and parse it using `jq` command.');
  console.log('');

  // TODO: examples
};

exports.setupConfig = program => {
  // Read commander configuration
  program.parse(process.argv);

  program.options.forEach(option => {
    const name = option.attributeName();
    config[name] = program[name];
  });

  // Prepare regexp
  if (program.filter) {
    exports.filterRexp = RegExp(program.filter, 'i');
  }

  // Read Pingdom API configuration from env
  exports.api = pingdomApi({
    user: process.env.PD_USERNAME,
    pass: process.env.PD_PASSWORD,
    appkey: process.env.PD_KEY,
  });

  // process.exit(1);
  return config;
};

const inputNameRegexp = /^(www\.)?([^\/]*)\/?(.*)$/;

// Convert input check into querystring
const inputToQs = (pdCheck, update) => {
  const res = {};
  Object.entries(pdCheck).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) res[key] = value.join(',');
    } else {
      res[key] = value;
    }
  });

  if (update) delete res.type;

  // logger.debug('PD_CHECK TO QS', res);
  return res;
};

const isSameArray = (a1, a2) => {
  if ((a1 && a1.length || 0) !== (a2 && a2.length || 0)) return false;
  const iter = a1.sort().values();
  return ! a2.sort().some(item => item !== iter.next().value);
};

const getDiff = (current, input) => {
  const res = [];
  // logger.debug('COMPARE', current, input);

  const checkRoot = (currentKey, inputKey) => {
    if (current[currentKey] !== input[inputKey || currentKey]) res.push(currentKey);
  }

  checkRoot('hostname', 'host');
  checkRoot('ipv6');
  checkRoot('resolution');
  checkRoot('sendnotificationwhendown');
  checkRoot('notifyagainevery');
  checkRoot('notifywhenbackup');
  checkRoot('responsetime_threshold');

  if (current.status === 'paused' && !input.paused) res.push('paused');

  if (current.type.http.url !== input.url) res.push('url');
  if (current.type.http.port !== input.port) res.push('port');
  if (current.type.http.encryption !== input.encryption) res.push('encryption');
  if (current.type.http.shouldcontain !== input.shouldcontain) res.push('should_contain');
  if (current.type.http.verify_certificate !== input.verify_certificate) res.push('verify_certificate');

  if (! isSameArray(current.tags.map(item => item.name), input.tags)) res.push('tags');
  if (! isSameArray(current.integrationids, input.integrationids)) res.push('integrations');

  if (res.length) return res;
  return undefined;
};

const createNew = async input => {
  const res = { action: 'create', process: config.update || false, input };

  if (res.process) {
    logger.debug('CREATING NEW', input.name);
    await exports.api.setChecks({ qs: inputToQs(input) });
  } else {
    logger.debug('Not creating due to missing --update: ', input.name);
  }

  return res;
};

const deleteExisting = async (current) => {
  if (current.updated) return;
  const [ check ] = await exports.api.getChecks({ target: current.id });

  if (! check.tags.some(tag => tag.name === 'managed')) return;

  const res = { action: 'delete', process: config.delete || false, current: check };
  if (config.delete) {
    logger.debug('DELETING', current.id, current.name);
    await exports.api.removeChecks({ target: current.id });
  } else {
    logger.debug('Not deleting due to missing --delete: ', current.name, current.id);
  }

  return res;
};

const updateExisting = async (current, input) => {
  if (current.updated) throw new Error(`Check was already updated ${current.name}`);
  current.updated = true;

  const [ check ] = await exports.api.getChecks({ target: current.id });
  // logger.debug('CHECK', check);

  const diff = getDiff(check, input);
  if (! diff && ! config.forceUpdate) return;

  const res = {
    action: 'update',
    process: config.update || config.forceUpdate || false,
    diff,
    input,
    current: check,
  };

  if (res.process) {
    logger.debug('UPDATING EXISTING', current.id, input.name);
    await exports.api.updateChecks({ target: current.id, qs: inputToQs(input, true) });
  } else {
    logger.debug('Not updating due to missing --update: ', current.name, current.id);
  }

  return res;
};

/**
 * Parse input file
 *
 * input: {
 *   name
 *   host
 *   url
 *   port
 *   ipv6
 *   verifyCertificate
 *   notifyCritical
 *   shouldContain
 *   paused: Boolean
 * }
 */
const parseInputCheck = (projectName, project, stageName, stage, name, input) => {
  // logger.debug('INPUT TO PD_CHECK', projectName, stageName, name, input);

  if (typeof input === 'string') {
    const match = name.match(inputNameRegexp);
    if (! match) throw new Error('Invalid input name');
    name = match[2];
    input = {
      name,
      host: `${match[1] || ''}${name}`,
      url: match[3],
      shouldContain: input,
    };
  } else if (input.name) {
    name = input.name;
  }

  const res = {
    name,
    type: 'http',
    host: input.host || name,
    url: input.url ? `/${input.url}` : '/',
    tags: [
      'managed',
      stageName,
      projectName,
    ],
    integrationids: [],
    ipv6: 'ipv6' in input ? input.ipv6 : false,
    encryption: true,
    port: input.port || 443,
    verify_certificate: 'verifyCertificate' in input ? input.verifyCertificate : true,
    paused: 'paused' in input ? input.paused : config.paused,
    userids: '',
    teamids: '',
    resolution: 1,
    sendnotificationwhendown: 6,
    notifyagainevery: 0,
    notifywhenbackup: true,
    responsetime_threshold: 10000,
  };

  if (stage.integration) res.integrationids.push(stage.integration);

  if (config.criticalIntegration) {
    if ('notifyCritical' in input) {
      if (input.notifyCritical) res.integrationids.push(config.criticalIntegration);
    } else if (stageName === 'production') {
      res.integrationids.push(config.criticalIntegration);
    }
  }

  if ('shouldContain' in input) res.shouldcontain = input.shouldContain;

  // logger.debug('PD_CHECK', res);
  return res;
};

/**
 * Read input file
 */
exports.readInput = () => {
  let filename = config.input;
  if (!filename.startsWith('/')) {
    filename = normalize(`${process.cwd()}/${filename}`);
  }

  const projects = require(filename);

  const res = new Map();

  Object.entries(projects).forEach(([projectName, project]) => {
    if (! project.stages) return;

    Object.entries(project.stages).forEach(([stageName, stage]) => {
      if (! stage.https) return;

      Object.entries(stage.https).forEach(([key, value]) => {
        const input = parseInputCheck(projectName, project, stageName, stage, key, value);
        if (config.inputTag && input.tags.indexOf(config.inputTag) < 0) return;
        if (exports.filterRexp && !exports.filterRexp.test(input.name)) return;

        if (res.has(input.name)) throw new Error(`Duplicit check name on input: ${input.name}`);
        res.set(input.name, input);
      });
    });
  });

  // logger.debug('PROJECTS TO PD_CHECKS', res);
  return res;
};

/**
 * Update checks based on config
 */
exports.update = async () => {
  // Get all input checks
  const input = await exports.readInput();
  const current = await exports.readCurrent();

  // Create or update defined checks
  const updates = await Promise.all(Array.from(input.values()).map(async value => {
    if (current.has(value.name)) return updateExisting(current.get(value.name), value);
    return createNew(value);
  }));

  // Delete all missing checks
  const deletes = await Promise.all(Array.from(current.values()).map(deleteExisting));

  const actions = updates.concat(deletes).filter(item => Boolean(item));

  if (! config.json) return;
  
  actions.unshift({
    action: 'info',
    actions: actions.length,
    inputs: input.size,
    currents: current.size,
  });
  if (actions.length === 1) return console.log(JSON.stringify(actions[0]));
  return console.log(JSON.stringify(actions));
};

