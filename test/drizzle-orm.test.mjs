import postgres from 'postgres';
import assert from 'node:assert';

import { drizzle } from 'drizzle-orm/postgres-js';
import { describe, it, after } from 'node:test';
import { sql, isNotNull, asc, desc } from 'drizzle-orm';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import { pgTable, serial, text, real, integer } from 'drizzle-orm/pg-core';
import { createLanternExtension, createLanternExtrasExtension, generateTextEmbedding, generateImageEmbedding, l2Distance, cosineDistance, hammingDistance, textEmbedding, imageEmbedding } from 'lanterndata/drizzle-orm';
import sqlQueries from './_common/sql.mjs';
import { imageUrl, newBooks, newMovies, newBooks768Dim, newBooks512Dim } from './_fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(db) {
  await db.execute(sql.raw(sqlQueries.books.dropTable));
  await db.execute(sql.raw(sqlQueries.movies.dropTable));
}

describe('Drizzle-orm', () => {
  let db;
  let client;
  let Book;
  let Movie;

  after(async () => {
    await dropTables(db);
    await client.close();
  });

  it('should create the lantern extension ', async () => {
    client = await postgres(process.env.DATABASE_URL);
    db = drizzle(client, { logger: !!process.env.TEST_DEBUG });

    await db.execute(createLanternExtension());
    await db.execute(createLanternExtrasExtension());

    await dropTables(db);
  });

  it('should create a table [REAL] with index and data', async () => {
    await db.execute(sql.raw(sqlQueries.books.createTable));

    Book = pgTable('books', {
      id: serial('id').primaryKey(),
      name: text('name'),
      url: text('url'),
      embedding: real('embedding').array(),
    });

    await db.insert(Book).values(newBooks);

    await db.execute(sql.raw(sqlQueries.books.createIndexDef));
  });

  it('should create a table [INT] with index and data', async () => {
    await db.execute(sql.raw(sqlQueries.movies.createTable));

    Movie = pgTable('movies', {
      id: serial('id').primaryKey(),
      name: text('name'),
      url: text('url'),
      embedding: integer('embedding').array(),
    });

    await db.insert(Movie).values(newMovies);

    await db.execute(sql.raw(sqlQueries.movies.createIndexDef));
  });

  it('should find using L2 distance', async () => {
    const books = await db
      .select()
      .from(Book)
      .orderBy(l2Distance(Book.embedding, [1, 1, 1]))
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
    const books = await db
      .select()
      .from(Book)
      .orderBy(cosineDistance(Book.embedding, [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 2, 3, 4],
    );
  });

  it('should find using Hamming distance', async () => {
    const movies = await db
      .select()
      .from(Movie)
      .orderBy(hammingDistance(Movie.embedding, [1, 1, 1]))
      .limit(5);

    assert.deepStrictEqual(
      movies.map((v) => v.id),
      [1, 3, 2, 4],
    );
  });

  it('should fail because of wrong embedding dimensions', async () => {
    await db
      .insert(Book)
      .values([{ embedding: [1] }])
      .catch((e) => {
        assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true);
      });
  });

  it('should create simple text embedding', async () => {
    const result = await db.execute(generateTextEmbedding(BAAI_BGE_BASE_EN, 'hello world'));
    assert.equal(result[0].text_embedding.length, 768);
  });

  it('should create simple image embedding', async () => {
    const result = await db.execute(generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl));
    assert.equal(result[0].image_embedding.length, 512);
  });

  it('select text embedding based on book names in the table', async () => {
    const bookTextEmbeddings = await db
      .select({
        name: Book.name,
        text_embedding: textEmbedding(BAAI_BGE_BASE_EN, Book.name),
      })
      .from(Book)
      .where(isNotNull(Book.name))
      .limit(5);

    assert.equal(bookTextEmbeddings.length, 2);

    bookTextEmbeddings.forEach((book) => {
      assert(book.name);
      assert(Array.isArray(book.text_embedding));
      assert(book.text_embedding.length > 0);
    });
  });

  it('select image embedding based on book urls in the table', async () => {
    const bookImageEmbeddings = await db
      .select({
        url: Book.url,
        image_embedding: imageEmbedding(CLIP_VIT_B_32_VISUAL, Book.url),
      })
      .from(Book)
      .where(isNotNull(Book.url))
      .limit(5);

    assert.equal(bookImageEmbeddings.length, 2);

    bookImageEmbeddings.forEach((book) => {
      assert(book.url);
      assert(Array.isArray(book.image_embedding));
      assert(book.image_embedding.length > 0);
    });
  });

  it('should find using Cosine distance and do text_embedding generation', async () => {
    await db.delete(Book);

    await db.execute(sql.raw(sqlQueries.books.dropIndex));
    await db.execute(sql.raw(sqlQueries.books.createIndex768));

    await db.insert(Book).values(newBooks768Dim);

    const bookEmbeddingsOrderd = await db
      .select()
      .from(Book)
      .where(isNotNull(Book.name))
      .orderBy(asc(cosineDistance(Book.embedding, textEmbedding(BAAI_BGE_BASE_EN, Book.name))))
      .limit(2);

    assert.equal(bookEmbeddingsOrderd.length, 2);
  });

  it('should find using L2 distance and do image_embedding generation', async () => {
    await db.delete(Book);

    await db.execute(sql.raw(sqlQueries.books.dropIndex));
    await db.execute(sql.raw(sqlQueries.books.createIndex512));

    await db.insert(Book).values(newBooks512Dim);

    const bookEmbeddingsOrderd = await db
      .select()
      .from(Book)
      .where(isNotNull(Book.url))
      .orderBy(desc(l2Distance(Book.embedding, imageEmbedding(CLIP_VIT_B_32_VISUAL, Book.url))))
      .limit(2);

    assert.equal(bookEmbeddingsOrderd.length, 2);
    assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
    assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  });
});
