const fromSql = (value) =>
  value
    .substring(1, value.length - 1)
    .split(',')
    .map((v) => parseFloat(v));

const toSql = (value) => (Array.isArray(value) ? `{${value.join(',')}}` : value);

module.exports = { fromSql, toSql };
