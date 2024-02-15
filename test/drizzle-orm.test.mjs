import postgres from 'postgres';
import assert from 'node:assert';

import { sql } from 'drizzle-orm';
import { describe, it, after } from 'node:test';
import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, text, real, integer } from "drizzle-orm/pg-core";
import { createLanternExtension, createLanternExtrasExtension } from 'lanterndata/drizzle-orm';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import { imageUrl, newBooks, newMovies, newBooks768Dim, newBooks512Dim } from './fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(db) {
  await db.execute(sql`DROP TABLE IF EXISTS books;`);
  await db.execute(sql`DROP TABLE IF EXISTS movies;`);
}

describe('Drizzle-orm', () => {
  let db, client;
  let Book, Movies;

  after(async () => {
    await dropTables(db);
    await client.close();
  });

  it('should create the lantern extension ', async () => {
    client = await postgres(process.env.DATABASE_URL);
    db = drizzle(client, { logger: !!process.env.TEST_DEBUG });

    await db.execute(createLanternExtension());
    await db.execute(createLanternExtrasExtension());
  });

  it('should create a table [REAL] with index and data', async () => {
    await client`CREATE TABLE books (
      id SERIAL PRIMARY KEY,
      name TEXT,
      url TEXT,
      embedding REAL[]
    )`;

    Book = pgTable('books', {
      id: serial('id').primaryKey(),
      name: text('name'), 
      url: text('url'),
      embedding: real('embedding').array(),
    });

    await db.insert(Book).values(newBooks);

    await client`CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)`;
  });

  it('should create a table [INT] with index and data', async () => {
    await client`CREATE TABLE movies (
      id SERIAL PRIMARY KEY,
      name TEXT,
      url TEXT,
      embedding INT[]
    )`;

    Movies = pgTable('movies', {
      id: serial('id').primaryKey(),
      name: text('name'), 
      url: text('url'),
      embedding: integer('embedding').array(),
    });

    await db.insert(Movies).values(newMovies);

    await client`CREATE INDEX movie_index ON movies USING hnsw(embedding dist_hamming_ops)`;
  });

  // it('should find using L2 distance', async () => {
  //   const books = await Book.findAll({
  //     order: sequelize.l2Distance('embedding', [1, 1, 1]),
  //     limit: 5,
  //   });

  //   assert.deepStrictEqual(
  //     books.map((v) => v.id),
  //     [1, 3, 2, 4],
  //   );

  //   assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
  //   assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
  //   assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  // });

  // it('should find using Cosine distance', async () => {
  //   const books = await Book.findAll({
  //     order: sequelize.cosineDistance('embedding', [1, 1, 1]),
  //     limit: 5,
  //   });

  //   assert.deepStrictEqual(
  //     books.map((v) => v.id),
  //     [1, 2, 3, 4],
  //   );
  // });

  // it('should find using Hamming distance', async () => {
  //   const movies = await Movie.findAll({
  //     order: sequelize.hammingDistance('embedding', [1, 1, 1]),
  //     limit: 5,
  //   });

  //   assert.deepStrictEqual(
  //     movies.map((v) => v.id),
  //     [1, 3, 2, 4],
  //   );
  // });

  // it('should fail because of wrong embedding dimensions', async () => {
  //   await Book.create({ embedding: [1] }).catch((e) => {
  //     assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true);
  //   });
  // });

  // it('should create simple text embedding', async () => {
  //   const [result] = await sequelize.generateTextEmbedding(BAAI_BGE_BASE_EN, 'hello world');
  //   assert.equal(result[0].text_embedding.length, 768);
  // });

  // it('should create simple image embedding', async () => {
  //   const [result] = await sequelize.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl);
  //   assert.equal(result[0].image_embedding.length, 512);
  // });

  // it('select text embedding based on book names in the table', async () => {
  //   const bookTextEmbeddings = await Book.findAll({
  //     attributes: ['name', sequelize.textEmbedding(BAAI_BGE_BASE_EN, 'name')],
  //     where: { name: { [Op.not]: null } },
  //     limit: 5,
  //     raw: true,
  //   });

  //   assert.equal(bookTextEmbeddings.length, 2);

  //   bookTextEmbeddings.forEach((book) => {
  //     assert(book.name);
  //     assert(Array.isArray(book.text_embedding));
  //     assert(book.text_embedding.length > 0);
  //   });
  // });

  // it('select image embedding based on book urls in the table', async () => {
  //   const bookImageEmbeddings = await Book.findAll({
  //     attributes: ['url', sequelize.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url')],
  //     where: { url: { [Op.not]: null } },
  //     limit: 5,
  //     raw: true,
  //   });

  //   assert.equal(bookImageEmbeddings.length, 2);

  //   bookImageEmbeddings.forEach((book) => {
  //     assert(book.url);
  //     assert(Array.isArray(book.image_embedding));
  //     assert(book.image_embedding.length > 0);
  //   });
  // });

  // it('should find using Cosine distance and do text_embedding generation', async () => {
  //   await Book.destroy({ where: {} });

  //   await sequelize.query('DROP INDEX book_index');

  //   await sequelize.query(`
  //     CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
  //     WITH (M=2, ef_construction=10, ef=4, dim=768);
  //   `);

  //   await Book.bulkCreate(newBooks768Dim);

  //   const bookEmbeddingsOrderd = await Book.findAll({
  //     order: [[sequelize.cosineDistance('embedding', sequelize.textEmbedding(BAAI_BGE_BASE_EN, 'name')), 'asc']],
  //     where: { name: { [Op.not]: null } },
  //     limit: 2,
  //   });

  //   assert.equal(bookEmbeddingsOrderd.length, 2);
  // });

  // it('should find using L2 distance and do image_embedding generation', async () => {
  //   await Book.destroy({ where: {} });

  //   await sequelize.query('DROP INDEX book_index');

  //   await sequelize.query(`
  //     CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
  //     WITH (M=2, ef_construction=10, ef=4, dim=512);
  //   `);

  //   await Book.bulkCreate(newBooks512Dim);

  //   const bookEmbeddingsOrderd = await Book.findAll({
  //     order: [[sequelize.l2Distance('embedding', sequelize.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url')), 'desc']],
  //     where: { url: { [Op.not]: null } },
  //     limit: 2,
  //   });

  //   assert.equal(bookEmbeddingsOrderd.length, 2);
  //   assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
  //   assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  // });
});
