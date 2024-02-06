const utils = require('../_common/utils');

const sequelizeQueryGenerators = new WeakMap();

function getLanternSequelizeAddIndexQuery(sequelize) {
  const { addIndexQuery } = sequelizeQueryGenerators.get(sequelize);

  function lanternSequelizeAddIndexQuery(...args) {

    let query = addIndexQuery.apply(sequelize.dialect.queryGenerator, args);

    const [, attributes] = args;

    if (attributes.with) {
      const { M, ef, dim, ef_construction } = attributes.with;
      let params = [];

      if (M !== undefined) {
        params.push(`M=${M}`);
      }

      if (ef !== undefined) {
        params.push(`ef=${ef}`)
      }

      if (dim !== undefined) {
        params.push(`dim=${dim}`)
      }

      if (ef_construction !== undefined) {
        params.push(`ef_construction=${ef_construction}`)
      }

      query += ` WITH (${params.join(', ')})`;
    }

    return query;
  }

  return lanternSequelizeAddIndexQuery;
}

function supportIndexes(sequelize) {
  const { addIndexQuery } = sequelize.dialect.queryGenerator;
  sequelizeQueryGenerators.set(sequelize, { addIndexQuery });
  sequelize.dialect.queryGenerator.addIndexQuery = getLanternSequelizeAddIndexQuery(sequelize);
}

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

module.exports = { supportIndexes, l2, cosine, hamming };
