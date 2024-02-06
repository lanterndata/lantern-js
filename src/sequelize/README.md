# lantern/sequelize
---

## Setting up LanternDB Extension

Everything begins by creating the LanternDB extension in the PostgreSQL database.

```js
await sequelize.query('CREATE EXTENSION IF NOT EXISTS lantern;');
```

## Vector Searches

Now we can performe vectore search using those distance algorithms.

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