const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

function extend(sql) {
  sql.createLanternExtension = function () {
    return sql`CREATE EXTENSION IF NOT EXISTS lantern`;
  };

  sql.createLanternExtrasExtension = function () {
    return sql`CREATE EXTENSION IF NOT EXISTS lantern_extras`;
  };

  // embedding generation methods
  sql.generateTextEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return sql`SELECT text_embedding(${modelName}, ${value})`;
  };

  sql.generateImageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return sql`SELECT image_embedding(${modelName}, ${value})`;
  };

  // embedding literals
  sql.textEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return sql`text_embedding(${modelName}, ${sql.ref(value)})`;
  };

  sql.imageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return sql`image_embedding(${modelName}, ${sql.ref(value)})`;
  };

  // distance search literals
  sql.l2Distance = function (column, value) {
    return sql`${sql.ref(column)} <-> ${toSql(value)}`;
  };

  sql.cosineDistance = function (column, value) {
    return sql`${sql.ref(column)} <=> ${toSql(value)}`;
  };

  sql.hammingDistance = function (column, value) {
    return sql`${sql.ref(column)} <+> ${toSql(value)}`;
  };
}

module.exports = { fromSql, toSql, extend };
