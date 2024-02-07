import { TextEmbeddingModels, ImageEmbeddingModels } from './_embeddings/enums';

export function textEmbedding(modelName: TextEmbeddingModels, value: text): string;
export function imageEmbedding(modelName: ImageEmbeddingModels, value: text): string;

export { TextEmbeddingModels, ImageEmbeddingModels };
