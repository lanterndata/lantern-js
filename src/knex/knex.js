const knex = require('knex');
const { fromSql, toSql } = require('../_common/utils/sql');

knex.SchemaBuilder.extend('addExtension', function(name) {
  return this.raw('CREATE EXTENSION IF NOT EXISTS ??', [name]);
});

knex.QueryBuilder.extend('l2', function(column, value) {
  return this.client.raw('?? <-> ?', [column, toSql(value)]);
});

knex.QueryBuilder.extend('cosine', function(column, value) {
  return this.client.raw('?? <=> ?', [column, toSql(value)]);
});

knex.QueryBuilder.extend('hamming', function(column, value) {
  return this.client.raw('?? <+> ?', [column, toSql(value)]);
});

module.exports = {fromSql, toSql};
