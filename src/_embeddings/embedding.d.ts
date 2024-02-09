import { TextEmbeddingModels, ImageEmbeddingModels, OpenAITextEmbeddingModels, CohereTextEmbeddingModels } from './_embeddings/enums';

export function textEmbedding(modelName: TextEmbeddingModels | OpenAITextEmbeddingModels | CohereTextEmbeddingModels, value: text): string;
export function imageEmbedding(modelName: ImageEmbeddingModels, value: text): string;

export { TextEmbeddingModels, ImageEmbeddingModels };
