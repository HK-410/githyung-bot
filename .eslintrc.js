module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    project: ['./tsconfig.json', './core/tsconfig.json', './packages/x-bot-toolkit/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json', './core/tsconfig.json', './packages/x-bot-toolkit/tsconfig.json'],
      },
    },
  },
  rules: {
    // Add any specific rules here
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'import/no-unresolved': 'error',
  },
  overrides: [
    {
      files: ['core/**/*.{ts,tsx}'],
      extends: ['next/core-web-vitals'],
      rules: {
        // Override or add Next.js specific rules if needed
      }
    }
  ]
};
