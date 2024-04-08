const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

function distance(op, column, param) {
  return `${column} ${op} ${param}`;
}

// extension support related methods
exports.createLanternExtension = () => 'CREATE EXTENSION IF NOT EXISTS lantern';
exports.createLanternExtrasExtension = () => 'CREATE EXTENSION IF NOT EXISTS lantern_extras';

// embedding generation methods
exports.generateTextEmbedding = function (modelKey) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return `SELECT text_embedding('${modelName}', $1);`;
};

exports.generateImageEmbedding = function (modelKey) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return `SELECT image_embedding('${modelName}', $1);`;
};

// embedding literals
exports.textEmbedding = function (modelKey, paramName) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return `text_embedding('${modelName}', :${paramName})`;
};

exports.imageEmbedding = function (modelKey, paramName) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return `image_embedding('${modelName}', :${paramName})`;
};

exports.openaiEmbedding = function (modelKey, paramName, dimensionParamName) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return dimensionParamName ? `openai_embedding('${modelName}', :${paramName}, :${dimensionParamName})` : `openai_embedding('${modelName}', :${paramName})`;
};

exports.cohereEmbedding = function (modelKey, paramName) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return `cohere_embedding('${modelName}', :${paramName})`;
};

// distance search literals
exports.l2Distance = function (column, param) {
  return distance('<->', column, param);
};

exports.cosineDistance = function (column, param) {
  return distance('<=>', column, param);
};

exports.hammingDistance = function (column, param) {
  return distance('<+>', column, param);
};

exports.fromSql = fromSql;
exports.toSql = toSql;
