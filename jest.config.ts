import type { Config } from "@jest/types";
import { defaults } from "jest-config";

const config: Config.InitialOptions = {
  ...defaults,
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "node_modules/variables/.+\\.(j|t)sx?$": "ts-jest",
  },
  testTimeout: 999999,
  verbose: true,
  moduleFileExtensions: [...defaults.moduleFileExtensions, "ts", "json", "js"],
  transformIgnorePatterns: ["node_modules/(?!variables/.*)"],
  setupFiles: ["./tests/setup.jest.ts"],
  clearMocks: true,
};

export default config;
