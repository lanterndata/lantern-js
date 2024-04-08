import { SQLWrapper, PgColumn, Column } from 'drizzle-orm';
import { TextEmbeddingModelType, ImageEmbeddingModelType, OpenAITextEmbeddingModelType, CohereTextEmbeddingModelType } from '../_embeddings/model-types';

export * from '../_common/utils/sql';

export function createLanternExtension(): SQLWrapper;
export function createLanternExtrasExtension(): SQLWrapper;

export function generateTextEmbedding(modelKey: TextEmbeddingModelType, value: string): PgColumn;
export function generateImageEmbedding(modelKey: ImageEmbeddingModelType, value: string): PgColumn;

export function textEmbedding(modelKey: TextEmbeddingModelType, column: string): PgColumn;
export function imageEmbedding(modelKey: ImageEmbeddingModelType, column: string): PgColumn;
export function openaiEmbedding(modelKey: OpenAITextEmbeddingModelType, column: string, dimension?: number): PgColumn;
export function cohereEmbedding(modelKey: CohereTextEmbeddingModelType, column: string): PgColumn;

export function l2Distance(column: Column, value: number[] | string): PgColumn;
export function cosineDistance(column: Column, value: number[] | string): PgColumn;
export function hammingDistance(column: Column, value: number[] | string): PgColumn;
