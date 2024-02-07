# lantern/knex

---

## Setting up LanternDB Extension

Everything begins by creating the LanternDB extension in the PostgreSQL database.

If you've already executed this through a raw query, then skip this step.

```js
import Knex from 'knex';
import lantern from 'lantern/knex';

const knex = Knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

await knex.schema.addExtension('lantern');

// Fro Lantern Extras you shoul also do
await knex.schema.addExtension('lantern_extras');
```

## Create the Table and add an Index

```js
await knex.schema.createTable('books', (table) => {
  table.increments('id');
  table.specificType('embedding', 'REAL[]');

  knex.raw(`
    CREATE INDEX book_index ON books USING hnsw(book_embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dims=3);
  `);
});
```

## Vector Searches

You can performe vectore search using those distance algorithms.

```js
await knex('books')
  .orderBy(knex.l2('embedding', [1, 1, 1]))
  .limit(5);

await knex('books')
  .orderBy(knex.cosine('embedding', [1, 1, 1]))
  .limit(5);

await knex('books')
  .orderBy(knex.cosine('embedding', [1, 1, 1]))
  .limit(5);
```

## Generate Embeddings

### Static generation

```js
import Knex from 'knex';
import lantern from 'lantern/knex';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lantern/embeddings';

// text embedding
const embedding = await knex.generateTextEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, 'hello world');
console.log(embedding.rows[0].text_embedding);

// image embedding
const embedding = await knex.generateImageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, 'https://lantern.dev/images/home/footer.png');
console.log(embedding.rows[0].image_embedding);
```

### Dynamic generation

```js
import Knex from 'knex';
import lantern from 'lantern/knex';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lantern/embeddings';

// text embeddings
const bookTextEmbeddings = await knex('books').select('name').select(knex.textEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, 'name')).whereNotNull('name');

// [{ name: "...", text_embedding: [...] }]
console.log(bookTextEmbeddings);

// image embeddings
const bookImageEmbeddings = await knex('books').select('url').select(knex.imageEmbedding(ImageEmbeddingModels.BAAI_BGE_BASE_EN, 'url')).whereNotNull('url');

// [{ url: "...", text_embedding: [...] }]
console.log(bookImageEmbeddings);
```

## Vector Searches with embedding generation

```js
const bookEmbeddingsOrderd = await knex('books')
  .whereNotNull('url')
  .orderBy(knex.l2('embedding', knex.imageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, 'url')), 'desc')
  .limit(2);
```

Corresponding SQL code:

```sql
SELECT * FROM "books" WHERE "url" IS NOT NULL ORDER BY "embedding" <-> image_embedding('clip/ViT-B-32-visual', "url") DESC LIMIT 2;
```
