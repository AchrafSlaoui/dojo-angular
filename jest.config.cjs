module.exports = {
  preset: 'jest-preset-angular',
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  // Coverage settings: always collect and print a summary to console
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/app/**/*.{ts,tsx}',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/app/app.module.ts',
    '!<rootDir>/src/app/app.config.ts',
    '!<rootDir>/**/index.ts',
    '!<rootDir>/**/*.d.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  transform: {
    '^.+\\.(ts|js|mjs|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },
  resolver: 'jest-preset-angular/build/resolvers/ng-jest-resolver',
  testEnvironment: 'jest-preset-angular/environments/jest-jsdom-env',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@clients/(.*)$': '<rootDir>/src/app/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
};
