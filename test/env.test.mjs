/**
 * Test suite – uses Node 18+ built-in test runner.
 * Usage: npm run build && npm test
 */
import test from "node:test";
import assert from "node:assert";
import { validateEnv, EnvValidationError } from "../dist/index.js";

test("success: returns typed env with string, number, boolean", () => {
  const env = validateEnv(
    {
      PORT: { type: "number", required: true },
      NODE_ENV: { type: "string", required: true },
      DEBUG: { type: "boolean", required: false },
    },
    {
      env: { PORT: "4000", NODE_ENV: "test", DEBUG: "1" },
      allowUnknown: true,
      allowUnusedOptional: true,
    }
  );
  assert.strictEqual(env.PORT, 4000);
  assert.strictEqual(env.NODE_ENV, "test");
  assert.strictEqual(env.DEBUG, true);
});

test("missing required: throws with kind missing", () => {
  assert.throws(
    () =>
      validateEnv(
        { REQUIRED: { type: "string", required: true } },
        { env: {} }
      ),
    (e) => {
      return e instanceof EnvValidationError && e.errors.some((err) => err.kind === "missing" && err.key === "REQUIRED");
    }
  );
});

test("invalid number: throws with kind invalid", () => {
  assert.throws(
    () =>
      validateEnv(
        { X: { type: "number", required: true } },
        { env: { X: "abc" } }
      ),
    (e) => e instanceof EnvValidationError && e.errors.some((err) => err.kind === "invalid" && err.key === "X")
  );
});

test("unexpected env var when allowUnknown false", () => {
  assert.throws(
    () =>
      validateEnv(
        { A: { type: "string", required: true } },
        { env: { A: "a", EXTRA: "x" } }
      ),
    (e) => e instanceof EnvValidationError && e.errors.some((err) => err.kind === "unexpected" && err.key === "EXTRA")
  );
});

test("allowUnknown: does not throw for extra vars", () => {
  const env = validateEnv(
    { ONLY: { type: "string", required: true } },
    { env: { ONLY: "ok", EXTRA: "ignored" }, allowUnknown: true }
  );
  assert.strictEqual(env.ONLY, "ok");
});

test("unused optional: error when allowUnusedOptional false", () => {
  assert.throws(
    () =>
      validateEnv(
        { OPT: { type: "string", required: false } },
        { env: {}, allowUnknown: true }
      ),
    (e) => e instanceof EnvValidationError && e.errors.some((err) => err.kind === "unused" && err.key === "OPT")
  );
});

test("unused optional: no error when allowUnusedOptional true", () => {
  const env = validateEnv(
    { OPT: { type: "string", required: false } },
    { env: {}, allowUnknown: true, allowUnusedOptional: true }
  );
  assert.strictEqual(env.OPT, undefined);
});

test("custom parser: returns typed value", () => {
  const env = validateEnv(
    {
      COUNT: {
        type: "custom",
        required: true,
        parse: (raw) => {
          const n = Number(raw);
          if (Number.isNaN(n) || n < 0) throw new Error("must be non-negative number");
          return n;
        },
      },
    },
    { env: { COUNT: "42" }, allowUnknown: true }
  );
  assert.strictEqual(env.COUNT, 42);
});

test("validate function: reject with message", () => {
  assert.throws(
    () =>
      validateEnv(
        {
          API_KEY: {
            type: "string",
            required: true,
            validate: (s) => (s.length >= 8 ? true : "too short"),
          },
        },
        { env: { API_KEY: "short" } }
      ),
    (e) => e instanceof EnvValidationError && e.errors.some((err) => err.kind === "invalid" && err.message === "too short")
  );
});

test("allowEmpty: empty string valid when allowEmpty true", () => {
  const env = validateEnv(
    { EMPTY: { type: "string", required: true, allowEmpty: true } },
    { env: { EMPTY: "" }, allowUnknown: true }
  );
  assert.strictEqual(env.EMPTY, "");
});

test("reporter json: does not crash on failure", () => {
  assert.throws(
    () =>
      validateEnv(
        { X: { type: "string", required: true } },
        { env: {}, reporter: "json" }
      ),
    EnvValidationError
  );
});

test("annotate option: does not crash on failure", () => {
  assert.throws(
    () =>
      validateEnv(
        { X: { type: "string", required: true } },
        { env: {}, annotate: true }
      ),
    EnvValidationError
  );
});
