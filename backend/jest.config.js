export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['<rootDir>/tests/setup.js'],
  testTimeout: 20000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1.js',
  },
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
