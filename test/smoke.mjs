/**
 * Smoke test – runs on Node 16+, no node:test required.
 * Usage: npm run build && node test/smoke.mjs
 */
import assert from "node:assert";
import { validateEnv, EnvValidationError } from "../dist/index.js";

let passed = 0;

// 1. Success: valid env returns typed object
{
  const env = validateEnv(
    {
      PORT: { type: "number", required: true },
      NODE_ENV: { type: "string", required: true },
    },
    { env: { PORT: "3000", NODE_ENV: "development" }, allowUnknown: true }
  );
  assert.strictEqual(env.PORT, 3000);
  assert.strictEqual(env.NODE_ENV, "development");
  passed++;
}

// 2. Failure: missing required throws EnvValidationError
{
  try {
    validateEnv(
      { FOO: { type: "string", required: true } },
      { env: {} }
    );
    assert.fail("expected EnvValidationError");
  } catch (e) {
    assert(e instanceof EnvValidationError);
    assert(Array.isArray(e.errors));
    assert(e.errors.some((err) => err.kind === "missing" && err.key === "FOO"));
  }
  passed++;
}

// 3. Failure: invalid number
{
  try {
    validateEnv(
      { PORT: { type: "number", required: true } },
      { env: { PORT: "not-a-number" } }
    );
    assert.fail("expected EnvValidationError");
  } catch (e) {
    assert(e instanceof EnvValidationError);
    assert(e.errors.some((err) => err.kind === "invalid" && err.key === "PORT"));
  }
  passed++;
}

// 4. Boolean parsing
{
  const env = validateEnv(
    { FLAG: { type: "boolean", required: true } },
    { env: { FLAG: "true" }, allowUnknown: true }
  );
  assert.strictEqual(env.FLAG, true);
  passed++;
}

// 5. Unexpected env var (when allowUnknown false)
{
  try {
    validateEnv(
      { A: { type: "string", required: true } },
      { env: { A: "a", B: "b" } }
    );
    assert.fail("expected EnvValidationError");
  } catch (e) {
    assert(e instanceof EnvValidationError);
    assert(e.errors.some((err) => err.kind === "unexpected" && err.key === "B"));
  }
  passed++;
}

console.log("Smoke test: %d/%d passed", passed, 5);
console.log("OK");
