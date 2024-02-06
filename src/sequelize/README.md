# lantern/sequelize
---

## Setting up LanternDB Extension

Everything begins by creating the LanternDB extension in the PostgreSQL database.

```js
await sequelize.query('CREATE EXTENSION IF NOT EXISTS lantern;');
```

## Creating a Table with Vector Index

The `lantern.supportIndexes` function enables support for the index types.

```js
import lantern from 'lantern/sequelize';
// ...

const sequelize = new Sequelize();

lantern.supportIndexes(sequelize);
```

Now we can create the indexes and utilize the with field to specify the index details.

```js
const Book = sequelize.define('Book', {
  embedding: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
  }
}, {
  modelName: 'Book',
  tableName: 'books',
  indexes: [
    {
      fields: ['embedding'],
      using: 'hnsw',
      operator: 'dist_hamming_ops',
      with: {
        M: 2,
        ef: 4,
        dim: 3,
        ef_construction: 10
      },
    }
  ]
});
```

## Vector Searches

We can performe vectore search using those distance algorithms.

```js
await Book.findAll({
  order: lantern.l2('embedding', [1, 1, 1], sequelize),
  limit: 2
});

await Book.findAll({
  order: lantern.cosine('embedding', [1, 1, 1], sequelize),
  limit: 2
});

await Movie.findAll({
  order: lantern.hamming('embedding', [1, 1, 1], sequelize),
  limit: 2
});
```