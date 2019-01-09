// easy-pingdom (c) 2019 Oaks Lab
// This code is licensed under MIT license (see LICENSE for details)

const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

// Basic HTTP authorization
const headers = {
  'Authorization': 'Basic ' + new Buffer(process.env.PD_USERNAME + ':' + process.env.PD_PASSWORD, 'utf8').toString('base64'),
  'App-Key': process.env.PD_KEY,
};

const apiUrl = 'https://api.pingdom.com/api/2.1';

const raw = (method, endpoint, params, body) =>
  fetch(
    apiUrl + '/' + endpoint + (params ? '?' + params.toString() : ''),
    {
      method: method || 'get',
      headers,
      body: body && new URLSearchParams(body).toString()
    }
  ).then(resp => resp.json())

exports.createCheck = body =>
  raw(
    'post',
    'checks',
    undefined,
    body
  ).then(resp => {
    resp.check.id;
  })

exports.readCheck = id =>
  raw(
    'get',
    'checks/' + id
  ).then(resp => resp.check)

exports.readChecks = qs =>
  raw(
    'get',
    'checks',
    qs
  ).then(resp => resp.checks)

exports.updateCheck = (id, body) =>
  raw(
    'put',
    'checks/' + id,
    undefined,
    body
  ).then(resp => resp.message)

exports.deleteCheck = id =>
  raw(
    'delete',
    'checks/' + id,
  ).then(resp => resp.message)

