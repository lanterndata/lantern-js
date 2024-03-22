# lanterndata/drizzle-orm

---

## Setting up LanternDB Extension

If you've already executed this through a raw query, then skip this step.

```js
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { createLanternExtension, createLanternExtrasExtension } from 'lanterndata/drizzle-orm';

const client = await postgres();
const db = drizzle(client);

await db.execute(createLanternExtension());

// For the LanternExtras, you need to run this instead
await db.execute(createLanternExtrasExtension());
```

## Create the Table and add an Index

```js
const Book = pgTable('books', {
  id: serial('id').primaryKey(),
  name: text('name'),
  url: text('url'),
  embedding: real('embedding').array(),
});

await client`CREATE INDEX book_index ON books USING lantern_hnsw(embedding dist_l2sq_ops)`;
```

## Vector search methods

You can performe vectore search using those distance methods.

```js
import { l2Distance, cosineDistance, hammingDistance } from 'lanterndata/drizzle-orm';

await db
  .select()
  .from(Book)
  .orderBy(l2Distance(Book.embedding, [1, 1, 1]))
  .limit(5);

await db
  .select()
  .from(Book)
  .orderBy(cosineDistance(Book.embedding, [1, 1, 1]))
  .limit(5);

await db
  .select()
  .from(Book)
  .orderBy(hammingDistance(Book.embedding, [1, 1, 1]))
  .limit(5);
```

## Embedding generation

```js
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';
import { generateTextEmbedding, generateImageEmbedding } from 'lanterndata/drizzle-orm';

// text embedding
const text = 'hello world';
const result = await db.execute(generateTextEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, text));
console.log(result[0].text_embedding);

// image embedding
const imageUrl = 'https://lantern.dev/images/home/footer.png';
const result = await db.execute(generateImageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, imageUrl));
console.log(result[0].image_embedding);
```

## Vector searche with embedding generation

```js
import { desc } from 'drizzle-orm';
import { l2Distance, cosineDistance, textEmbedding, imageEmbedding } from 'lanterndata/drizzle-orm';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

// create db ...

const text = 'hello world';
const imageUrl = 'https://lantern.dev/images/home/footer.png';

// distance search with text embedding generation
db
  .select()
  .from(Book)
  .orderBy(desc(cosineDistance(Book.embedding, textEmbedding(BAAI_BGE_BASE_EN, text))))
  .limit(2);

// distance search with image embedding generation
db
  .select()
  .from(Book)
  .orderBy(desc(l2Distance(Book.embedding, imageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl))))
  .limit(2);
```

Corresponding SQL code (example):

```sql
SELECT * FROM "books"
ORDER BY "embedding" <-> image_embedding('clip/ViT-B-32-visual', "...") DESC
LIMIT 2;
```
