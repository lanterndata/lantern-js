require('lanterndata/knex');

const objection = require('objection');

const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

// embedding literals
exports.textEmbedding = function (modelKey, value) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return objection.raw(`text_embedding('${modelName}', ??)`, [value]);
};

exports.imageEmbedding = function (modelKey, value) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return objection.raw(`image_embedding('${modelName}', ??)`, [value]);
};

// distance search literals
exports.l2Distance = function (column, value) {
  return objection.raw('?? <-> ?', [column, toSql(value)]);
};

exports.cosineDistance = function (column, value) {
  return objection.raw('?? <=> ?', [column, toSql(value)]);
};

exports.hammingDistance = function (column, value) {
  return objection.raw('?? <+> ?', [column, toSql(value)]);
};

exports.fromSql = fromSql;
exports.toSql = toSql;
