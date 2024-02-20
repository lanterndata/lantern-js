export * from '../_common/utils/sql';
import { TextEmbeddingModelType, ImageEmbeddingModelType } from '../_embeddings/model-types';

export function extend(em: SqlEntityManager): void;

declare module '@mikro-orm/core' {
  export class MikraoORM {
    static l2Distance: (column: string, vector: number[] | string) => any;
    static cosineDistance: (column: string, vector: number[] | string) => any;
    static hammingDistance: (column: string, vector: number[] | string) => any;

    static textEmbedding: (modelKey: TextEmbeddingModelType, value: string) => any;
    static imageEmbedding: (modelKey: ImageEmbeddingModelType, value: string) => any;
    static generateTextEmbedding: (modelKey: TextEmbeddingModelType, value: string) => Promise<any>;
    static generateImageEmbedding: (modelKey: ImageEmbeddingModelType, value: string) => Promise<any>;

    static createLanternExtension: () => Promise<void>;
    static createLanternExtrasExtension: () => Promise<void>;
  }
}
