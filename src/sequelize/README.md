# lanterndata/sequelize

---

## Setting up LanternDB Extension

If you've already executed this through a raw query, then skip this step.

```js
import lantern from 'lanterndata/sequelize';
import { Sequelize } from 'sequelize';

const sequelize = Sequelize();

// extends the sequelize client
lantern.extend(sequelize);

await sequelize.createLanternExtension();

// For the LanternExtras, you need to run this instead
await sequelize.createLanternExtrasExtension();
```

## Create the Table and add an Index

```js
const Book = sequelize.define('Book', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  embedding: { type: DataTypes.ARRAY(DataTypes.REAL) },
  name: { type: DataTypes.TEXT },
  url: { type: DataTypes.TEXT },
}, {
  modelName: 'Book',
  tableName: 'books',
});

await sequelize.query(`
  CREATE INDEX book_index ON books USING lantern_hnsw(book_embedding dist_l2sq_ops)
  WITH (M=2, ef_construction=10, ef=4, dims=3);
`);
```

## Vector search methods

You can performe vectore search using those distance methods.

```js
await Book.findAll({
  order: sequelize.l2Distance('embedding', [1, 1, 1]),
  limit: 5,
});

await Book.findAll({
  order: sequelize.cosineDistance('embedding', [1, 1, 1]),
  limit: 5,
});

await Book.findAll({
  order: sequelize.hammingDistance('embedding', [1, 1, 1]),
  limit: 5,
});
```

## Embedding generation

```js
import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';

// text embedding
const text = 'hello world';
const [result] = await sequelize.generateTextEmbedding(TextEmbeddingModels.BAAI_BGE_BASE_EN, text);
console.log(result[0].text_embedding);

// image embedding
const imageUrl = 'https://lantern.dev/images/home/footer.png';
const [result] = await sequelize.generateImageEmbedding(ImageEmbeddingModels.CLIP_VIT_B_32_VISUAL, imageUrl);
console.log(result[0].image_embedding);
```

## Vector searche with embedding generation

```js
import lantern from 'lanterndata/sequelize';
import { Sequelize } from 'sequelize';

import { TextEmbeddingModels, ImageEmbeddingModels } from 'lanterndata/embeddings';


const sequelize = Sequelize();

// extends the sequelize client
lantern.extend(sequelize);

const { BAAI_BGE_BASE_EN } = TextEmbeddingModels;
const { CLIP_VIT_B_32_VISUAL } = ImageEmbeddingModels;

const text = 'hello world';
const imageUrl = 'https://lantern.dev/images/home/footer.png';

await Book.findAll({
  order: [[sequelize.cosineDistance('embedding', sequelize.textEmbedding(BAAI_BGE_BASE_EN, 'yourParamName')), 'desc']],
  limit: 2,
  replacements: {
    yourParamName: text,
  },
});

await Book.findAll({
  order: [[sequelize.l2Distance('embedding', sequelize.imageEmbedding(CLIP_VIT_B_32_VISUAL, 'yourParamName')), 'desc']],
  limit: 2,
  replacements: {
    yourParamName: imageUrl,
  },
});
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

sequelize.openaiEmbedding(OpenAITextEmbeddingModelType.ADA_002, 'modelParamName', 'dimensionParamName');
sequelize.cohereEmbedding(CohereTextEmbeddingModelType.ENGLISH_V3_0, 'modelParamName');
```