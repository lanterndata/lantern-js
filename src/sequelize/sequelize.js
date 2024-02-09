const { fromSql, toSql } = require('../_common/utils/sql');

function embedding(methodName, modelName, column, sequelize) {
  const quotedColumn = sequelize.dialect.queryGenerator.quoteIdentifier(column);
  return sequelize.literal(`${methodName}('${modelName}', ${quotedColumn})`);
}

function distance(op, column, value, sequelize) {
  const quotedColumn = sequelize.dialect.queryGenerator.quoteIdentifier(column);
  const escapedValue = sequelize.escape(toSql(value));
  return sequelize.literal(`${quotedColumn} ${op} ${escapedValue}`);
}

function extend(sequelize) {
  // extension support related methods
  sequelize.createLanternExtension = function () {
    return sequelize.query('CREATE EXTENSION IF NOT EXISTS lantern');
  };

  sequelize.createLanternExtrasExtension = function () {
    return sequelize.query('CREATE EXTENSION IF NOT EXISTS lantern_extras');
  };

  // embedding generation methods
  sequelize.generateTextEmbedding = function (modelName, value) {
    return sequelize.query(`SELECT text_embedding('${modelName}', '${value}')`);
  };

  sequelize.generateImageEmbedding = function (modelName, value) {
    return sequelize.query(`SELECT image_embedding('${modelName}', '${value}')`);
  };

  // embedding literals
  sequelize.textEmbedding = function (column, value) {
    return embedding('text_embedding', column, value, this);
  };

  sequelize.imageEmbedding = function (column, value) {
    return embedding('image_embedding', column, value, this);
  };

  // distance search literals
  sequelize.l2Distance = function (column, value) {
    return distance('<->', column, value, this);
  };

  sequelize.cosineDistance = function (column, value) {
    return distance('<=>', column, value, this);
  };

  sequelize.hammingDistance = function (column, value) {
    return distance('<+>', column, value, this);
  };
}

module.exports = { fromSql, toSql, extend };
