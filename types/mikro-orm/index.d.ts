import { EntityManager } from '@mikro-orm/core';

import { TextEmbeddingModelType, ImageEmbeddingModelType } from '../_embeddings/model-types';

export * from '../_common/utils/sql';

export function extend(em: EntityManager): void;

declare module '@mikro-orm/core' {
  interface EntityManager {
    l2Distance: (column: string, vector: number[] | string) => any;
    cosineDistance: (column: string, vector: number[] | string) => any;
    hammingDistance: (column: string, vector: number[] | string) => any;

    static textEmbedding: (modelKey: TextEmbeddingModelType, value: string) => any;
    static imageEmbedding: (modelKey: ImageEmbeddingModelType, value: string) => any;
    static generateTextEmbedding: (modelKey: TextEmbeddingModelType, value: string) => Promise<any>;
    static generateImageEmbedding: (modelKey: ImageEmbeddingModelType, value: string) => Promise<any>;

    static createLanternExtension: () => Promise<void>;
    static createLanternExtrasExtension: () => Promise<void>;
  }
}
