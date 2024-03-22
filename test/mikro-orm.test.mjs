import assert from 'node:assert';

import { describe, it, after } from 'node:test';
import { extend, toSql } from 'lanterndata/mikro-orm';
import { MikroORM, EntitySchema } from '@mikro-orm/postgresql';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import sqlQueries from './_common/sql.mjs';

import { imageUrl, exampleText, newBooks, newMovies, newBooks768Dim, newBooks512Dim } from './_fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(em) {
  await em.execute(sqlQueries.books.dropTable);
  await em.execute(sqlQueries.movies.dropTable);
}

describe('Mikro-orm', () => {
  let em;
  let orm;

  const Book = new EntitySchema({
    name: 'Book',
    tableName: 'books',
    properties: {
      id: { type: 'number', primary: true },
      name: { type: 'string', nullable: true },
      url: { type: 'string', nullable: true },
      embedding: { type: 'Array<number>', nullable: true },
    },
  });

  const Movie = new EntitySchema({
    name: 'Movie',
    tableName: 'movies',
    properties: {
      id: { type: 'number', primary: true },
      name: { type: 'string', nullable: true },
      url: { type: 'string', nullable: true },
      embedding: { type: 'Array<number>', nullable: true },
    },
  });

  after(async () => {
    await dropTables(em);
    await orm.close();
  });

  it('should create the lantern extension ', async () => {
    orm = await MikroORM.init({
      entities: [Book, Movie],
      clientUrl: process.env.DATABASE_URL,
      debug: process.env.TEST_DEBUG,
    });

    em = orm.em.fork();

    extend(em);

    await em.createLanternExtension();
    await em.createLanternExtrasExtension();

    await dropTables(em);
  });

  it('should create a table [REAL] with index and data', async () => {
    await em.execute(sqlQueries.books.createTable);

    const books = newBooks.map((book) =>
      em.create(Book, {
        ...book,
        embedding: toSql(book.embedding),
      }),
    );

    await em.persistAndFlush(books);

    await em.execute(sqlQueries.books.createIndexDef);
  });

  it('should create a table [INT] with index and data', async () => {
    await em.execute(sqlQueries.movies.createTable);

    const movies = newMovies.map((movie) =>
      em.create(Movie, {
        ...movie,
        embedding: toSql(movie.embedding),
      }),
    );

    await em.persistAndFlush(movies);

    await em.execute(sqlQueries.movies.createIndexDef);
  });

  it('should find using L2 distance', async () => {
    const books = await em
      .qb(Book)
      .orderBy({ [em.l2Distance('embedding', [1, 1, 1])]: 'ASC' })
      .limit(5)
      .getResult();

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 3, 2, 4],
    );

    assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
    assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
    assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  });

  it('should find using Cosine distance', async () => {
    const books = await em
      .qb(Book)
      .orderBy({ [em.cosineDistance('embedding', [1, 1, 1])]: 'ASC' })
      .limit(5)
      .getResult();

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 2, 3, 4],
    );
  });

  it('should find using Hamming distance', async () => {
    const movies = await em
      .qb(Movie)
      .orderBy({ [em.hammingDistance('embedding', [1, 1, 1])]: 'ASC' })
      .limit(5)
      .getResult();

    assert.deepStrictEqual(
      movies.map((v) => v.id),
      [1, 3, 2, 4],
    );
  });

  it('should fail because of wrong embedding dimensions', async () => {
    const newInvalidBooks = em.create(Book, {
      embedding: toSql([1]),
    });

    await em.persistAndFlush(newInvalidBooks).catch((e) => {
      assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true);
    });
  });

  it('should create simple text embedding', async () => {
    const result = await em.generateTextEmbedding(BAAI_BGE_BASE_EN, exampleText);
    assert.equal(result[0].text_embedding.length, 768);
  });

  it('should create simple image embedding', async () => {
    const result = await em.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl);
    assert.equal(result[0].image_embedding.length, 512);
  });

  it('should find using Cosine distance and do text_embedding generation', async () => {
    await em.qb(Book).delete();

    await em.execute(sqlQueries.books.dropIndex);

    await em.execute(sqlQueries.books.createIndex768);

    const books = newBooks768Dim.map((book) =>
      em.create(Book, {
        ...book,
        embedding: toSql(book.embedding),
      }),
    );

    await em.persistAndFlush(books);

    const bookEmbeddingsOrderd = await em
      .qb(Book)
      .select()
      .where({ name: { $ne: null } })
      .orderBy({ [em.cosineDistance('embedding', em.textEmbedding(BAAI_BGE_BASE_EN, exampleText))]: 'ASC' })
      .limit(2)
      .execute('all');

    assert.equal(bookEmbeddingsOrderd.length, 2);
  });

  it('should find using L2 distance and do image_embedding generation', async () => {
    await em.qb(Book).delete();

    await em.execute(sqlQueries.books.dropIndex);

    await em.execute(sqlQueries.books.createIndex512);

    const books = newBooks512Dim.map((book) =>
      em.create(Book, {
        ...book,
        embedding: toSql(book.embedding),
      }),
    );

    await em.persistAndFlush(books);

    const bookEmbeddingsOrderd = await em
      .qb(Book)
      .select('*')
      .where({ url: { $ne: null } })
      .orderBy({ [em.l2Distance('embedding', em.imageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl))]: 'DESC' })
      .limit(2)
      .execute('all');

    assert.equal(bookEmbeddingsOrderd.length, 2);
    assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
    assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  });
});
