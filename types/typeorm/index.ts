import { TextEmbeddingModelType, ImageEmbeddingModelType } from '../_embeddings/model-types';

export * from '../_common/utils/sql';

export function createLanternExtension(): string;
export function createLanternExtrasExtension(): string;

export function generateTextEmbedding(modelKey: TextEmbeddingModelType, value: string): string;
export function generateImageEmbedding(modelKey: ImageEmbeddingModelType, value: string): string;

export function textEmbedding(modelKey: TextEmbeddingModelType, column: string): string;
export function imageEmbedding(modelKey: ImageEmbeddingModelType, column: string): string;

export function l2Distance(column: string, value: number[] | string): string;
export function cosineDistance(column: string, value: number[] | string): string;
export function hammingDistance(column: string, value: number[] | string): string;
