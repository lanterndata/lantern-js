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
});

await knex.raw(`
  CREATE INDEX book_index ON books USING lantern_hnsw(book_embedding dist_l2sq_ops)
  WITH (M=2, ef_construction=10, ef=4, dims=3);
`);
```

## Vector search methods

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

## Embedding generation

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

## Vector searche with embedding generation

```js
import Knex from 'knex';
import 'lanterndata/knex';

import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

const text = 'hello worls';
const imageUrl = 'https://lantern.dev/images/home/footer.png';

// distance search with text embedding generation
await knex('books')
  .orderBy(
    knex.cosineDistance(
      'embedding',
      knex.textEmbedding(BAAI_BGE_BASE_EN, text)
    ),
    'desc'
  )
  .limit(2);

// distance search with image embedding generation
await knex('books')
  .orderBy(
    knex.l2Distance(
      'embedding',
      knex.imageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl)
    ),
    'desc'
  )
  .limit(2);
```

Corresponding SQL code (example):

```sql
SELECT * FROM "books"
ORDER BY "embedding" <-> image_embedding('clip/ViT-B-32-visual', "...") DESC
LIMIT 2;
```
