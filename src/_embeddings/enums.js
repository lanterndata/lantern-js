const TextEmbeddingModels = {
  MICROSOFT_MINILM_L12_V2: 'MICROSOFT_MINILM_L12_V2',
  CLIP_VIT_B_32_TEXTUAL: 'CLIP_VIT_B_32_TEXTUAL',
  BAAI_BGE_SMALL_EN: 'BAAI_BGE_SMALL_EN',
  THENLPER_GTE_BASE: 'THENLPER_GTE_BASE',
  INTFLOAT_E5_BASE_V2: 'INTFLOAT_E5_BASE_V2',
  MICROSOFT_MPNET_BASE_V2: 'MICROSOFT_MPNET_BASE_V2',
  MULTI_QA_MPNET_BASE_DOT_V1: 'MULTI_QA_MPNET_BASE_DOT_V1',
  BAAI_BGE_BASE_EN: 'BAAI_BGE_BASE_EN',
  THENLPER_GTE_LARGE: 'THENLPER_GTE_LARGE',
  LLMRAILS_EMBER_V1: 'LLMRAILS_EMBER_V1',
  INTFLOAT_E5_LARGE_V2: 'INTFLOAT_E5_LARGE_V2',
  BAAI_BGE_LARGE_EN: 'BAAI_BGE_LARGE_EN',
  JINAAI_EMBEDDINGS_V2_SMALL_EN: 'JINAAI_EMBEDDINGS_V2_SMALL_EN',
  JINAAI_EMBEDDINGS_V2_BASE_EN: 'JINAAI_EMBEDDINGS_V2_BASE_EN',
  OPENAI_ADA_002: 'OPENAI_ADA_002',
  OPENAI_SMALL_3: 'OPENAI_SMALL_3',
  OPENAI_LARGE_3: 'OPENAI_LARGE_3',
  COHERE_ENGLISH_V3_0: 'COHERE_ENGLISH_V3_0',
  COHERE_MULTILINGUAL_V3_0: 'COHERE_MULTILINGUAL_V3_0',
  COHERE_ENGLISH_V2_0: 'COHERE_ENGLISH_V2_0',
  COHERE_ENGLISH_LIGHT_V2_0: 'COHERE_ENGLISH_LIGHT_V2_0',
  COHERE_MULTILINGUAL_V2_0: 'COHERE_MULTILINGUAL_V2_0',
  COHERE_ENGLISH_LIGHT_V3_0: 'COHERE_ENGLISH_LIGHT_V3_0',
  COHERE_MULTILINGUAL_LIGHT_V3_0: 'COHERE_MULTILINGUAL_LIGHT_V3_0',
};

const ImageEmbeddingModels = { CLIP_VIT_B_32_VISUAL: 'CLIP_VIT_B_32_VISUAL' };

const OpenAITextEmbeddingModels = {
  ADA_002: TextEmbeddingModels.OPENAI_ADA_002,
  SMALL_3: TextEmbeddingModels.OPENAI_SMALL_3,
  LARGE_3: TextEmbeddingModels.OPENAI_LARGE_3,
};

const CohereTextEmbeddingModels = {
  ENGLISH_V3_0: TextEmbeddingModels.COHERE_ENGLISH_V3_0,
  MULTILINGUAL_V3_0: TextEmbeddingModels.COHERE_MULTILINGUAL_V3_0,
  ENGLISH_V2_0: TextEmbeddingModels.COHERE_ENGLISH_V2_0,
  ENGLISH_LIGHT_V2_0: TextEmbeddingModels.COHERE_ENGLISH_LIGHT_V2_0,
  MULTILINGUAL_V2_0: TextEmbeddingModels.COHERE_MULTILINGUAL_V2_0,
  ENGLISH_LIGHT_V3_0: TextEmbeddingModels.COHERE_ENGLISH_LIGHT_V3_0,
  MULTILINGUAL_LIGHT_V3_0: TextEmbeddingModels.COHERE_MULTILINGUAL_LIGHT_V3_0,
};

module.exports = {
  TextEmbeddingModels,
  ImageEmbeddingModels,
  OpenAITextEmbeddingModels,
  CohereTextEmbeddingModels,
};
