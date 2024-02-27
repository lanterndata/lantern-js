import Knex from 'knex';
import assert from 'assert';

import 'lanterndata/knex';

import { Model } from 'objection';
import { describe, it, after } from 'node:test';
import { l2Distance } from 'lanterndata/objection';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import sqlQueries from './_common/sql.mjs';

import { imageUrl, newBooks, newMovies, newBooks768Dim, newBooks512Dim } from './_fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

// Define Book model class
class Book extends Model {
  static get tableName() {
    return 'books';
  }
}

// Define Movie model class
class Movie extends Model {
  static get tableName() {
    return 'movies';
  }
}

async function dropTables(knex) {
  await knex.schema.dropTableIfExists('books');
  await knex.schema.dropTableIfExists('movies');
}

describe('Objection.js', () => {
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
    
    // Bind Objection.js to the knex instance
    Model.knex(knex);

    await knex.schema.createLanternExtension();
    await knex.schema.createLanternExtrasExtension();

    await dropTables(knex);
  });

  it('should create a table [REAL] with index and data', async () => {
    await knex.schema.createTable('books', (table) => {
      table.increments('id');
      table.text('url');
      table.text('name');
      table.specificType('embedding', 'REAL[]');
    });

    await Book.query().insert(newBooks);

    await knex.raw(sqlQueries.books.createIndexDef);
  });

  it('should create a table [INT] with index and data', async () => {
    await knex.schema.createTable('movies', (table) => {
      table.increments('id');
      table.specificType('embedding', 'INT[]');
    });

    await Movie.query().insert(newMovies);

    await knex.schema.table('movies', (table) => {
      table.index(knex.raw('embedding dist_hamming_ops'), 'idx_embedding', 'hnsw');
    });
  });

  it('should find using L2 distance', async () => {
    const books = await Book.query()
      .orderBy(l2Distance('embedding', [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 3, 2, 4],
    );

    assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
    assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
    assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  });

  // it('should find using Cosine distance', async () => {
  //   const books = await Book.query()
  //     .orderBy(knex.cosineDistance('embedding', [1, 1, 1]))
  //     .limit(5);

  //   assert.deepStrictEqual(
  //     books.map((v) => v.id),
  //     [1, 2, 3, 4],
  //   );
  // });

  // it('should find using Hamming distance', async () => {
  //   const movies = await Movie.query()
  //     .orderBy(knex.hammingDistance('embedding', [1, 1, 1]))
  //     .limit(5);

  //   assert.deepStrictEqual(
  //     movies.map((v) => v.id),
  //     [1, 3, 2, 4],
  //   );
  // });

  // it('should fail because of wrong embedding dimensions', async () => {
  //   await Book.query()
  //     .insert({ embedding: [1] })
  //     .catch((e) => assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true));
  // });

  // it('should create simple text embedding', async () => {
  //   const result = await knex.generateTextEmbedding(BAAI_BGE_BASE_EN, 'hello world');
  //   assert.equal(result.rows[0].text_embedding.length, 768);
  // });

  // it('should create simple image embedding', async () => {
  //   const result = await knex.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl);

  //   assert.equal(result.rows[0].image_embedding.length, 512);
  // });

  // it('select text embedding based on book names in the table', async () => {
  //   const selectLiteral = knex.textEmbedding(BAAI_BGE_BASE_EN, 'name');
  //   const bookEmbeddings = await Book.query()
  //     .select('name')
  //     .select(selectLiteral)
  //     .whereNotNull('name');

  //   assert.equal(bookEmbeddings.length, 2);

  //   bookEmbeddings.forEach((book) => {
  //     assert(book.name);
  //     assert(Array.isArray(book.text_embedding));
  //     assert(book.text_embedding.length > 0);
  //   });
  // });

  // it('select image embedding based on book urls in the table', async () => {
  //   const selectLiteral = knex.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url');
  //   const bookEmbeddings = await Book.query()
  //     .select('url')
  //     .select(selectLiteral)
  //     .whereNotNull('url');

  //   assert.equal(bookEmbeddings.length, 2);

  //   bookEmbeddings.forEach((book) => {
  //     assert(book.url);
  //     assert(Array.isArray(book.image_embedding));
  //     assert(book.image_embedding.length > 0);
  //   });
  // });

  // it('should find using Cosine distance and do text_embedding generation', async () => {
  //   await Book.query().delete();

  //   await knex.raw(sqlQueries.books.dropIndex);
  //   await knex.raw(sqlQueries.books.createIndex768);

  //   await Book.query().insert(newBooks768Dim);

  //   const bookEmbeddingsOrdered = await Book.query()
  //     .whereNotNull('name')
  //     .orderBy(knex.cosineDistance('embedding', knex.textEmbedding(BAAI_BGE_BASE_EN, 'name')), 'asc')
  //     .limit(2);

  //   assert.equal(bookEmbeddingsOrdered.length, 2);
  // });

  // it('should find using L2 distance and do image_embedding generation', async () => {
  //   await Book.query().delete();

  //   await knex.raw(sqlQueries.books.dropIndex);
  //   await knex.raw(sqlQueries.books.createIndex512);

  //   await Book.query().insert(newBooks512Dim);

  //   const bookEmbeddingsOrdered = await Book.query()
  //     .whereNotNull('url')
  //     .orderBy(knex.l2Distance('embedding', knex.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url')), 'desc')
  //     .limit(2);

  //   assert.equal(bookEmbeddingsOrdered.length, 2);
  //   assert.equal(bookEmbeddingsOrdered[0].name, 'Harry Potter');
  //   assert.equal(bookEmbeddingsOrdered[1].name, 'Greek Myths');
  // });
});
