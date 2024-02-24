# lanterndata/kysely

---

## Setting up LanternDB Extension

If you've already executed this through a raw query, then skip this step.

```js
import { Kysely, PostgresDialect, sql } from 'kysely';
import { extend } from 'lanterndata/kysely';

const dialect = new PostgresDialect({});
const db = new Kysely({ dialect });

extend(sql);

await sql.createLanternExtension().execute(db);
await sql.createLanternExtrasExtension().execute(db);
```

## Create the Table and add an Index

```js
await db.schema
  .createTable('books')
  .addColumn('id', 'serial', (cb) => cb.primaryKey())
  .addColumn('url', 'TEXT')
  .addColumn('name', 'TEXT')
  .addColumn('embedding', 'REAL[]')
  .execute();

await sql.raw(`
    CREATE INDEX book_index ON books USING hnsw(book_embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dims=3);
`).execute(db);
```

## Vector Searches

You can performe vectore search using those distance methods.

```js
await db
  .selectFrom('movies')
  .selectAll()
  .orderBy(sql.l2Distance('embedding', [1, 1, 1]))
  .limit(5)
  .execute();

await db
  .selectFrom('movies')
  .selectAll()
  .orderBy(sql.cosineDistance('embedding', [1, 1, 1]))
  .limit(5)
  .execute();

await db
  .selectFrom('movies')
  .selectAll()
  .orderBy(sql.hammingDistance('embedding', [1, 1, 1]))
  .limit(5)
  .execute();
```

## Generate Embeddings

### Static generation

```js
import { sql } from 'kysely';
import { extend } from 'lanterndata/kysely';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

// const db = ...
extend(sql);

// text embedding
const text = 'hello world';
const embedding = await sql.generateTextEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, text).execute(db);
console.log(embedding.rows[0].text_embedding);

// image embedding
const imageUrl = 'https://lantern.dev/images/home/footer.png';
const embedding = await sql.generateImageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, imageUrl).execute(db);
console.log(embedding.rows[0].image_embedding);
```

### Dynamic generation

```js
import { sql } from 'kysely';
import { extend } from 'lanterndata/kysely';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

// const db = ...
extend(sql);

// text embeddings
const selectLiteral = sql.textEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, 'name');
const bookEmbeddings = await db
    .selectFrom('books')
    .select(['name', selectLiteral])
    .where('name', 'is not', null)
    .limit(5)
    .execute();

// [{ name: "...", text_embedding: [...] }]
console.log(bookTextEmbeddings);

// image embeddings
const selectLiteral = sql.imageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, 'url');
const bookEmbeddings = await db
    .selectFrom('books')
    .select(['url', selectLiteral])
    .where('url', 'is not', null)
    .limit(5)
    .execute();

// [{ url: "...", text_embedding: [...] }]
console.log(bookImageEmbeddings);
```

## Vector Searches with embedding generation

```js
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

const bookEmbeddingsOrderd = await db
  .selectFrom('books')
  .selectAll()
  .where('url', 'is not', null)
  .orderBy(sql.l2Distance('embedding', sql.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url')), 'desc')
  .limit(2)
  .execute();
```

Corresponding SQL code:

```sql
SELECT * FROM "books"
WHERE "url" IS NOT NULL
ORDER BY "embedding" <-> image_embedding('clip/ViT-B-32-visual', "url") DESC
LIMIT 2;
```
