import Knex from 'knex';
import assert from 'node:assert';
import lantern from 'lantern/knex';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lantern/embeddings';

import { describe, it, after } from 'node:test';

const imageUrl = process.env.TEST_IMAGE_EMBEDDING_EXAMPLE_URL;

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

    knex.on('query', (queryData) => {
      if (process.env.TEST_DEBUG) {
        console.log(queryData);
      }
    });

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

    const newBooks = [
      {
        embedding: lantern.toSql([1, 1, 1]),
        name: 'Harry Potter',
        url: imageUrl,
      },
      {
        embedding: lantern.toSql([2, 2, 2]),
        name: 'Greek Myths',
        url: imageUrl,
      },
      {
        embedding: lantern.toSql([1, 1, 2]),
      },
      { embedding: null },
    ];

    await knex('books').insert(newBooks);

    await knex.raw(`
      CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
    `);
  });

  it('should create a table [INT] with index and data', async () => {
    await knex.schema.createTable('movies', (table) => {
      table.increments('id');
      table.specificType('embedding', 'INT[]');
    });

    const newMovies = [
      {
        embedding: lantern.toSql([1, 1, 1]),
      },
      {
        embedding: lantern.toSql([2, 2, 2]),
      },
      {
        embedding: lantern.toSql([1, 1, 2]),
      },
      { embedding: null },
    ];

    await knex('movies').insert(newMovies);

    knex.schema.table('movies', (table) => {
      table.index(knex.raw('embedding dist_hamming_ops'), 'idx_embedding', 'hnsw');
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
    const result = await knex.generateTextEmbedding(BAAI_BGE_BASE_EN, 'hello world');
    assert.equal(result.rows[0].text_embedding.length, 768);
  });

  it('should create simple image embedding', async () => {
    const result = await knex.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl);

    assert.equal(result.rows[0].image_embedding.length, 512);
  });

  it('select text embedding based on book names in the table', async () => {
    const selectLiteral = knex.textEmbedding(BAAI_BGE_BASE_EN, 'name');
    const bookEmbeddings = await knex('books').select('name').select(selectLiteral).whereNotNull('name');

    assert.equal(bookEmbeddings.length, 2);

    bookEmbeddings.forEach((book) => {
      assert(book.name);
      assert(Array.isArray(book.text_embedding));
      assert(book.text_embedding.length > 0);
    });
  });

  it('select image embedding based on book urls in the table', async () => {
    const selectLiteral = knex.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url');
    const bookEmbeddings = await knex('books').select('url').select(selectLiteral).whereNotNull('url');

    assert.equal(bookEmbeddings.length, 2);

    bookEmbeddings.forEach((book) => {
      assert(book.url);
      assert(Array.isArray(book.image_embedding));
      assert(book.image_embedding.length > 0);
    });
  });

  it('should find using Cosine distance and do text_embedding generation', async () => {
    await knex('books').delete();

    await knex.raw('DROP INDEX book_index');

    const array768dim = new Array(768).fill(1);
    const newBooks = [
      { embedding: lantern.toSql(array768dim), name: 'Harry Potter', url: imageUrl },
      { embedding: lantern.toSql(array768dim), name: 'Greek Myths', url: imageUrl },
    ];

    await knex('books').insert(newBooks);

    await knex.raw(`
      CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
      WITH (M=2, ef_construction=10, ef=4, dim=768);
    `);

    const bookEmbeddingsOrderd = await knex('books')
      .whereNotNull('name')
      .orderBy(knex.l2Distance('embedding', knex.textEmbedding(BAAI_BGE_BASE_EN, 'name')), 'asc')
      .limit(2);

    assert.equal(bookEmbeddingsOrderd.length, 2);
  });

  it('should find using L2 distance and do image_embedding generation', async () => {
    await knex('books').delete();

    await knex.raw('DROP INDEX book_index');

    await knex.raw(`
      CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
      WITH (M=2, ef_construction=10, ef=4, dim=512);
    `);

    const array512dim = new Array(512).fill(1);
    const newBooks = [
      { embedding: lantern.toSql(array512dim), name: 'Harry Potter', url: imageUrl },
      { embedding: lantern.toSql(array512dim), name: 'Greek Myths', url: imageUrl },
    ];

    await knex('books').insert(newBooks);

    const bookEmbeddingsOrderd = await knex('books')
      .whereNotNull('url')
      .orderBy(knex.l2Distance('embedding', knex.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url')), 'desc')
      .limit(2);

    assert.equal(bookEmbeddingsOrderd.length, 2);
    assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
    assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  });
});
