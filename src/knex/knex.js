const knex = require('knex');
const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

// extension support related methods
knex.SchemaBuilder.extend('createLanternExtension', function () {
  return this.raw('CREATE EXTENSION IF NOT EXISTS lantern');
});

knex.SchemaBuilder.extend('createLanternExtrasExtension', function () {
  return this.raw('CREATE EXTENSION IF NOT EXISTS lantern_extras');
});

// embedding generation methods
knex.QueryBuilder.extend('generateTextEmbedding', function (modelKey, value) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return this.client.raw(`SELECT text_embedding('${modelName}', ?)`, [value]);
});

knex.QueryBuilder.extend('generateImageEmbedding', function (modelKey, value) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return this.client.raw(`SELECT image_embedding('${modelName}', ?)`, [value]);
});

// embedding literals
knex.QueryBuilder.extend('textEmbedding', function (modelKey, value) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return this.client.raw(`text_embedding('${modelName}', ??)`, [value]);
});

knex.QueryBuilder.extend('imageEmbedding', function (modelKey, value) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return this.client.raw(`image_embedding('${modelName}', ??)`, [value]);
});

// distance search literals
knex.QueryBuilder.extend('l2Distance', function (column, value) {
  return this.client.raw('?? <-> ?', [column, toSql(value)]);
});

knex.QueryBuilder.extend('cosineDistance', function (column, value) {
  return this.client.raw('?? <=> ?', [column, toSql(value)]);
});

knex.QueryBuilder.extend('hammingDistance', function (column, value) {
  return this.client.raw('?? <+> ?', [column, toSql(value)]);
});

module.exports = { fromSql, toSql };
