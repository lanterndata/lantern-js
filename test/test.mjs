import path from 'node:path';

import { run } from 'node:test';
import { tap } from 'node:test/reporters';

const orms = {
  knex: path.resolve('test/knex.test.mjs'),
  sequelize: path.resolve('test/sequelize.test.mjs'),
  drizzle: path.resolve('test/drizzle-orm.test.mjs'),
};

const files = orms[process.argv[2]] ? [orms[process.argv[2]]] : Object.values(orms);

run({ files })
  .on('test:fail', () => {
    process.exitCode = 1;
  })
  .compose(tap)
  .pipe(process.stdout);
