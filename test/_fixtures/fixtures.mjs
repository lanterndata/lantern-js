export const imageUrl = process.env.TEST_IMAGE_EMBEDDING_EXAMPLE_URL;

export const newBooks = [
  {
    embedding: [1, 1, 1],
    name: 'Harry Potter',
    url: imageUrl,
  },
  {
    embedding: [2, 2, 2],
    name: 'Greek Myths',
    url: imageUrl,
  },
  {
    embedding: [1, 1, 2],
  },
  { embedding: null },
];

export const newMovies = [
  {
    embedding: [1, 1, 1],
  },
  {
    embedding: [2, 2, 2],
  },
  {
    embedding: [1, 1, 2],
  },
  { embedding: null },
];

const array768Dim = new Array(768).fill(1);
const array512Dim = new Array(512).fill(1);

export const newBooks768Dim = [
  { embedding: array768Dim, name: 'Harry Potter', url: imageUrl },
  { embedding: array768Dim, name: 'Greek Myths', url: imageUrl },
];

export const newBooks512Dim = [
  { embedding: array512Dim, name: 'Harry Potter', url: imageUrl },
  { embedding: array512Dim, name: 'Greek Myths', url: imageUrl },
];
