const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // HACK: Jest's resolver struggles with the 'exports' map in some packages like 'groq-sdk'.
    // This manually maps the required shim to its full path within the pnpm structure.
    // This may need to be updated if the groq-sdk version changes.
    '^groq-sdk/shims/node$': '<rootDir>/../node_modules/.pnpm/groq-sdk@0.34.0/node_modules/groq-sdk/shims/node.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!groq-sdk|cheerio|cheerio-select|css-select|css-what|domhandler|domutils|htmlparser2|ts-dedent).+\\.js$',
  ],
  preset: 'ts-jest',
}

module.exports = createJestConfig(customJestConfig)
