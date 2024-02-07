const TextEmbeddingModels = {
  MICROSOFT_MINILM_L12_V2: 'microsoft/all-MiniLM-L12-v2',
  CLIP_VIT_B_32_TEXTUAL: 'clip/ViT-B-32-textual',
  BAAI_BGE_SMALL_EN: 'BAAI/bge-small-en',
  THENLPER_GTE_BASE: 'thenlper/gte-base',
  INTFLOAT_E5_BASE_V2: 'intfloat/e5-base-v2',
  MICROSOFT_MPNET_BASE_V2: 'microsoft/all-mpnet-base-v2',
  MULTI_QA_MPNET_BASE_DOT_V1: 'transformers/multi-qa-mpnet-base-dot-v1',
  BAAI_BGE_BASE_EN: 'BAAI/bge-base-en',
  THENLPER_GTE_LARGE: 'thenlper/gte-large',
  LLMRAILS_EMBER_V1: 'llmrails/ember-v1',
  INTFLOAT_E5_LARGE_V2: 'intfloat/e5-large-v2',
  BAAI_BGE_LARGE_EN: 'BAAI/bge-large-en',
  JINAAI_EMBEDDINGS_V2_SMALL_EN: 'jinaai/jina-embeddings-v2-small-en',
  JINAAI_EMBEDDINGS_V2_BASE_EN: 'jinaai/jina-embeddings-v2-base-en',
  OPENAI_TEXT_EMBEDDING_ADA_002: 'openai/text-embedding-ada-002',
  COHERE_EMBED_ENGLISH_V3_0: 'cohere/embed-english-v3.0',
  COHERE_EMBED_MULTILINGUAL_V3_0: 'cohere/embed-multilingual-v3.0',
  COHERE_EMBED_ENGLISH_V2_0: 'cohere/embed-english-v2.0',
  COHERE_EMBED_ENGLISH_LIGHT_V2_0: 'cohere/embed-english-light-v2.0',
  COHERE_EMBED_MULTILINGUAL_V2_0: 'cohere/embed-multilingual-v2.0',
  COHERE_EMBED_ENGLISH_LIGHT_V3_0: 'cohere/embed-english-light-v3.0',
  COHERE_EMBED_MULTILINGUAL_LIGHT_V3_0: 'cohere/embed-multilingual-light-v3.0',
};

const ImageEmbeddingModels = {
  CLIP_VIT_B_32_VISUAL: 'clip/ViT-B-32-visual',
};

module.exports = {
  TextEmbeddingModels,
  ImageEmbeddingModels,
};
