const { fromSql, toSql } = require('../_common/utils/sql');
const { getTextEmbeddingModelName, getImageEmbeddingModelName } = require('../_embeddings/models');

function distance(op, column, value, sequelize) {
  const quotedColumn = sequelize.dialect.queryGenerator.quoteIdentifier(column);
  const escapedValue = sequelize.escape(toSql(value));
  return sequelize.literal(`${quotedColumn} ${op} ${escapedValue}`);
}

const configurationParameters = ['cohere_token', 'openai_token', 'openai_deployment_url', 'openai_azure_api_token', 'openai_azure_entra_token'];

function extend(sequelize) {
  // cohere and openai configuration methods
  sequelize.configureLantern = function (options, username) {
    const validConfigOptions = configurationParameters.filter((paramName) => options[paramName]);

    const promises = [];

    for (const optionFieldKey of validConfigOptions) {
      const value = options[optionFieldKey];
      const query = username ? `SET lantern_extras.${optionFieldKey}='${value}';` : `ALTER ROLE ${username} SET lantern_extras.${optionFieldKey}='${value}';`;

      promises.push(sequelize.query(query));
    }

    return promises;
  };

  // extension support related methods
  sequelize.createLanternExtension = function () {
    return sequelize.query('CREATE EXTENSION IF NOT EXISTS lantern');
  };

  sequelize.createLanternExtrasExtension = function () {
    return sequelize.query('CREATE EXTENSION IF NOT EXISTS lantern_extras');
  };

  // embedding generation methods
  sequelize.generateTextEmbedding = function (modelKey, value) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return sequelize.query(`SELECT text_embedding('${modelName}', :value)`, {
      replacements: {
        value,
      },
    });
  };

  sequelize.generateImageEmbedding = function (modelKey, value) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return sequelize.query(`SELECT image_embedding('${modelName}', :value)`, {
      replacements: {
        value,
      },
    });
  };

  // embedding literals
  sequelize.textEmbedding = function (modelKey, paramName) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return sequelize.literal(`text_embedding('${modelName}', :${paramName})`);
  };

  sequelize.imageEmbedding = function (modelKey, paramName) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return sequelize.literal(`image_embedding('${modelName}', :${paramName})`);
  };

  sequelize.openaiEmbedding = function (modelKey, paramName, dimensionParamName) {
    const modelName = getImageEmbeddingModelName(modelKey);
    return sequelize.literal(dimensionParamName ? `openai_embedding('${modelName}', :${paramName}, :${dimensionParamName})` : `openai_embedding('${modelName}', :${paramName})`);
  };

  sequelize.cohereEmbedding = function (modelKey, paramName) {
    const modelName = getTextEmbeddingModelName(modelKey);
    return sequelize.literal(`cohere_embedding('${modelName}', :${paramName})`);
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
