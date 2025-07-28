import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@libs/(.*)$': '<rootDir>/../../libs/$1',
    '^@common/(.*)$': '<rootDir>/../../libs/common/src/$1',
  },
  testEnvironment: 'node',
};

export default config;
