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

exports.openaiEmbedding = function (modelKey, text, dimension) {
  const modelName = getImageEmbeddingModelName(modelKey);
  return dimension ? objection.raw(`openai_embedding('${modelName}', ?, ?)`, [text, dimension]) : objection.raw(`openai_embedding('${modelName}', ?)`, [text]);
};

exports.cohereEmbedding = function (modelKey, text) {
  const modelName = getTextEmbeddingModelName(modelKey);
  return objection.raw(`cohere_embedding('${modelName}', ?)`, [text]);
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
