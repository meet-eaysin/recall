import { config } from '@repo/jest-config/base';
import type { Config } from 'jest';

const jestConfig: Config = {
  ...config,
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@repo/storage/(.*)$': '<rootDir>/src/$1',
  },
};

export default jestConfig;
