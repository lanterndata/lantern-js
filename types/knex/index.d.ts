export * from '../_common/utils/sql';
import { TextEmbeddingModelType, ImageEmbeddingModelType, OpenAITextEmbeddingModelType, CohereTextEmbeddingModelType } from '../_embeddings/model-types';

declare module 'knex' {
  interface Knex {
    l2Distance: (column: string, vector: number[] | string) => any;
    cosineDistance: (column: string, vector: number[] | string) => any;
    hammingDistance: (column: string, vector: number[] | string) => any;

    textEmbedding: (modelKey: TextEmbeddingModelType, value: string) => any;
    imageEmbedding: (modelKey: ImageEmbeddingModelType, value: string) => any;
    openaiEmbedding: (modelKey: OpenAITextEmbeddingModelType, value: string, dimension?: number) => any;
    cohereEmbedding: (modelKey: CohereTextEmbeddingModelType, value: string) => any;

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
