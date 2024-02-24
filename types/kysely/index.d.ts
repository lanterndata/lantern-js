import { Sql } from 'kysely';
import { TextEmbeddingModelType, ImageEmbeddingModelType } from 'lanterndata/types/_embeddings/model-types';

export * from 'lanterndata/types/_common/utils/sql';

export declare function extend(sql: Sql): void;

declare module 'kysely' {
  interface Sql {
    l2Distance(column: string, vector: number[] | string): RawBuilder;
    cosineDistance(column: string, vector: number[] | string): RawBuilder;
    hammingDistance(column: string, vector: number[] | string): RawBuilder;

    textEmbedding(modelKey: TextEmbeddingModelType, value: string): RawBuilder;
    imageEmbedding(modelKey: ImageEmbeddingModelType, value: string): RawBuilder;
    generateTextEmbedding(modelKey: TextEmbeddingModelType, value: string): RawBuilder;
    generateImageEmbedding(modelKey: ImageEmbeddingModelType, value: string): RawBuilder;

    createLanternExtension(): RawBuilder;
    createLanternExtrasExtension(): RawBuilder;
  }
}
