import assert from 'node:assert';

import { describe, it, after, before } from 'node:test';
import { DataSource, EntitySchema } from 'typeorm';
import { createLanternExtension, createLanternExtrasExtension, l2Distance, hammingDistance, cosineDistance, textEmbedding, imageEmbedding, generateTextEmbedding, generateImageEmbedding } from 'lanterndata/typeorm';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import sqlQueries from './_common/sql.mjs';

import { imageUrl, newBooks, newMovies, newBooks768Dim, newBooks512Dim } from './_fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(AppDataSource) {
  await AppDataSource.query(sqlQueries.books.dropTable);
  await AppDataSource.query(sqlQueries.movies.dropTable);
}

describe('Typeorm', () => {
  let AppDataSource;
  let Book;
  let Movie;
  let bookRepository;
  let movieRepository;

  before(() => {
    Book = new EntitySchema({
      name: 'Book',
      tableName: 'books',
      columns: {
        id: {
          type: 'int',
          primary: true,
          generated: true,
        },
        name: { type: 'text' },
        url: { type: 'text' },
        embedding: {
          type: 'real',
          array: true,
        },
      },
    });

    Movie = new EntitySchema({
      name: 'Movie',
      tableName: 'movies',
      columns: {
        id: {
          type: 'int',
          primary: true,
          generated: true,
        },
        embedding: {
          type: 'int',
          array: true,
        },
      },
    });
  });

  after(async () => {
    await dropTables(AppDataSource);
    await AppDataSource.destroy();
  });

  it('should create the lantern extension ', async () => {
    AppDataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      logging: !!process.env.TEST_DEBUG,
      entities: [Book, Movie],
    });

    await AppDataSource.initialize();

    await AppDataSource.query(createLanternExtension());
    await AppDataSource.query(createLanternExtrasExtension());

    dropTables(AppDataSource);
  });

  it('should create a table [REAL] with index and data', async () => {
    await AppDataSource.query(sqlQueries.books.createTable);

    bookRepository = AppDataSource.getRepository(Book);

    for (const bookItem of newBooks) {
      await bookRepository.save(bookItem);
    }

    await AppDataSource.query(sqlQueries.books.createIndexDef);
  });

  it('should create a table [INT] with index and data', async () => {
    await AppDataSource.query(sqlQueries.movies.createTable);

    movieRepository = AppDataSource.getRepository(Movie);

    for (const movieItem of newMovies) {
      await movieRepository.save(movieItem);
    }

    await AppDataSource.query(sqlQueries.movies.createIndexDef);
  });

  it('should find using L2 distance', async () => {
    const books = await bookRepository
      .createQueryBuilder('books')
      .orderBy(l2Distance('embedding', ':myEmbedding'))
      .setParameters({ myEmbedding: [1, 1, 1] })
      .limit(5)
      .getMany();

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 3, 2, 4],
    );

    assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
    assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
    assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  });

  it('should find using Cosine distance', async () => {
    const books = await bookRepository
      .createQueryBuilder('books')
      .orderBy(cosineDistance('embedding', ':myEmbedding'))
      .setParameters({ myEmbedding: [1, 1, 1] })
      .limit(5)
      .getMany();

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 2, 3, 4],
    );
  });

  it('should find using Hamming distance', async () => {
    const movies = await movieRepository
      .createQueryBuilder('movies')
      .orderBy(hammingDistance('embedding', ':myEmbedding'))
      .setParameters({ myEmbedding: [1, 1, 1] })
      .limit(5)
      .getMany();

    assert.deepStrictEqual(
      movies.map((v) => v.id),
      [1, 3, 2, 4],
    );
  });

  it('should fail because of wrong embedding dimensions', async () => {
    await bookRepository.save({ embedding: [1] }).catch((e) => assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true));
  });

  it('should create simple text embedding', async () => {
    const result = await AppDataSource.query(generateTextEmbedding(BAAI_BGE_BASE_EN), ['hello world']);
    assert.equal(result[0].text_embedding.length, 768);
  });

  it('should create simple image embedding', async () => {
    const result = await AppDataSource.query(generateImageEmbedding(CLIP_VIT_B_32_VISUAL), [imageUrl]);
    assert.equal(result[0].image_embedding.length, 512);
  });

  it('select text embedding based on book names in the table', async () => {
    const bookEmbeddings = await bookRepository.createQueryBuilder('books').select('name').addSelect(textEmbedding(BAAI_BGE_BASE_EN, 'name')).where('name IS NOT NULL').getRawMany();

    assert.equal(bookEmbeddings.length, 2);

    bookEmbeddings.forEach((book) => {
      assert(book.name);
      assert(Array.isArray(book.text_embedding));
      assert(book.text_embedding.length > 0);
    });
  });

  it('select image embedding based on book urls in the table', async () => {
    const bookEmbeddings = await bookRepository.createQueryBuilder('books').select('url').addSelect(imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url')).where('url IS NOT NULL').getRawMany();

    assert.equal(bookEmbeddings.length, 2);

    bookEmbeddings.forEach((book) => {
      assert(book.url);
      assert(Array.isArray(book.image_embedding));
      assert(book.image_embedding.length > 0);
    });
  });

  it('should find using Cosine distance and do text_embedding generation', async () => {
    await bookRepository.delete({});

    await AppDataSource.query(sqlQueries.books.dropIndex);
    await AppDataSource.query(sqlQueries.books.createIndex768);

    bookRepository = AppDataSource.getRepository(Book);

    for (const bookItem of newBooks768Dim) {
      await bookRepository.save(bookItem);
    }

    const bookEmbeddingsOrderd = await bookRepository
      .createQueryBuilder('books')
      .orderBy(cosineDistance('embedding', textEmbedding(BAAI_BGE_BASE_EN, 'name')))
      .where('name IS NOT NULL')
      .limit(2)
      .getMany();

    assert.equal(bookEmbeddingsOrderd.length, 2);
  });

  it('should find using L2 distance and do image_embedding generation', async () => {
    await bookRepository.delete({});

    await AppDataSource.query(sqlQueries.books.dropIndex);
    await AppDataSource.query(sqlQueries.books.createIndex512);

    bookRepository = AppDataSource.getRepository(Book);

    for (const bookItem of newBooks512Dim) {
      await bookRepository.save(bookItem);
    }

    const bookEmbeddingsOrderd = await bookRepository
      .createQueryBuilder('books')
      .orderBy(cosineDistance('embedding', imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url')), 'DESC')
      .where('url IS NOT NULL')
      .limit(2)
      .getMany();

    assert.equal(bookEmbeddingsOrderd.length, 2);
    assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
    assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  });
});
