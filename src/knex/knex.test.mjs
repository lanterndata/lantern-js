import Knex from 'knex';
import assert from 'node:assert';
import lantern from 'lantern/knex';

import { describe, it, after } from 'node:test';

describe('Knex', () => {
  let knex;

  after(async () => {
    await knex.schema.dropTableIfExists('books');
    await knex.schema.dropTableIfExists('movies');
    
    await knex.destroy();
  })

  it('should create the lantern extension ', async () => {
    knex = Knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
    });
  
    await knex.schema.addExtension('lantern');
  })

  it('should create a table [REAL] with index and data', async () => {

    await knex.schema.createTable('books', (table) => {
      table.increments('id');
      table.specificType('embedding', 'REAL[]');

      knex.raw(`
        CREATE INDEX book_index ON books USING hnsw(book_embedding dist_l2sq_ops)
        WITH (M=2, ef_construction=10, ef=4, dims=3);
      `);
    });

    const newBooks = [
      {embedding: lantern.toSql([1, 1, 1])},
      {embedding: lantern.toSql([2, 2, 2])},
      {embedding: lantern.toSql([1, 1, 2])},
      {embedding: null}
    ];

    await knex('books').insert(newBooks);
  });

  it('should create a table [INT] with index and data', async () => {

    await knex.schema.createTable('movies', (table) => {
      table.increments('id');
      table.specificType('embedding', 'INT[]');
    });

    const newMovies = [
      {embedding: lantern.toSql([1, 1, 1])},
      {embedding: lantern.toSql([2, 2, 2])},
      {embedding: lantern.toSql([1, 1, 2])},
      {embedding: null}
    ];

    await knex('movies').insert(newMovies);

    knex.schema.table('movies', (table) => {
      table.index(knex.raw('embedding dist_hamming_ops'), 'idx_embedding', 'hnsw');
    })  
  });

  it('should find using L2 distance', async () => {
    const books = await knex('books')
      .orderBy(knex.l2('embedding', [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(books.map(v => v.id), [1, 3, 2, 4]);
    assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
    assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
    assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  });

  it('should find using Cosine distance', async () => {
    const books = await knex('books')
      .orderBy(knex.cosine('embedding', [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(books.map(v => v.id), [1, 2, 3, 4]);
  });

  it('should find using Hamming distance', async () => {
    const movies = await knex('movies')
      .orderBy(knex.hamming('embedding', [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(movies.map(v => v.id), [1, 3, 2, 4]);
  });

  it('should fail because of wrong embedding dimensions', async () => {
    await knex('books').insert({ embedding: [1] })
      .catch(e => assert.equal(e.message, 'Wrong number of dimensions: 1 instead of 3 expected'));
  });
});
