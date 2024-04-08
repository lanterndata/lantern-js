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
    CREATE INDEX book_index ON books USING lantern_hnsw(book_embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dims=3);
`).execute(db);
```

## Vector search methods

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

## Embedding generation

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

## Vector searche with embedding generation

```js
import { sql } from 'kysely';
import { extend } from 'lanterndata/kysely';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

const text = 'hello world';
const imageUrl = 'https://lantern.dev/images/home/footer.png';

// const db = ...
extend(sql);

// distance search with text embedding generation
await db
  .selectFrom('books')
  .selectAll()
  .orderBy(sql.cosineDistance('embedding', sql.textEmbedding(BAAI_BGE_BASE_EN, text)), 'desc')
  .limit(2)
  .execute();

// distance search with image embedding generation
await db
  .selectFrom('books')
  .selectAll()
  .orderBy(sql.l2Distance('embedding', sql.imageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl)), 'desc')
  .limit(2)
  .execute();
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
import { OpenAITextEmbeddingModelType, CohereTextEmbeddingModelType } from 'lanterndata/embeddings';

sql.openaiEmbedding(OpenAITextEmbeddingModelType.ADA_002, 'hello world', 256);
sql.cohereEmbedding(CohereTextEmbeddingModelType.ENGLISH_V3_0, 'hello world');
```