const { raw } = require('@mikro-orm/core');

const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

function embedding(query, values, em) {
  return raw ? raw(query, values) : em.raw(query, values);
}

function distance(op, column, value, em) {
  return raw ? raw(`?? ${op} ?`, [column, toSql(value)]) : em.raw(`?? ${op} ?`, [column, toSql(value)]);
}

function extend(em) {
  // extension support related methods
  em.createLanternExtension = function () {
    return em.execute('CREATE EXTENSION IF NOT EXISTS lantern');
  };

  em.createLanternExtrasExtension = function () {
    return em.execute('CREATE EXTENSION IF NOT EXISTS lantern_extras');
  };

  // embedding generation methods
  em.generateTextEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return em.execute(`SELECT text_embedding('${modelName}', ?)`, [value]);
  };

  em.generateImageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return em.execute(`SELECT image_embedding('${modelName}', ?)`, [value]);
  };

  // embedding literals
  em.textEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return embedding(`text_embedding('${modelName}', ??)`, [value], em);
  };

  em.imageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return embedding(`image_embedding('${modelName}', ??)`, [value], em);
  };

  // distance search literals
  em.l2Distance = function (column, value) {
    return distance('<->', column, value, em);
  };

  em.cosineDistance = function (column, value) {
    return distance('<=>', column, value, em);
  };

  em.hammingDistance = function (column, value) {
    return distance('<+>', column, value, em);
  };
}

module.exports = { fromSql, toSql, extend };
