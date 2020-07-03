// easy-pingdom (c) 2019 Oak's Lab
// This code is licensed under MIT license (see LICENSE for details)
'use strict';

const { normalize } = require('path');
const { createCheck, readCheck, readChecks, updateCheck, deleteCheck } = require('./pingdom');

const logger = {
  debug: console.error,
  info: console.error,
  notice: console.error,
  error: console.error,
};
exports.logger = logger;

exports.readCurrent = async ({ filterTag, filter }) => {
  logger.info('Reading all pingdom checks');

  // Fetch all pingdom checks
  const checks = await readChecks({ include_tags: true });

  const res = new Map();
  checks.forEach(check => {
    if (filterTag && !check.tags.some(tag => tag.name === filterTag)) return;
    if (filter && !RegExp(filter, 'i').test(check.name)) return;

    res.set(check.name, check);
  });

  return res;
};

exports.helpEnv = () => {
  console.log('# Environmnent variables');
  console.log(
    'For script to be working properly the following environment variables needs to be set up:',
  );
  console.log('export PD_USERNAME="me@example.com"');
  console.log('export PD_PASSWORD="my pingdom password"');
  console.log('export PD_KEY="my pingdom api key"');
  console.log('');
};

exports.helpLogging = () => {
  console.log('# Logging');
  console.log('Logging is directed to stderr');
  console.log(
    "Output on stdout is stringified JSON. It's possible to pipe and parse it using `jq` command.",
  );
  console.log('');

  // TODO: examples
};

const inputNameRegexp = /^(https:\/\/)?(www\.)?([^\/]*)\/?(.*)$/;

// Convert input check into querystring
const inputToPingdom = (pdCheck, update) => {
  const res = {};
  Object.entries(pdCheck).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) res[key] = value.join(',');
    } else {
      res[key] = value;
    }
  });

  if (update) delete res.type;

  return res;
};

const isSameArray = (a1, a2) => {
  if (((a1 && a1.length) || 0) !== ((a2 && a2.length) || 0)) return false;
  const iter = a1.sort().values();
  return !a2.sort().some(item => item !== iter.next().value);
};

const getDiff = (current, input) => {
  const res = [];

  const checkRoot = (currentKey, inputKey) => {
    if (current[currentKey] !== input[inputKey || currentKey]) res.push(currentKey);
  };

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
  if (current.type.http.verify_certificate !== input.verify_certificate)
    res.push('verify_certificate');

  if (!isSameArray(current.tags.map(item => item.name), input.tags)) res.push('tags');
  if (!isSameArray(current.integrationids, input.integrationids)) res.push('integrations');

  if (res.length) return res;
  return undefined;
};

const createNew = async (input, config) => {
  const res = { action: 'create', process: config.update || false, input };

  if (res.process) {
    logger.debug('CREATING NEW', input.name);
    await createCheck(inputToPingdom(input));
  } else {
    logger.debug('Not creating due to missing --update: ', input.name);
  }

  return res;
};

const deleteExisting = async (current, config) => {
  if (current.updated) return;
  const check = await readCheck(current.id);

  if (!check.tags.some(tag => tag.name === 'managed')) return;

  const res = { action: 'delete', process: config.delete || false, current: check };
  if (config.delete) {
    logger.debug('DELETING', current.id, current.name);
    await deleteCheck(current.id);
  } else {
    logger.debug('Not deleting due to missing --delete: ', current.name, current.id);
  }

  return res;
};

