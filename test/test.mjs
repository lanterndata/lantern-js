import path from 'node:path';

import { run } from 'node:test';
import { tap } from 'node:test/reporters';

const orms = {
  knex: path.resolve('test/knex.test.mjs'),
  kysely: path.resolve('test/kysely.test.mjs'),
  mikro: path.resolve('test/mikro-orm.test.mjs'),
  typeorm: path.resolve('test/typeorm.test.mjs'),
  sequelize: path.resolve('test/sequelize.test.mjs'),
  drizzle: path.resolve('test/drizzle-orm.test.mjs'),
  objection: path.resolve('test/objection.test.mjs'),
};

const files = orms[process.argv[2]] ? [orms[process.argv[2]]] : Object.values(orms);

run({ files })
  .on('test:fail', () => {
    process.exitCode = 1;
  })
  .compose(tap)
  .pipe(process.stdout);
