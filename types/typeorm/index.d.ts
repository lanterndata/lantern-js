import { TextEmbeddingModelType, ImageEmbeddingModelType, OpenAITextEmbeddingModelType, CohereTextEmbeddingModelType } from '../_embeddings/model-types';

export * from '../_common/utils/sql';

export function createLanternExtension(): string;
export function createLanternExtrasExtension(): string;

export function generateTextEmbedding(modelKey: TextEmbeddingModelType, value: string): any;
export function generateImageEmbedding(modelKey: ImageEmbeddingModelType, value: string): any;

export function textEmbedding(modelKey: TextEmbeddingModelType, column: string): string;
export function imageEmbedding(modelKey: ImageEmbeddingModelType, column: string): string;
export function openaiEmbedding(modelKey: OpenAITextEmbeddingModelType, column: string, dimension?: number): string;
export function cohereEmbedding(modelKey: CohereTextEmbeddingModelType, column: string): string;

export function l2Distance(column: string, value: number[] | string): string;
export function cosineDistance(column: string, value: number[] | string): string;
export function hammingDistance(column: string, value: number[] | string): string;
