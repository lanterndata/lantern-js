# lanterndata/objection

---

## Setting up LanternDB Extension

If you've already executed this through a raw query, then skip this step.

```js
import Knex from 'knex';
import 'lanterndata/objection';

const knex = Knex();

await knex.schema.createLanternExtension();

// For the LanternExtras, you need to run this instead
await knex.schema.createLanternExtrasExtension();
```

## Create the Table and add an Index

```js
import { Model } from 'objection';

const knex = Knex();

Model.knex(knex);

class Book extends Model {
  static get tableName() {
    return 'books';
  }
}

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
import { l2Distance, cosineDistance, hammingDistance } from 'lanterndata/objection';

await Book.query()
  .orderBy(l2Distance('embedding', [1, 1, 1]))
  .limit(5);

await Book.query()
  .orderBy(cosineDistance('embedding', [1, 1, 1]))
  .limit(5);

await Book.query()
  .orderBy(hammingDistance('embedding', [1, 1, 1]))
  .limit(5);
```

## Embedding generation

```js
import Knex from 'knex';
import 'lanterndata/objection';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const knex = Knex();

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

import { l2Distance, cosineDistance, textEmbedding, imageEmbedding } from 'lanterndata/objection';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const knex = Knex();

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

const text = 'hello world';
const imageUrl = 'https://lantern.dev/images/home/footer.png';

// distance search with text embedding generation
await Book.query()
  .orderBy(
    cosineDistance(
      'embedding',
      textEmbedding(BAAI_BGE_BASE_EN, text)
    ),
    'desc'
  )
  .limit(2);

// distance search with image embedding generation
await Book.query()
  .orderBy(
    l2Distance(
      'embedding',
      imageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl)
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

### Other methods

- `openaiEmbedding(OpenAITextEmbeddingModelType, text, [dimension])`
- `cohereEmbedding(CohereTextEmbeddingModelType, text)`

```
import { openaiEmbedding, cohereEmbedding } from 'lanterndata/objection';
import { OpenAITextEmbeddingModelType, CohereTextEmbeddingModelType } from 'lanterndata/embeddings';

sequelize.openaiEmbedding(OpenAITextEmbeddingModelType.ADA_002, 'hello world', 256);
sequelize.cohereEmbedding(CohereTextEmbeddingModelType.ENGLISH_V3_0, 'hello world');
```