# lantern/knex
---

## Setting up LanternDB Extension

Everything begins by creating the LanternDB extension in the PostgreSQL database.

```js
import Knex from 'knex';
import lantern from 'lantern/knex';

const knex = Knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

await knex.schema.addExtension('lantern');
```

## Create the Table and add an Index

```js
await knex.schema.createTable('books', (table) => {
  table.increments('id');
  table.specificType('embedding', 'REAL[]');

  knex.raw(`
    CREATE INDEX book_index ON books USING hnsw(book_embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dims=3);
  `);
});
```

## Vector Searches

Now we can performe vectore search using those distance algorithms.

```js
await knex('books')
  .orderBy(knex.l2('embedding', [1, 1, 1]))
  .limit(5);

await knex('books')
  .orderBy(knex.cosine('embedding', [1, 1, 1]))
  .limit(5);

await knex('books')
  .orderBy(knex.cosine('embedding', [1, 1, 1]))
  .limit(5);
```