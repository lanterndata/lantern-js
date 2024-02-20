import { EntityManager } from '@mikro-orm/core';

import { TextEmbeddingModelType, ImageEmbeddingModelType } from '../_embeddings/model-types';

export * from '../_common/utils/sql';

export function extend(em: EntityManager): void;

declare module '@mikro-orm/core' {
  interface EntityManager {
    l2Distance: (column: string, vector: number[] | string) => any;
    cosineDistance: (column: string, vector: number[] | string) => any;
    hammingDistance: (column: string, vector: number[] | string) => any;

    textEmbedding: (modelKey: TextEmbeddingModelType, value: string) => any;
    imageEmbedding: (modelKey: ImageEmbeddingModelType, value: string) => any;
    generateTextEmbedding: (modelKey: TextEmbeddingModelType, value: string) => Promise<any>;
    generateImageEmbedding: (modelKey: ImageEmbeddingModelType, value: string) => Promise<any>;

    createLanternExtension: () => Promise<void>;
    createLanternExtrasExtension: () => Promise<void>;
  }
}
