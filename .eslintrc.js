module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['airbnb-base', 'prettier'],
  overrides: [
    {
      files: ['*.js', '*.mjs'],
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    indent: ['error', 2],
    eqeqeq: 'off',
    camelcase: [0, { properties: 'never' }],
    'no-console': 'off',
    'func-names': 'off',
    'consistent-return': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'default-case': 'off',
    'no-underscore-dangle': 'off',
    'brace-style': 'off',
    'import/no-unresolved': 'off',
    'no-nested-ternary': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'object-curly-spacing': [
      2,
      'always',
      {
        objectsInObjects: true,
        arraysInObjects: true,
      },
    ],
    'function-call-argument-newline': ['error', 'consistent'],
  },
};
