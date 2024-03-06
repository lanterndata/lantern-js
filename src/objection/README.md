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

## Vector Searches

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

## Generate Embeddings

### Static generation

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

### Dynamic generation

```js
import Knex from 'knex';
import { textEmbedding, imageEmbedding } from 'lanterndata/objection';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const knex = Knex();

// text embeddings
const selectLiteral = textEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, 'name');
const bookTextEmbeddings = Book.query()
    .select('name')
    .select(selectLiteral)
    .whereNotNull('name');

// [{ name: "...", text_embedding: [...] }]
console.log(bookTextEmbeddings);

// image embeddings
const selectLiteral = imageEmbedding(ImageEmbeddingModels.BAAI_BGE_BASE_EN, 'url');
const bookImageEmbeddings = Book.query()
    .select('url')
    .select(selectLiteral)
    .whereNotNull('url');

// [{ url: "...", text_embedding: [...] }]
console.log(bookImageEmbeddings);
```

## Vector Searches with embedding generation

```js
import { l2Distance, imageEmbedding } from 'lanterndata/objection';
import { ImageEmbeddingModels } from 'lanterndata/embeddings';

const bookEmbeddingsOrderd = await Book.query()
  .whereNotNull('url')
  .orderBy(
    l2Distance(
      'embedding',
      imageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, 'url')
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
