import 'lanterndata/knex';
import Knex from 'knex';
import assert from 'node:assert';

import { describe, it, after } from 'node:test';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import sqlQueries from './_common/sql.mjs';

import { imageUrl, exampleText, newBooks, newMovies, newBooks768Dim, newBooks512Dim } from './_fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(knex) {
  await knex.schema.dropTableIfExists('books');
  await knex.schema.dropTableIfExists('movies');
}

describe('Knex', () => {
  let knex;

  after(async () => {
    await dropTables(knex);
    await knex.destroy();
  });

  it('should create the lantern extension ', async () => {
    knex = Knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
    });

    if (process.env.TEST_DEBUG) {
      knex.on('query', (queryData) => {
        console.log(queryData);
      });
    }

    await knex.schema.createLanternExtension();
    await knex.schema.createLanternExtrasExtension();

    await dropTables(knex);
  });

  it('should create a table [REAL] with index and data', async () => {
    await knex.schema.createTable('books', (table) => {
      table.increments('id');
      table.specificType('url', 'TEXT');
      table.specificType('name', 'TEXT');
      table.specificType('embedding', 'REAL[]');
    });

    await knex('books').insert(newBooks);

    await knex.raw(sqlQueries.books.createIndexDef);
  });

  it('should create a table [INT] with index and data', async () => {
    await knex.schema.createTable('movies', (table) => {
      table.increments('id');
      table.specificType('embedding', 'INT[]');
    });

    await knex('movies').insert(newMovies);

    knex.schema.table('movies', (table) => {
      table.index(knex.raw('embedding dist_hamming_ops'), 'idx_embedding', 'lantern_hnsw');
    });
  });

  it('should find using L2 distance', async () => {
    const books = await knex('books')
      .orderBy(knex.l2Distance('embedding', [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 3, 2, 4],
    );

    assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
    assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
    assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  });

  it('should find using Cosine distance', async () => {
    const books = await knex('books')
      .orderBy(knex.cosineDistance('embedding', [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 2, 3, 4],
    );
  });

  it('should find using Hamming distance', async () => {
    const movies = await knex('movies')
      .orderBy(knex.hammingDistance('embedding', [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(
      movies.map((v) => v.id),
      [1, 3, 2, 4],
    );
  });

  it('should fail because of wrong embedding dimensions', async () => {
    await knex('books')
      .insert({ embedding: [1] })
      .catch((e) => assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true));
  });

  it('should create simple text embedding', async () => {
    const result = await knex.generateTextEmbedding(BAAI_BGE_BASE_EN, exampleText);
    assert.equal(result.rows[0].text_embedding.length, 768);
  });

  it('should create simple image embedding', async () => {
    const result = await knex.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl);
    assert.equal(result.rows[0].image_embedding.length, 512);
  });

  it('should find using Cosine distance and do text_embedding generation', async () => {
    await knex('books').delete();

    await knex.raw(sqlQueries.books.dropIndex);
    await knex.raw(sqlQueries.books.createIndex768);

    await knex('books').insert(newBooks768Dim);

    const bookEmbeddingsOrderd = await knex('books')
      .whereNotNull('name')
      .orderBy(knex.cosineDistance('embedding', knex.textEmbedding(BAAI_BGE_BASE_EN, exampleText)), 'asc')
      .limit(2);

    assert.equal(bookEmbeddingsOrderd.length, 2);
  });

  it('should find using L2 distance and do image_embedding generation', async () => {
    await knex('books').delete();

    await knex.raw(sqlQueries.books.dropIndex);
    await knex.raw(sqlQueries.books.createIndex512);

    await knex('books').insert(newBooks512Dim);

    const bookEmbeddingsOrderd = await knex('books')
      .whereNotNull('url')
      .orderBy(knex.l2Distance('embedding', knex.imageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl)), 'desc')
      .limit(2);

    assert.equal(bookEmbeddingsOrderd.length, 2);
    assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
    assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  });
});
