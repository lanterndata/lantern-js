import path from 'node:path';

import { tap } from 'node:test/reporters';
import { run } from 'node:test';

run({
  files: [path.resolve('src/knex/knex.test.mjs'), path.resolve('src/sequelize/sequelize.test.mjs')],
})
  .on('test:fail', () => {
    process.exitCode = 1;
  })
  .compose(tap)
  .pipe(process.stdout);
