const { sql } = require('drizzle-orm');

const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

function embedding(methodName, modelName, column, sequelize) {
  const quotedColumn = sequelize.dialect.queryGenerator.quoteIdentifier(column);
  return sql.raw(`${methodName}('${modelName}', ${quotedColumn})`);
}

function distance(op, column, value, sequelize) {
  const quotedColumn = sequelize.dialect.queryGenerator.quoteIdentifier(column);
  const escapedValue = sequelize.escape(toSql(value));
  return sql.raw(`${quotedColumn} ${op} ${escapedValue}`);
}

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
  return sql`SELECT text_embedding('${modelName}', ${value})`;
};

exports.generateImageEmbedding = function (modelKey, value) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return sql`SELECT image_embedding('${modelName}', ${value})`;
};

// embedding literals
exports.textEmbedding = function (modelKey, column) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return embedding('text_embedding', modelName, column, this);
};

exports.imageEmbedding = function (modelKey, column) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return embedding('image_embedding', modelName, column, this);
};

// distance search literals
exports.l2Distance = function (column, value) {
  return distance('<->', column, value, this);
};

exports.cosineDistance = function (column, value) {
  return distance('<=>', column, value, this);
};

exports.hammingDistance = function (column, value) {
  return distance('<+>', column, value, this);
};

exports.fromSql = fromSql;
exports.toSql = toSql;
