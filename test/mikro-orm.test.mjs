import assert from 'node:assert';
import { describe, it, after } from 'node:test';
import { MikroORM, EntitySchema } from '@mikro-orm/postgresql';

import { extend, toSql } from 'lanterndata/mikro-orm';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import { imageUrl, newBooks, newMovies, newBooks768Dim, newBooks512Dim } from './fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(em) {
  await em.execute(`DROP TABLE IF EXISTS books;`);
  await em.execute(`DROP TABLE IF EXISTS movies;`);
}

describe('Mikro-orm', () => {
  let em; let orm;

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

    await MikroORM.createLanternExtension();
    await MikroORM.createLanternExtrasExtension();

    await dropTables(em);
  });

  it('should create a table [REAL] with index and data', async () => {
    await em.execute(`
      CREATE TABLE books (
        id SERIAL PRIMARY KEY,
        name VARCHAR NULL,
        url VARCHAR NULL,
        embedding REAL[] NULL
      );
    `);

    const books = newBooks.map(book => em.create(Book, {
      ...book,
      embedding: toSql(book.embedding),
    }));
    
    await em.persistAndFlush(books);

    await em.execute('CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)');
  });

  it('should create a table [INT] with index and data', async () => {
    await em.execute(`
      CREATE TABLE movies (
        id SERIAL PRIMARY KEY,
        name VARCHAR NULL,
        url VARCHAR NULL,
        embedding INT[] NULL
      );
    `);

    const movies = newMovies.map(movie => em.create(Movie, {
      ...movie,
      embedding: toSql(movie.embedding),
    }));
    
    await em.persistAndFlush(movies);

    await em.execute('CREATE INDEX movie_index ON movies USING hnsw(embedding dist_hamming_ops)');
  });

  it('should find using L2 distance', async () => {
    const books = await em.createQueryBuilder(Book)
      .orderBy({ [MikroORM.l2Distance('embedding', [1, 1, 1])]: 'ASC' })
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
    const books = await em.createQueryBuilder(Book)
      .orderBy({ [MikroORM.cosineDistance('embedding', [1, 1, 1])]: 'ASC' })
      .limit(5)
      .getResult();

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 2, 3, 4],
    );
  });

  it('should find using Hamming distance', async () => {
    const movies = await em.createQueryBuilder(Movie)
      .orderBy({ [MikroORM.hammingDistance('embedding', [1, 1, 1])]: 'ASC' })
      .limit(5)
      .getResult();

    assert.deepStrictEqual(
      movies.map((v) => v.id),
      [1, 3, 2, 4],
    );
  });

  it('should fail because of wrong embedding dimensions', async () => {
    const newInvalidBooks = em.create(Book, {
      embedding: toSql([ 1 ]),
    });

    await em.persistAndFlush(newInvalidBooks)
      .catch((e) => {
        assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true);
      });
  });

  it('should create simple text embedding', async () => {
    const result = await MikroORM.generateTextEmbedding(BAAI_BGE_BASE_EN, 'hello world');
    assert.equal(result[0].text_embedding.length, 768);
  });

  it('should create simple image embedding', async () => {
    const result = await MikroORM.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl);
    assert.equal(result[0].image_embedding.length, 512);
  });

  // it('select text embedding based on book names in the table', async () => {
  //   const bookTextEmbeddings = await db
  //     .select({
  //       name: Book.name,
  //       text_embedding: textEmbedding(BAAI_BGE_BASE_EN, Book.name),
  //     })
  //     .from(Book)
  //     .where(isNotNull(Book.name))
  //     .limit(5);

  //   assert.equal(bookTextEmbeddings.length, 2);

  //   bookTextEmbeddings.forEach((book) => {
  //     assert(book.name);
  //     assert(Array.isArray(book.text_embedding));
  //     assert(book.text_embedding.length > 0);
  //   });
  // });

  // it('select image embedding based on book urls in the table', async () => {
  //   const bookImageEmbeddings = await db
  //     .select({
  //       url: Book.url,
  //       image_embedding: imageEmbedding(CLIP_VIT_B_32_VISUAL, Book.url),
  //     })
  //     .from(Book)
  //     .where(isNotNull(Book.name))
  //     .limit(5);

  //   assert.equal(bookImageEmbeddings.length, 2);

  //   bookImageEmbeddings.forEach((book) => {
  //     assert(book.url);
  //     assert(Array.isArray(book.image_embedding));
  //     assert(book.image_embedding.length > 0);
  //   });
  // });

  // it('should find using Cosine distance and do text_embedding generation', async () => {
  //   await db.delete(Book);

  //   await client`DROP INDEX book_index`;

  //   await client`
  //     CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
  //     WITH (M=2, ef_construction=10, ef=4, dim=768);
  //   `;

  //   await db.insert(Book).values(newBooks768Dim);

  //   const bookEmbeddingsOrderd = await db
  //     .select()
  //     .from(Book)
  //     .orderBy(asc(cosineDistance(Book.embedding, textEmbedding(BAAI_BGE_BASE_EN, Book.name))))
  //     .limit(2);

  //   assert.equal(bookEmbeddingsOrderd.length, 2);
  // });

  // it('should find using L2 distance and do image_embedding generation', async () => {
  //   await db.delete(Book);

  //   await client`DROP INDEX book_index`;

  //   await client`
  //     CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
  //     WITH (M=2, ef_construction=10, ef=4, dim=512);
  //   `;

  //   await db.insert(Book).values(newBooks512Dim);

  //   const bookEmbeddingsOrderd = await db
  //     .select()
  //     .from(Book)
  //     .orderBy(desc(l2Distance(Book.embedding, imageEmbedding(CLIP_VIT_B_32_VISUAL, Book.url))))
  //     .limit(2);

  //   assert.equal(bookEmbeddingsOrderd.length, 2);
  //   assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
  //   assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  // });
});
