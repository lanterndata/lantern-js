const { sql } = require('drizzle-orm');

const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

// extension support related methods
exports.createLanternExtension = function () {
  return sql`CREATE EXTENSION IF NOT EXISTS lantern`;
};

exports.createLanternExtrasExtension = function () {
  return sql`CREATE EXTENSION IF NOT EXISTS lantern_extras`;
};

// embedding generation methods
exports.generateTextEmbedding = function (modelKey, value) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return sql`SELECT text_embedding(${modelName}, ${value})`;
};

exports.generateImageEmbedding = function (modelKey, value) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return sql`SELECT image_embedding(${modelName}, ${value})`;
};

// embedding literals
exports.textEmbedding = function (modelKey, text) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return sql`text_embedding(${modelName}, ${text})`;
};

exports.imageEmbedding = function (modelKey, url) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return sql`image_embedding(${modelName}, ${url})`;
};

exports.openaiEmbedding = function (modelKey, text, dimension) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return dimension ? sql`openai_embedding(${modelName}, ${text}, ${dimension})` : sql`openai_embedding(${modelName}, ${text})`;
};

exports.cohereEmbedding = function (modelKey, text) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return sql`cohere_embedding(${modelName}, ${text})`;
};

// distance search literals
exports.l2Distance = function (column, value) {
  const escapedValue = toSql(value);
  return sql`${column} <-> ${escapedValue}`;
};

exports.cosineDistance = function (column, value) {
  const escapedValue = toSql(value);
  return sql`${column} <=> ${escapedValue}`;
};

exports.hammingDistance = function (column, value) {
  const escapedValue = toSql(value);
  return sql`${column} <+> ${escapedValue}`;
};

exports.fromSql = fromSql;
exports.toSql = toSql;
