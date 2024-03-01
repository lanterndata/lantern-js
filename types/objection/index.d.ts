export * from '../_common/utils/sql';
import { TextEmbeddingModelType, ImageEmbeddingModelType } from '../_embeddings/model-types';

declare module 'knex' {
  interface Knex {
    generateTextEmbedding: (modelKey: TextEmbeddingModelType, value: string) => Promise<any>;
    generateImageEmbedding: (modelKey: ImageEmbeddingModelType, value: string) => Promise<any>;
  }
  namespace Knex {
    interface SchemaBuilder {
      createLanternExtension: () => Promise<void>;
      createLanternExtrasExtension: () => Promise<void>;
    }
  }
}

export function textEmbedding(modelKey: TextEmbeddingModelType, column: Column): any;
export function imageEmbedding(modelKey: ImageEmbeddingModelType, column: Column): any;

export function l2Distance(column: Column, value: number[] | string): any;
export function cosineDistance(column: Column, value: number[] | string): any;
export function hammingDistance(column: Column, value: number[] | string): any;
