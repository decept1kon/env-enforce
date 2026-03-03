/**
 * CI mode: exit with code 1 on failure, optional GitHub Actions annotations.
 * Usage: node examples/ci-mode.mjs
 * In GHA: node examples/ci-mode.mjs with annotate: true to get file:line annotations.
 */
import { validateEnv } from "../dist/index.js";

validateEnv(
  {
    PORT: { type: "number", required: true },
    NODE_ENV: { type: "string", required: true },
  },
  {
    strictCI: true,
    annotate: process.env.GITHUB_ACTIONS === "true",
    reporter: "json",
  }
);

console.log("Validation passed.");
