import { TextEmbeddingModels, ImageEmbeddingModels, CohereTextEmbeddingModels, OpenAITextEmbeddingModels } from './';

export type TextEmbeddingModelType = TextEmbeddingModels[keyof TextEmbeddingModels];

export type ImageEmbeddingModelType = ImageEmbeddingModels[keyof ImageEmbeddingModels];

export type OpenAITextEmbeddingModelType = OpenAITextEmbeddingModels[keyof OpenAITextEmbeddingModels];

export type CohereTextEmbeddingModelType = CohereTextEmbeddingModels[keyof CohereTextEmbeddingModels];
