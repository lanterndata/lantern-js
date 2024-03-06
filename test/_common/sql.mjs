const books = {
  createTable: `
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      name TEXT,
      url TEXT,
      embedding REAL[]
    )
  `,
  dropTable: `DROP TABLE IF EXISTS books`,
  createIndexDef: 'CREATE INDEX IF NOT EXISTS book_index ON books USING lantern_hnsw(embedding dist_l2sq_ops)',
  createIndex768: `
    CREATE INDEX IF NOT EXISTS book_index ON books USING lantern_hnsw(embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dim=768);
  `,
  createIndex512: `
    CREATE INDEX IF NOT EXISTS book_index ON books USING lantern_hnsw(embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dim=512);
  `,
  dropIndex: 'DROP INDEX book_index',
};

const movies = {
  createTable: `
    CREATE TABLE IF NOT EXISTS movies (
      id SERIAL PRIMARY KEY,
      name TEXT,
      url TEXT,
      embedding INT[]
    )
  `,
  dropTable: 'DROP TABLE IF EXISTS movies',
  createIndexDef: 'CREATE INDEX IF NOT EXISTS movie_index ON movies USING lantern_hnsw(embedding dist_hamming_ops)',
};

export default { books, movies };