const updateExisting = async (current, input, config) => {
  if (current.updated) throw new Error(`Check was already updated ${current.name}`);
  current.updated = true;

  const check = await readCheck(current.id);

  const diff = getDiff(check, input);
  if (!diff && !config.forceUpdate) return;

  const res = {
    action: 'update',
    process: config.update || config.forceUpdate || false,
    diff,
    input,
    current: check,
  };

  if (res.process) {
    logger.debug('UPDATING EXISTING', current.id, input.name);
    await updateCheck(current.id, inputToPingdom(input, true));
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
const parseHttpsInputCheck = (projectName, project, stageName, stage, name, input, config) => {
  // logger.debug('INPUT TO PD_CHECK', projectName, stageName, name, input);

  if (typeof input === 'string') {
    const match = name.match(inputNameRegexp);
    if (!match) throw new Error('Invalid input name');
    name = match[3];
    input = {
      name,
      host: `${match[2] || ''}${name}`,
      url: match[4],
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
    tags: ['managed', stageName, projectName],
    integrationids: [],
    ipv6: 'ipv6' in input ? Boolean(input.ipv6) : false,
    encryption: true,
    port: input.port || 443,
    verify_certificate: 'verifyCertificate' in input ? Boolean(input.verifyCertificate) : true,
    paused: 'paused' in input ? Boolean(input.paused) : config.paused,
    userids: '',
    teamids: '',
    resolution: 1,
    sendnotificationwhendown: 1,
    notifyagainevery: input.notifyagainevery || 60,
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
const parseHttpInputCheck = (projectName, project, stageName, stage, name, input, config) => {
  // logger.debug('INPUT TO PD_CHECK', projectName, stageName, name, input);

  if (typeof input === 'string') {
    const match = name.match(inputNameRegexp);
    if (!match) throw new Error('Invalid input name');
    name = match[3];
    input = {
      name,
      host: `${match[2] || ''}${name}`,
      url: match[4],
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
    tags: ['managed', stageName, projectName],
    integrationids: [],
    ipv6: 'ipv6' in input ? Boolean(input.ipv6) : false,
    encryption: false,
    port: input.port || 80,
    paused: 'paused' in input ? Boolean(input.paused) : config.paused,
    userids: '',
    teamids: '',
    resolution: 1,
    sendnotificationwhendown: 1,
    notifyagainevery: input.notifyagainevery || 60,
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

  return res;
};

/**
 * Read input file
 */
exports.readInput = (filename, config) => {
  if (!filename) {
    logger.error('Missing input file');
    throw new Error('Missing input file');
  }
  if (filename && !filename.startsWith('/')) {
    filename = normalize(`${process.cwd()}/${filename}`);
  }

  logger.notice('Reading from file:', filename);

  const projects = require(filename);

  const res = new Map();

  Object.entries(projects).forEach(([projectName, project]) => {
    if (!project.stages) return;

    Object.entries(project.stages).forEach(([stageName, stage]) => {
      if (stage.https)
        Object.entries(stage.https).forEach(([key, value]) => {
          const input = parseHttpsInputCheck(
            projectName,
            project,
            stageName,
            stage,
            key,
            value,
            config,
          );
          if (config.filterTag && input.tags.indexOf(config.filterTag) < 0) return;
          if (config.filter && !RegExp(config.filter, 'i').test(input.name)) return;

          if (res.has(input.name)) throw new Error(`Duplicit check name on input: ${input.name}`);
          res.set(input.name, input);
        });

      if (stage.http)
        Object.entries(stage.http).forEach(([key, value]) => {
          const input = parseHttpInputCheck(
            projectName,
            project,
            stageName,
            stage,
            key,
            value,
            config,
          );
          if (config.filterTag && input.tags.indexOf(config.filterTag) < 0) return;
          if (config.filter && !RegExp(config.filter, 'i').test(input.name)) return;

          if (res.has(input.name)) throw new Error(`Duplicit check name on input: ${input.name}`);
          res.set(input.name, input);
        });
    });
  });

  return res;
};

/**
 * Update checks based on config
 */
exports.update = async (filename, config) => {
  const { filterTag, filter } = config;

  // Get all input checks
  const input = await exports.readInput(filename, config);
  const current = await exports.readCurrent({ filterTag, filter });

  // Create or update defined checks
  const updates = await Promise.all(
    Array.from(input.values()).map(async value => {
      if (current.has(value.name)) return updateExisting(current.get(value.name), value, config);
      return createNew(value, config);
    }),
  );

  // Delete all missing checks
  const deletes = await Promise.all(
    Array.from(current.values()).map(check => deleteExisting(check, config)),
  );

  const actions = updates.concat(deletes).filter(item => Boolean(item));

  if (!config.json) return;

  actions.unshift({
    action: 'info',
    actions: actions.length,
    inputs: input.size,
    currents: current.size,
  });
  if (actions.length === 1) return console.log(JSON.stringify(actions[0]));
  return console.log(JSON.stringify(actions));
};
