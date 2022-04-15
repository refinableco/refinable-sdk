import type { Config } from "@jest/types";
import { defaults } from "jest-config";

const config: Config.InitialOptions = {
  ...defaults,
  testEnvironment: "node",
  transform: {
    '^.+\\.(t|j)sx?$': '@swc-node/jest',
  },
  testTimeout: 999999,
  verbose: true,
  moduleFileExtensions: [...defaults.moduleFileExtensions, "ts", "json", "js"],
  transformIgnorePatterns: ["node_modules/(?!variables/.*)"],
  clearMocks: true,
};

export default config;
