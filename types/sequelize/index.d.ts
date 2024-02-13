export * from '../_common/utils/sql';
import { TextEmbeddingModels, ImageEmbeddingModels } from '../_embeddings';

export function extend(sequelize: Sequelize): void;

declare module 'sequelize' {
  interface Sequelize {
    l2Distance: (column: string, vector: number[] | string) => any;
    cosineDistance: (column: string, vector: number[] | string) => any;
    hammingDistance: (column: string, vector: number[] | string) => any;

    textEmbedding: (modelKey: TextEmbeddingModels, value: string) => any;
    imageEmbedding: (modelKey: ImageEmbeddingModels, value: string) => any;
    generateTextEmbedding: (modelKey: TextEmbeddingModels, value: string) => Promise<any>;
    generateImageEmbedding: (modelKey: ImageEmbeddingModels, value: string) => Promise<any>;

    createLanternExtension: () => Promise<void>;
    createLanternExtrasExtension: () => Promise<void>;
  }
}
