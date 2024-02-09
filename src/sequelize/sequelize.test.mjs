import assert from 'node:assert';
import lantern from 'lantern/sequelize';

import { describe, it, after } from 'node:test';
import { Sequelize, DataTypes, Op } from 'sequelize';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lantern/embeddings';

const imageUrl = process.env.TEST_IMAGE_EMBEDDING_EXAMPLE_URL;

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(sequelize) {
  await sequelize.query('DROP TABLE IF EXISTS books;');
  await sequelize.query('DROP TABLE IF EXISTS movies;');
}

describe('Sequelize', () => {
  let sequelize;
  let Book;
  let Movie;

  const logging = process.env.TEST_DEBUG ? console.log : null;

  after(async () => {
    await dropTables(sequelize);
    await sequelize.close();
  });

  it('should create the lantern extension ', async () => {
    sequelize = new Sequelize(process.env.DATABASE_URL, { logging });

    await dropTables(sequelize);

    lantern.extend(sequelize);

    await sequelize.createLanternExtension();
    await sequelize.createLanternExtrasExtension();

    sequelize.close();
  });

  it('should create a table [REAL] with index and data', async () => {
    // reconnect after the lantern extension has been created
    sequelize = new Sequelize(process.env.DATABASE_URL, { logging });

    lantern.extend(sequelize);

    Book = sequelize.define(
      'Book',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        embedding: { type: DataTypes.ARRAY(DataTypes.REAL) },
        name: { type: DataTypes.TEXT },
        url: { type: DataTypes.TEXT },
      },
      {
        modelName: 'Book',
        tableName: 'books',
      },
    );

    await Book.sync({ force: true });

    const newBooks = [
      {
        embedding: [1, 1, 1],
        name: 'Harry Potter',
        url: imageUrl,
      },
      {
        embedding: [2, 2, 2],
        name: 'Greek Myths',
        url: imageUrl,
      },
      {
        embedding: [1, 1, 2],
      },
      { embedding: null },
    ];

    await Book.bulkCreate(newBooks);

    await sequelize.query(`
      CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
    `);
  });

  it('should create a table [INT] with index and data', async () => {
    Movie = sequelize.define(
      'Movie',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        embedding: { type: DataTypes.ARRAY(DataTypes.INTEGER) },
      },
      {
        modelName: 'Movie',
        tableName: 'movies',
      },
    );

    await Movie.sync({ force: true });

    const newMovies = [
      {
        embedding: [1, 1, 1],
      },
      {
        embedding: [2, 2, 2],
      },
      {
        embedding: [1, 1, 2],
      },
      { embedding: null },
    ];

    await Movie.bulkCreate(newMovies);

    await sequelize.query(`
      CREATE INDEX movie_index ON movies USING hnsw(embedding dist_hamming_ops)
    `);
  });

  it('should find using L2 distance', async () => {
    const books = await Book.findAll({
      order: sequelize.l2Distance('embedding', [1, 1, 1]),
      limit: 5,
    });

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 3, 2, 4],
    );

    assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
    assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
    assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  });

  it('should find using Cosine distance', async () => {
    const books = await Book.findAll({
      order: sequelize.cosineDistance('embedding', [1, 1, 1]),
      limit: 5,
    });

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 2, 3, 4],
    );
  });

  it('should find using Hamming distance', async () => {
    const movies = await Movie.findAll({
      order: sequelize.hammingDistance('embedding', [1, 1, 1]),
      limit: 5,
    });

    assert.deepStrictEqual(
      movies.map((v) => v.id),
      [1, 3, 2, 4],
    );
  });

  it('should fail because of wrong embedding dimensions', async () => {
    await Book.create({ embedding: [1] }).catch((e) => {
      assert.equal(e.message.includes('Wrong number of dimensions: 1 instead of 3 expected'), true);
    });
  });

  it('should create simple text embedding', async () => {
    const [result] = await sequelize.generateTextEmbedding(BAAI_BGE_BASE_EN, 'hello world');
    assert.equal(result[0].text_embedding.length, 768);
  });

  it('should create simple image embedding', async () => {
    const [result] = await sequelize.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl);
    assert.equal(result[0].image_embedding.length, 512);
  });

  it('select text embedding based on book names in the table', async () => {
    const bookEmbeddings = await Book.findAll({
      attributes: ['name', sequelize.textEmbedding(BAAI_BGE_BASE_EN, 'name')],
      where: { name: { [Op.not]: null } },
      limit: 5,
      raw: true,
    });

    assert.equal(bookEmbeddings.length, 2);

    bookEmbeddings.forEach((book) => {
      assert(book.name);
      assert(Array.isArray(book.text_embedding));
      assert(book.text_embedding.length > 0);
    });
  });

  // it('select text embedding based on book urls in the table', async () => {
  //   const bookEmbeddings = await knex('books').select('url').select(knex.imageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, 'url')).whereNotNull('url');

  //   assert.equal(bookEmbeddings.length, 2);

  //   bookEmbeddings.forEach((book) => {
  //     assert(book.url);
  //     assert(Array.isArray(book.image_embedding));
  //     assert(book.image_embedding.length > 0);
  //   });
  // });
});
