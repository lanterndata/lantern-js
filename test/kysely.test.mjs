import pg from 'pg';
import assert from 'node:assert';

import { extend } from 'lanterndata/kysely';
import { describe, it, after } from 'node:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import sqlQueries from './_common/sql.mjs';

import { imageUrl, exampleText, newBooks, newMovies, newBooks768Dim, newBooks512Dim } from './_fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(db) {
  await db.schema.dropTable('books').ifExists().execute();
  await db.schema.dropTable('movies').ifExists().execute();
}

describe('Kysely', () => {
  let db;

  after(async () => {
    await dropTables(db);
    await db.destroy();
  });

  it('should create the lantern extension ', async () => {
    const dialect = new PostgresDialect({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    });

    const kyselyOptions = { dialect };

    if (process.env.TEST_DEBUG) {
      kyselyOptions.log = (event) => {
        if (event.level === 'query') {
          console.log(event.query.sql);
          console.log(event.query.parameters);
        }
      };
    }

    db = new Kysely(kyselyOptions);

    extend(sql);

    await sql.createLanternExtension().execute(db);
    await sql.createLanternExtrasExtension().execute(db);

    await dropTables(db);
  });

  it('should create a table [REAL] with index and data', async () => {
    await db.schema
      .createTable('books')
      .addColumn('id', 'serial', (cb) => cb.primaryKey())
      .addColumn('url', 'TEXT')
      .addColumn('name', 'TEXT')
      .addColumn('embedding', 'REAL[]')
      .execute();

    await db.insertInto('books').values(newBooks).execute();

    await sql.raw(sqlQueries.books.createIndexDef).execute(db);
  });

  it('should create a table [INT] with index and data', async () => {
    await db.schema
      .createTable('movies')
      .addColumn('id', 'serial', (cb) => cb.primaryKey())
      .addColumn('embedding', 'INT[]')
      .execute();

    await db.insertInto('movies').values(newMovies).execute();

    await db.schema
      .createIndex('movie_index')
      .on('movies')
      .using('lantern_hnsw')
      .expression(sql`embedding dist_hamming_ops`)
      .execute();
  });

  it('should find using L2 distance', async () => {
    const books = await db
      .selectFrom('books')
      .selectAll()
      .orderBy(sql.l2Distance('embedding', [1, 1, 1]))
      .limit(5)
      .execute();

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 3, 2, 4],
    );

    assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
    assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
    assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  });

  it('should find using Cosine distance', async () => {
    const books = await db
      .selectFrom('books')
      .selectAll()
      .orderBy(sql.cosineDistance('embedding', [1, 1, 1]))
      .limit(5)
      .execute();

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 2, 3, 4],
    );
  });

  it('should find using Hamming distance', async () => {
    const movies = await db
      .selectFrom('movies')
      .selectAll()
      .orderBy(sql.hammingDistance('embedding', [1, 1, 1]))
      .limit(5)
      .execute();

    assert.deepStrictEqual(
      movies.map((v) => v.id),
      [1, 3, 2, 4],
    );
  });

  it('should fail because of wrong embedding dimensions', async () => {
    await db
      .insertInto('books')
      .values([{ embedding: [1] }])
      .execute()
      .catch((e) => assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true));
  });

  it('should create simple text embedding', async () => {
    const result = await sql.generateTextEmbedding(BAAI_BGE_BASE_EN, exampleText).execute(db);
    assert.equal(result.rows[0].text_embedding.length, 768);
  });

  it('should create simple image embedding', async () => {
    const result = await sql.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl).execute(db);
    assert.equal(result.rows[0].image_embedding.length, 512);
  });

  it('should find using Cosine distance and do text_embedding generation', async () => {
    await db.deleteFrom('books').execute();

    await sql.raw(sqlQueries.books.dropIndex).execute(db);
    await sql.raw(sqlQueries.books.createIndex768).execute(db);

    await db.insertInto('books').values(newBooks768Dim).execute();

    const bookEmbeddingsOrderd = await db
      .selectFrom('books')
      .selectAll()
      .where('name', 'is not', null)
      .orderBy(sql.cosineDistance('embedding', sql.textEmbedding(BAAI_BGE_BASE_EN, exampleText)), 'asc')
      .limit(2)
      .execute();

    assert.equal(bookEmbeddingsOrderd.length, 2);
  });

  it('should find using L2 distance and do image_embedding generation', async () => {
    await db.deleteFrom('books').execute();

    await sql.raw(sqlQueries.books.dropIndex).execute(db);
    await sql.raw(sqlQueries.books.createIndex512).execute(db);

    await db.insertInto('books').values(newBooks512Dim).execute();

    const bookEmbeddingsOrderd = await db
      .selectFrom('books')
      .selectAll()
      .where('url', 'is not', null)
      .orderBy(sql.l2Distance('embedding', sql.imageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl)), 'desc')
      .limit(2)
      .execute();

    assert.equal(bookEmbeddingsOrderd.length, 2);
    assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
    assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  });
});
