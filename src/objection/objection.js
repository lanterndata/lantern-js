const knex = require('knex');
const objection = require('objection');
const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');


// embedding literals
// knex.QueryBuilder.extend('textEmbedding', function (modelKey, value) {
//   const modelName = getTextEmbeddingModelName(modelKey);
//   return this.client.raw(`text_embedding('${modelName}', ??)`, [value]);
// });

// knex.QueryBuilder.extend('imageEmbedding', function (modelKey, value) {
//   const modelName = getImageEmbeddingModelName(modelKey);
//   return this.client.raw(`image_embedding('${modelName}', ??)`, [value]);
// });

// distance search literals
exports.l2Distance = function (column, value) {
  return objection.raw('?? <-> ?', [column, toSql(value)]);
};

// knex.QueryBuilder.extend('cosineDistance', function (column, value) {
//   return this.client.raw('?? <=> ?', [column, toSql(value)]);
// });

// knex.QueryBuilder.extend('hammingDistance', function (column, value) {
//   return this.client.raw('?? <+> ?', [column, toSql(value)]);
// });

exports.fromSql = fromSql;
exports.toSql = toSql;