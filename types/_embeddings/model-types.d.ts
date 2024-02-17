import { TextEmbeddingModels, ImageEmbeddingModels } from './';

export type TextEmbeddingModelType = TextEmbeddingModels[keyof TextEmbeddingModels];

export type ImageEmbeddingModelType = ImageEmbeddingModels[keyof ImageEmbeddingModels];
