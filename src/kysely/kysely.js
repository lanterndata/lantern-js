const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

function extend({ Kysely, sql }) {
  Kysely.createLanternExtension = function () {
    return sql`CREATE EXTENSION IF NOT EXISTS lantern`;
  };
  
  Kysely.createLanternExtrasExtension = function () {
    return sql`CREATE EXTENSION IF NOT EXISTS lantern_extras`;
  };
  
  // embedding generation methods
  Kysely.generateTextEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return this.client.raw(`SELECT text_embedding('${modelName}', ?)`, [value]);
  };
  
  Kysely.generateImageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return this.client.raw(`SELECT image_embedding('${modelName}', ?)`, [value]);
  };
  
  // embedding literals
  Kysely.textEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return this.client.raw(`text_embedding('${modelName}', ??)`, [value]);
  };
  
  Kysely.imageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return this.client.raw(`image_embedding('${modelName}', ??)`, [value]);
  };
  
  // distance search literals
  Kysely.l2Distance = function (column, value) {
    return sql`${sql.ref(column)} <-> ${toSql(value)}`;
  };
  
  Kysely.cosineDistance = function (column, value) {
    return sql`${sql.ref(column)} <#> ${toSql(value)}`;
  };
  
  Kysely.hammingDistance = function (column, value) {
    return sql`${sql.ref(column)} <=> ${toSql(value)}`;
  };
}

module.exports = { fromSql, toSql, extend };
