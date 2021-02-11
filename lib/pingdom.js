// easy-pingdom (c) 2019 Oak's Lab
// This code is licensed under MIT license (see LICENSE for details)
'use strict';

const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

// Basic HTTP authorization
const headers = {
  Authorization: `Bearer ${process.env.PD_API_TOKEN}`,
};

const apiUrl = 'https://api.pingdom.com/api/3.1';

const raw = (method, endpoint, params, body) =>
  fetch(`${apiUrl}/${endpoint}${params ? '?' + new URLSearchParams(params).toString() : ''}`, {
    method: method || 'get',
    headers,
    body: body && new URLSearchParams(body).toString(),
  })
    .then((resp) => resp.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error.errormessage || 'An error occurred during the request.');
      }

      return data;
    });

exports.createCheck = (body) =>
  raw('post', 'checks', undefined, body).then((resp) => resp.check.id);

exports.readCheck = (id) => raw('get', 'checks/' + id).then((resp) => resp.check);

exports.readChecks = (qs) => raw('get', 'checks', qs).then((resp) => resp.checks);

exports.updateCheck = (id, body) =>
  raw('put', 'checks/' + id, undefined, body).then((resp) => resp.message);

exports.deleteCheck = (id) => raw('delete', 'checks/' + id).then((resp) => resp.message);
