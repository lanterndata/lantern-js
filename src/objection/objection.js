require('lanterndata/knex');

const objection = require('objection');

const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

// embedding literals
exports.textEmbedding = function (modelKey, text) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return objection.raw(`text_embedding('${modelName}', ?)`, [text]);
};

exports.imageEmbedding = function (modelKey, url) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return objection.raw(`image_embedding('${modelName}', ?)`, [url]);
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
