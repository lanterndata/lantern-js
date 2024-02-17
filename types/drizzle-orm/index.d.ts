import { SQLWrapper, Column } from 'drizzle-orm';
import { TextEmbeddingModels, ImageEmbeddingModels } from '../_embeddings';

export * from '../_common/utils/sql';

export function createLanternExtension(): SQLWrapper;
export function createLanternExtrasExtension(): SQLWrapper;

export function generateTextEmbedding(modelKey: TextEmbeddingModels, value: string): SQLWrapper;
export function generateImageEmbedding(modelKey: ImageEmbeddingModels, value: string): SQLWrapper;

export function textEmbedding(modelKey: TextEmbeddingModels, column: Column): SQLWrapper;
export function imageEmbedding(modelKey: ImageEmbeddingModels, column: Column): SQLWrapper;

export function l2Distance(column: Column, value: number[] | string): SQLWrapper;
export function cosineDistance(column: Column, value: number[] | string): SQLWrapper;
export function hammingDistance(column: Column, value: number[] | string): SQLWrapper;
