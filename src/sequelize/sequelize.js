const utils = require('../_common/utils');

function distance(op, column, value, sequelize) {
  const quotedColumn = sequelize.dialect.queryGenerator.quoteIdentifier(column);
  const escapedValue = sequelize.escape(utils.toSql(value));
  return sequelize.literal(`${quotedColumn} ${op} ${escapedValue}`);
}


function l2(column, value, sequelize) {
  return distance('<->', column, value, sequelize);
}

function cosine(column, value, sequelize) {
  return distance('<=>', column, value, sequelize);
}

function hamming(column, value, sequelize) {
  return distance('<+>', column, value, sequelize);
}

module.exports = { l2, cosine, hamming };
