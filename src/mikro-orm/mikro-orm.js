const { raw } = require('@mikro-orm/core');
const { MikroORM } = require('@mikro-orm/postgresql');

const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

function embedding(query, values, em) {
  return raw
    ? raw(query, values)
    : em.raw(query, values);
}

function distance(op, column, value, em) {
  return raw
    ? raw(`?? ${op} ?`, [column, toSql(value)])
    : em.raw(`?? ${op} ?`, [column, toSql(value)]);
}

function extend(em) {
  // extension support related methods
  MikroORM.createLanternExtension = function () {
    return em.execute('CREATE EXTENSION IF NOT EXISTS lantern');
  };

  MikroORM.createLanternExtrasExtension = function () {
    return em.execute('CREATE EXTENSION IF NOT EXISTS lantern_extras');
  };

  // embedding generation methods
  MikroORM.generateTextEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return em.execute(`SELECT text_embedding('${modelName}', ?)`, [value]);
  };

  MikroORM.generateImageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return em.execute(`SELECT image_embedding('${modelName}', ?)`, [value]);
  };

  // embedding literals
  MikroORM.textEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return embedding(`text_embedding('${modelName}', ??)`, [value], em);
  };

  MikroORM.imageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return embedding(`image_embedding('${modelName}', ??)`, [value], em);
  };

  // distance search literals
  MikroORM.l2Distance = function (column, value) {
    return distance('<->', column, value, em);
  };

  MikroORM.cosineDistance = function (column, value) {
    return distance('<=>', column, value, em);
  };

  MikroORM.hammingDistance = function (column, value) {
    return distance('<+>', column, value, em);
  };
}

module.exports = { fromSql, toSql, extend };
