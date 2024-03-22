import assert from 'node:assert';
import lantern from 'lanterndata/sequelize';

import { describe, it, after } from 'node:test';
import { Sequelize, DataTypes, Op } from 'sequelize';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

import sqlQueries from './_common/sql.mjs';

import { imageUrl, newBooks, newMovies, newBooks768Dim, newBooks512Dim, exampleText } from './_fixtures/fixtures.mjs';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

async function dropTables(sequelize) {
  await sequelize.query(sqlQueries.books.dropTable);
  await sequelize.query(sqlQueries.movies.dropTable);
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

    await Book.bulkCreate(newBooks);

    await sequelize.query(sqlQueries.books.createIndexDef);
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

    await Movie.bulkCreate(newMovies);

    await sequelize.query(sqlQueries.movies.createIndexDef);
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

  it('should find using Cosine distance and do text_embedding generation', async () => {
    await Book.destroy({ where: {} });

    await sequelize.query(sqlQueries.books.dropIndex);
    await sequelize.query(sqlQueries.books.createIndex768);

    await Book.bulkCreate(newBooks768Dim);

    const bookEmbeddingsOrderd = await Book.findAll({
      order: [[sequelize.cosineDistance('embedding', sequelize.textEmbedding(BAAI_BGE_BASE_EN, 'yourParamName')), 'asc']],
      where: { name: { [Op.not]: null } },
      limit: 2,
      replacements: {
        yourParamName: exampleText,
      },
    });

    assert.equal(bookEmbeddingsOrderd.length, 2);
  });

  it('should find using L2 distance and do image_embedding generation', async () => {
    await Book.destroy({ where: {} });

    await sequelize.query(sqlQueries.books.dropIndex);
    await sequelize.query(sqlQueries.books.createIndex512);

    await Book.bulkCreate(newBooks512Dim);

    const bookEmbeddingsOrderd = await Book.findAll({
      order: [[sequelize.l2Distance('embedding', sequelize.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'yourParamName')), 'desc']],
      where: { url: { [Op.not]: null } },
      limit: 2,
      replacements: {
        yourParamName: imageUrl,
      },
    });

    assert.equal(bookEmbeddingsOrderd.length, 2);
    assert.equal(bookEmbeddingsOrderd[0].name, 'Harry Potter');
    assert.equal(bookEmbeddingsOrderd[1].name, 'Greek Myths');
  });
});
