import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/*.spec.ts", "**/*.e2e-spec.ts"],
  moduleNameMapper: {
    "^file-type$": "<rootDir>/test/__mocks__/file-type.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/test/jest.setup.ts"],
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  restoreMocks: true,
  testTimeout: 30_000,
  forceExit: true,
};

export default config;
