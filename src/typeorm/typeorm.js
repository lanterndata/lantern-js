const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

function distance(op, column, param) {
  return `${column} ${op} ${param}`
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
