const knex = require('knex');
const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

// extension support related methods
exports.createLanternExtension = () => 'CREATE EXTENSION IF NOT EXISTS lantern';

exports.createLanternExtrasExtension = () => 'CREATE EXTENSION IF NOT EXISTS lantern_extras';


exports.fromSql = fromSql;
exports.toSql = toSql;
