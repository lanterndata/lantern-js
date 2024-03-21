import { SQLWrapper, PgColumn, Column } from 'drizzle-orm';
import { TextEmbeddingModelType, ImageEmbeddingModelType } from '../_embeddings/model-types';

export * from '../_common/utils/sql';

export function createLanternExtension(): SQLWrapper;
export function createLanternExtrasExtension(): SQLWrapper;

export function generateTextEmbedding(modelKey: TextEmbeddingModelType, value: string): PgColumn;
export function generateImageEmbedding(modelKey: ImageEmbeddingModelType, value: string): PgColumn;

export function textEmbedding(modelKey: TextEmbeddingModelType, column: string): string;
export function imageEmbedding(modelKey: ImageEmbeddingModelType, column: string): string;

export function l2Distance(column: Column, value: number[] | string): PgColumn;
export function cosineDistance(column: Column, value: number[] | string): PgColumn;
export function hammingDistance(column: Column, value: number[] | string): PgColumn;
