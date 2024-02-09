const { escapeSingleQuotes } = require('../_common/utils/utils');
const { TextEmbeddingModels, ImageEmbeddingModels, OpenAITextEmbeddingModels, CohereTextEmbeddingModels } = require('./enums');

function textEmbedding(modelName, value) {
  const embedding = TextEmbeddingModels[modelName];

  if (!embedding) {
    throw new Error('Invalid model');
  }

  if (!value) {
    throw new Error('Text is not provided');
  }

  return `text_embedding(${embedding}, ${escapeSingleQuotes(value)})`;
}

function imageEmbedding(modelName, imageUrl) {
  const embedding = ImageEmbeddingModels[modelName];

  if (!embedding) {
    throw new Error('Invalid model');
  }

  if (!imageUrl) {
    throw new Error('Image URL is not provided');
  }

  return `image_embedding(${embedding}, ${escapeSingleQuotes(imageUrl)})`;
}

module.exports = {
  textEmbedding,
  imageEmbedding,

  TextEmbeddingModels,
  ImageEmbeddingModels,
  OpenAITextEmbeddingModels,
  CohereTextEmbeddingModels,
};
