module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/packages'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@eldercare/domain(.*)$': '<rootDir>/packages/domain/src$1',
    '^@eldercare/contracts(.*)$': '<rootDir>/packages/contracts/src$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'packages/domain/src/**/*.ts',
    'apps/api/src/**/*.ts',
    'apps/worker/src/**/*.ts',
    '!**/*.d.ts',
  ],
};
