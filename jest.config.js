import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset({
  useESM: true,
}).transform;

/** @type {import("jest").Config} **/
export default {
  preset: 'ts-jest/presets/default-esm', // Handles the foundational ESM settings
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'], // Tells Jest to treat your TypeScript files as ES Modules
  transform: {
    ...tsJestTransformCfg, // Applies the default ts-jest ESM transform rules safely
  },
};
