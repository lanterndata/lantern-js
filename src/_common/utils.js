const util = require('util');

const fromSql = (value) =>
  value
    .substring(1, value.length - 1)
    .split(',')
    .map((v) => parseFloat(v));

const toSql = (value) => `{${value.join(',')}}`;

module.exports = { fromSql, toSql };
