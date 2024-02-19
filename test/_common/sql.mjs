const books = {
  createTable: `
    CREATE TABLE books (
      id SERIAL PRIMARY KEY,
      name TEXT,
      url TEXT,
      embedding REAL[]
    )
  `,
  dropTable: `DROP TABLE IF EXISTS books`,
  createIndexDef: 'CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)',
  createIndex768: `
    CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dim=768);
  `,
  createIndex512: `
    CREATE INDEX book_index ON books USING hnsw(embedding dist_l2sq_ops)
    WITH (M=2, ef_construction=10, ef=4, dim=512);
  `,
  dropIndex: 'DROP INDEX book_index',
};

const movies = {
  createTable: `
    CREATE TABLE movies (
      id SERIAL PRIMARY KEY,
      name TEXT,
      url TEXT,
      embedding INT[]
    )
  `,
  dropTable: 'DROP TABLE IF EXISTS movies',
  createIndexDef: 'CREATE INDEX movie_index ON movies USING hnsw(embedding dist_hamming_ops)',
}

export default { books, movies };