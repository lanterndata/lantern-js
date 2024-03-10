# lanterndata/typeorm

---

## Setting up LanternDB Extension

If you've already executed this through a raw query, then skip this step.

```js
import { DataSource, EntitySchema } from 'typeorm';
import { createLanternExtension, createLanternExtrasExtension } from 'lanterndata/typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Book, Movie],
});

await AppDataSource.initialize();

await AppDataSource.query(createLanternExtension());

// For the LanternExtras, you need to run this instead
await AppDataSource.query(createLanternExtrasExtension());
```

## Create the Table and add an Index

```js
import { EntitySchema } from 'typeorm';

const Book = new EntitySchema({
  name: 'Book',
  tableName: 'books',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    name: { type: 'text' },
    url: { type: 'text' },
    embedding: {
      type: 'real',
      array: true,
    },
  },
});

await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      name TEXT,
      url TEXT,
      embedding REAL[]
    )
`);

await AppDataSource.query(`
  CREATE INDEX book_index ON books USING lantern_hnsw(book_embedding dist_l2sq_ops)
  WITH (M=2, ef_construction=10, ef=4, dims=3);
`);
```

## Vector Searches

You can performe vectore search using those distance methods.

```js
import { l2Distance, cosineDistance, hammingDistance } from 'lanterndata/typeorm';

const bookRepository = AppDataSource.getRepository(Book);

await bookRepository
  .createQueryBuilder('books')
  .orderBy(l2Distance('embedding', ':myEmbedding'))
  .setParameters({ myEmbedding: [1, 1, 1] })
  .limit(5)
  .getMany();

await bookRepository
  .createQueryBuilder('books')
  .orderBy(cosineDistance('embedding', ':myEmbedding'))
  .setParameters({ myEmbedding: [1, 1, 1] })
  .limit(5)
  .getMany();

await bookRepository
  .createQueryBuilder('books')
  .orderBy(hammingDistance('embedding', ':myEmbedding'))
  .setParameters({ myEmbedding: [1, 1, 1] })
  .limit(5)
  .getMany();
```

## Generate Embeddings

### Static generation

```js
import { generateTextEmbedding, generateImageEmbedding } from 'lanterndata/typeorm';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

// text embedding
const text = 'hello world';
const embedding = await AppDataSource.query(generateTextEmbedding(BAAI_BGE_BASE_EN), [ text ]);
console.log(embedding[0].text_embedding);

// image embedding
const imageUrl = 'https://lantern.dev/images/home/footer.png';
const embedding = await AppDataSource.query(generateImageEmbedding(CLIP_VIT_B_32_VISUAL), [ imageUrl ]);
console.log(embedding[0].image_embedding);
```

### Dynamic generation

```js
import { textEmbedding, imageEmbedding } from 'lanterndata/typeorm';
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

// text embeddings
const bookTextEmbeddings = await bookRepository
    .createQueryBuilder('books')
    .select('name')
    .addSelect(textEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, 'name'))
    .where('name IS NOT NULL')
    .getRawMany();

// [{ name: "...", text_embedding: [...] }]
console.log(bookTextEmbeddings);

// image embeddings
const bookImageEmbeddings = await bookRepository
    .createQueryBuilder('books')
    .select('url')
    .addSelect(imageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, 'url'))
    .where('url IS NOT NULL')
    .getRawMany();

// [{ url: "...", image_embedding: [...] }]
console.log(bookImageEmbeddings);
```

## Vector Searches with embedding generation

```js
import { l2Distance, imageEmbedding } from 'lanterndata/typeorm';
import { ImageEmbeddingModels } from 'lanterndata/embeddings';

const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

const bookEmbeddingsOrderd = await bookRepository
  .createQueryBuilder('books')
  .orderBy(l2Distance('embedding', imageEmbedding(CLIP_VIT_B_32_VISUAL, 'url')), 'DESC')
  .where('url IS NOT NULL')
  .limit(2)
  .getMany();
```

Corresponding SQL code:

```sql
SELECT * FROM "books"
WHERE "url" IS NOT NULL
ORDER BY "embedding" <-> image_embedding('clip/ViT-B-32-visual', "url") DESC
LIMIT 2;
```
