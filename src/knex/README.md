# lanterndata/knex

---

## Setting up LanternDB Extension

If you've already executed this through a raw query, then skip this step.

```js
import Knex from 'knex';
import 'lanterndata/knex';

const knex = Knex();

await knex.schema.createLanternExtension();

// For the LanternExtras, you need to run this instead
await knex.schema.createLanternExtrasExtension();
```

## Create the Table and add an Index

```js
await knex.schema.createTable('books', (table) => {
  table.increments('id');
  table.specificType('url', 'TEXT');
  table.specificType('name', 'TEXT');
  table.specificType('embedding', 'REAL[]');

  knex.raw(`
    CREATE INDEX book_index ON books USING hnsw(book_embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dims=3);
  `);
});
```

## Vector Searches

You can performe vectore search using those distance methods.

```js
await knex('books')
  .orderBy(knex.l2Distance('embedding', [1, 1, 1]))
  .limit(5);

await knex('books')
  .orderBy(knex.cosineDistance('embedding', [1, 1, 1]))
  .limit(5);

await knex('books')
  .orderBy(knex.hammingDistance('embedding', [1, 1, 1]))
  .limit(5);
```

## Generate Embeddings

### Static generation

```js
import Knex from 'knex';
import 'lanterndata/knex';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

// text embedding
const text = 'hello world';
const embedding = await knex.generateTextEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, text);
console.log(embedding.rows[0].text_embedding);

// image embedding
const imageUrl = 'https://lantern.dev/images/home/footer.png';
const embedding = await knex.generateImageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, imageUrl);
console.log(embedding.rows[0].image_embedding);
```

### Dynamic generation

```js
import Knex from 'knex';
import 'lanterndata/knex';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

// text embeddings
const selectLiteral = knex.textEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, 'name');
const bookTextEmbeddings = await knex('books')
    .select('name')
    .select(selectLiteral)
    .whereNotNull('name');

// [{ name: "...", text_embedding: [...] }]
console.log(bookTextEmbeddings);

// image embeddings
const selectLiteral = knex.imageEmbedding(ImageEmbeddingModels.BAAI_BGE_BASE_EN, 'url');
const bookImageEmbeddings = await knex('books')
    .select('url')
    .select(selectLiteral)
    .whereNotNull('url');

// [{ url: "...", text_embedding: [...] }]
console.log(bookImageEmbeddings);
```

## Vector Searches with embedding generation

```js
const bookEmbeddingsOrderd = await knex('books')
  .whereNotNull('url')
  .orderBy(
    knex.l2Distance(
      'embedding',
      knex.imageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, 'url')
    ),
    'desc'
  )
  .limit(2);
```

Corresponding SQL code:

```sql
SELECT * FROM "books"
WHERE "url" IS NOT NULL
ORDER BY "embedding" <-> image_embedding('clip/ViT-B-32-visual', "url") DESC
LIMIT 2;
```
