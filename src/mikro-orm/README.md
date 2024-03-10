# lanterndata/mikro-orm

---

## Setting up LanternDB Extension

If you've already executed this through a raw query, then skip this step.

```js
import { MikroORM } from '@mikro-orm/postgresql';
import { extend } from 'lanterndata/mikro-orm';

const orm = await MikroORM.init({});
const em = orm.em.fork();

extend(em);

await em.createLanternExtension();

// For the LanternExtras, you need to run this instead
await em.createLanternExtrasExtension();
```

## Create the Table and add an Index

```js
import { toSql } from 'lanterndata/mikro-orm';

const Book = new EntitySchema({
  name: 'Book',
  tableName: 'books',
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string', nullable: true },
    url: { type: 'string', nullable: true },
    embedding: { type: 'Array<number>', nullable: true },
  },
});

await em.execute('CREATE INDEX book_index ON books USING lantern_hnsw(embedding dist_l2sq_ops');

const books = booksToInsert.map((book) =>
  em.create(Book, {
    ...book,
    // use toSql method to conver [1,2,3] inro '{1,2,3}'
    embedding: toSql(book.embedding),
  }),
);

await em.persistAndFlush(books);
```

## Vector Searches

You can performe vectore search using those distance methods.

```js
await em
  .qb(Book)
  .orderBy({ [em.l2Distance('embedding', [1, 1, 1])]: 'ASC' })
  .limit(5)
  .getResult();

await em
  .qb(Book)
  .orderBy({ [em.cosineDistance('embedding', [1, 1, 1])]: 'ASC' })
  .limit(5)
  .getResult();

await em
  .qb(Book)
  .orderBy({ [em.hammingDistance('embedding', [1, 1, 1])]: 'ASC' })
  .limit(5)
  .getResult();
```

## Generate Embeddings

### Static generation

```js
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

// text embedding
const text = 'hello world';
const result = await em.generateTextEmbedding(BAAI_BGE_BASE_EN, text);
console.log(result[0].text_embedding);

// image embedding
const imageUrl = 'https://lantern.dev/images/home/footer.png';
const result = await em.generateImageEmbedding(CLIP_VIT_B_32_VISUAL, imageUrl);
console.log(result[0].image_embedding);
```

### Dynamic generation

```js
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

// text embeddings
const bookTextEmbeddings = await em
  .qb(Book, 'b1')
  .select(['name', em.textEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, 'b1.name')])
  .where({ name: { $ne: null } })
  .limit(5)
  .execute('all');

// [{ name: "...", text_embedding: [...] }]
console.log(bookTextEmbeddings);

// image embeddings
const bookImageEmbeddings = await em
  .qb(Book, 'b1')
  .select(['url', em.imageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, 'b1.url')])
  .where({ url: { $ne: null } })
  .limit(5)
  .execute('all');


// [{ url: "...", image_embedding: [...] }]
console.log(bookImageEmbeddings);
```

## Vector Searches with embedding generation

```js
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

const bookEmbeddingsOrderd = await em
  .qb(Book, 'b1')
  .select('*')
  .where({ url: { $ne: null } })
  .orderBy({ [em.l2Distance('embedding', em.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'b1.url'))]: 'DESC' })
  .limit(2)
  .execute('all');
```

Corresponding SQL code:

```sql
SELECT * FROM "books"
WHERE "url" IS NOT NULL
ORDER BY "embedding" <-> image_embedding('clip/ViT-B-32-visual', "url") DESC
LIMIT 2;
```
