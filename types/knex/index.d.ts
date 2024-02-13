export * from '../_common/utils/sql';
import { TextEmbeddingModels, ImageEmbeddingModels } from '../_embeddings';

declare module 'knex' {
  interface Knex {
    l2Distance: (column: string, vector: number[] | string) => any;
    cosineDistance: (column: string, vector: number[] | string) => any;
    hammingDistance: (column: string, vector: number[] | string) => any;

    textEmbedding: (modelKey: TextEmbeddingModels, value: string) => any;
    imageEmbedding: (modelKey: ImageEmbeddingModels, value: string) => any;
    generateTextEmbedding: (modelKey: TextEmbeddingModels, value: string) => Promise<any>;
    generateImageEmbedding: (modelKey: ImageEmbeddingModels, value: string) => Promise<any>;
  }
  namespace Knex {
    interface SchemaBuilder {
      createLanternExtension: () => Promise<void>;
      createLanternExtrasExtension: () => Promise<void>;
    }
  }
}
