import assert from 'node:assert';
import lantern from 'lantern/sequelize';
import { describe, it, after } from 'node:test';
import { Sequelize, DataTypes } from 'sequelize';

describe('Sequelize', () => {
  let sequelize, Book, Movie;

  after(async () => {
    await sequelize.query('DROP TABLE IF EXISTS books;');
    await sequelize.query('DROP TABLE IF EXISTS movies;');

    await sequelize.close();
  });

  it('should create the lantern extension ', async () => {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      logging: false,
    });

    await sequelize.query('CREATE EXTENSION IF NOT EXISTS lantern;');

    sequelize.close();
  });

  it('should create a table [REAL] with index and data', async () => {
    // reconnect after the lantern extension has been created
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      logging: false,
    });

    Book = sequelize.define(
      'Book',
      {
        embedding: {
          type: DataTypes.ARRAY(DataTypes.REAL),
        },
      },
      {
        modelName: 'Book',
        tableName: 'books',
      },
    );

    await Book.sync({ force: true });

    await sequelize.query(`
      CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
      WITH (M=2, ef_construction=10, ef=4, dim=3);
    `);

    await Book.create({ embedding: [1, 1, 1] });
    await Book.create({ embedding: [2, 2, 2] });
    await Book.create({ embedding: [1, 1, 2] });
  });

  it('should create a table [INT] with index and data', async () => {
    Movie = sequelize.define(
      'Movie',
      {
        embedding: {
          type: DataTypes.ARRAY(DataTypes.INTEGER),
        },
      },
      {
        modelName: 'Movie',
        tableName: 'movies',
      },
    );

    await Movie.sync({ force: true });

    await sequelize.query(`
      CREATE INDEX movie_index ON movies USING hnsw(embedding dist_hamming_ops)
      WITH (M=2, ef_construction=10, ef=4, dim=3);
    `);

    await Movie.create({ embedding: [1, 1, 1] });
    await Movie.create({ embedding: [2, 2, 2] });
    await Movie.create({ embedding: [1, 1, 2] });
  });

  it('should find using L2 distance', async () => {
    let books = await Book.findAll({
      order: lantern.l2('embedding', [1, 1, 1], sequelize),
      limit: 5,
    });

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 3, 2],
    );
    assert.deepStrictEqual(books[0].embedding, [1, 1, 1]);
    assert.deepStrictEqual(books[1].embedding, [1, 1, 2]);
    assert.deepStrictEqual(books[2].embedding, [2, 2, 2]);
  });

  it('should find using Cosine distance', async () => {
    await Book.create({});

    let books = await Book.findAll({
      order: lantern.cosine('embedding', [1, 1, 1], sequelize),
      limit: 5,
    });

    assert.deepStrictEqual(
      books.map((v) => v.id),
      [1, 2, 3, 4],
    );
  });

  it('should find using Hamming distance', async () => {
    await Movie.create({});

    let movies = await Movie.findAll({
      order: lantern.hamming('embedding', [1, 1, 1], sequelize),
      limit: 5,
    });

    assert.deepStrictEqual(
      movies.map((v) => v.id),
      [1, 3, 2],
    );
  });

  it('should fail because of wrong embedding dimensions', async () => {
    await Book.create({ embedding: [1] }).catch((e) => assert.equal(e.message, 'Wrong number of dimensions: 1 instead of 3 expected'));
  });
});
