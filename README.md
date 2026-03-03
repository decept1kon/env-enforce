# dotenv-safe-once

A zero-dependency, fail-fast environment variable validator for Node.js services. Run once at startup; no global state, no async, no reloading.

- **Production-safe env validation for serious Node services**
- **Zero runtime dependencies**
- **TypeScript** with inferred return types from your schema
- **Sync only** — designed for top-level validation before your app runs
- **Node ≥16**

## Install

```bash
npm install dotenv-safe-once
```

## Quick start

Load `.env` with [dotenv](https://www.npmjs.com/package/dotenv) (or similar), then validate:

```ts
import "dotenv/config";
import { validateEnv } from "dotenv-safe-once";

const env = validateEnv({
  PORT: { type: "number", required: true },
  NODE_ENV: { type: "string", required: true },
  DEBUG: { type: "boolean", required: false },
});

// env is typed: { PORT: number; NODE_ENV: string; DEBUG: boolean }
console.log(env.PORT);
```

If a required variable is missing or invalid, `validateEnv` throws immediately with clear errors.

## API

### `validateEnv(schema, options?)`

Validates `process.env` (or `options.env`) against `schema`. Returns a typed object on success; on failure runs the reporter, then throws `EnvValidationError` (or exits with `1` if `strictCI` is true).

**Schema entry types**

| Type       | Spec shape | Inferred type |
|-----------|------------|----------------|
| `string`  | `{ type: "string", required?: boolean, default?: string, allowEmpty?: boolean, validate?: (s: string) => true \| string }` | `string` |
| `number`  | `{ type: "number", required?: boolean, default?: number, validate?: (n: number) => true \| string }` | `number` |
| `boolean` | `{ type: "boolean", required?: boolean, default?: boolean, validate?: (b: boolean) => true \| string }` | `boolean` |
| `custom`  | `{ type: "custom", required?: boolean, default?: T, parse: (raw: string \| undefined) => T, validate?: (v: T) => true \| string }` | `T` |

- **`required`** — Default `true`. Set `required: false` for optional keys.
- **`default`** — Per-key default value when env is missing/empty (used before `validate`).
- **`allowEmpty`** (string only) — If `true`, empty string is valid; otherwise empty is treated as missing.
- **`validate`** — Return `true` to accept, or a string error message to reject.

**Options**

| Option | Default | Description |
|--------|---------|-------------|
| `prefix` | `undefined` | Only consider env vars whose names start with this prefix for unexpected checks. |
| `allowUnknown` | `false` | Allow env vars not declared in the schema. |
| `allowUnusedOptional` | `false` | Do not report "unused" for optional keys that are not set. |
| `allowEmpty` | `false` | Global default for string `allowEmpty`. |
| `strictBooleans` | `false` | Treat unknown boolean strings as invalid instead of coercing to `false`. |
| `strictCI` | `false` | On failure, call `process.exit(1)`. |
| `reporter` | `"pretty"` | `"pretty"` \| `"json"` \| `{ report(result): void }`. |
| `annotate` | `false` | Emit GitHub Actions `::error file=...,line=...::` lines. |
| `env` | `process.env` | Source object (e.g. for tests). |

**Error kinds**

- **missing** — Required variable absent or empty (when `allowEmpty` is false).
- **invalid** — Parse or custom `validate` failed.
- **unexpected** — Present in env but not in schema (when `allowUnknown` is false).
- **unused** — Declared in schema but not set (optional keys; use `allowUnusedOptional` to allow).

### Types

```ts
import type {
  Schema,
  StringSpec,
  NumberSpec,
  BooleanSpec,
  CustomSpec,
  ValidateOptions,
  InferEnv,
  Reporter,
  ValidationResult,
  ValidationError,
} from "dotenv-safe-once";
import { EnvValidationError } from "dotenv-safe-once";
```

## Examples

**Custom validator**

```ts
validateEnv({
  API_KEY: {
    type: "string",
    required: true,
    validate: (s) => (s.length >= 32 ? true : "API_KEY must be at least 32 characters"),
  },
});
```

**Custom parser (e.g. URL)**

```ts
validateEnv({
  BASE_URL: {
    type: "custom",
    required: true,
    parse: (raw) => {
      if (!raw) throw new Error("BASE_URL is required");
      const u = new URL(raw);
      if (!["http:", "https:"].includes(u.protocol)) throw new Error("BASE_URL must be http or https");
      return u;
    },
  },
});
```

**CI with exit code and JSON**

```ts
validateEnv(schema, { strictCI: true, reporter: "json" });
```

**GitHub Actions annotations**

```ts
validateEnv(schema, { annotate: true });
// Emits ::error file=env,line=1::VAR_NAME: message
```

**Prefix mode (only check your app's vars)**

```ts
const env = validateEnv(
  {
    APP_PORT: { type: "number", default: 3000 },
    APP_ENV: { type: "string", required: true },
  },
  {
    prefix: "APP_",
    allowUnknown: false, // still fail on unexpected APP_* vars
  }
);
```

This lets you ignore system-level env like `PATH` or `HOME` while still being strict about your service-specific `APP_` variables.

**Strict booleans**

```ts
validateEnv(
  { FEATURE_X: { type: "boolean", required: true } },
  {
    env: { FEATURE_X: "yep" },
    strictBooleans: true, // throws: invalid boolean
  }
);
```

With `strictBooleans: true`, only `true/false/1/0/yes/no` (case-insensitive) and empty string are accepted.

**Defaults**

```ts
const env = validateEnv({
  PORT: { type: "number", default: 3000 },
  LOG_LEVEL: { type: "string", required: false, default: "info" },
  FEATURE_X: { type: "boolean", default: false },
});

// If PORT is unset, env.PORT is 3000.
// If LOG_LEVEL is unset, env.LOG_LEVEL is "info".
// Defaults still go through any validate() functions you define.
```

## Comparison with other tools

| | dotenv-safe-once | dotenv-safe | envalid | t3-env |
|--|------------------|-------------|---------|--------|
| Dependencies | 0 | dotenv | 0 | zod |
| Parses .env file | No | Yes | No | No |
| Typed schema → inferred env | Yes | No | Yes | Yes |
| Fail on missing required | Yes | Yes | Yes | Yes |
| Unexpected env (not in schema) | Yes (configurable) | Yes | No (by default) | — |
| Unused declared (declared, not set) | Yes (configurable) | No | No | — |
| Prefix mode for app vars | Yes | No | No | No |
| Custom validator per key | Yes | No | Yes | Via Zod |
| Sync only / startup-only | Yes | Yes | Yes | Yes |
| CI exit code option | Yes | No | No | — |
| GHA annotation output | Yes | No | No | — |
| Runtime size disclosure | ~12 KB JS in dist, 0 deps | — | — | — |

**When to use dotenv-safe-once**

- You already load env with `dotenv` and only want validation.
- You want strict checks (missing + invalid + unexpected + unused) with a tiny mental model.
- You want zero deps and no Zod/Joi in your runtime.
- You need CI-friendly startup guards (non-zero exit code, annotations) without heavyweight schema engines.

**Compared to envalid**

- Smaller surface area: one main function, no helpers, no global state.
- Stricter by default on **unexpected** and **unused** keys (configurable).
- **Prefix mode** and **GitHub Actions annotations** built-in.
- Zero deps and no assumptions about how you load `.env` (dotenv, SSM, Vault, etc. all work).

## Edge cases

- **Empty string** — For `string`, empty is treated as missing unless `allowEmpty: true` (per-key or global).
- **Booleans** — `"true"`, `"1"`, `"yes"` → `true`; `"false"`, `"0"`, `"no"`, `""` → `false`. Anything else is effectively false (no error); use `validate` if you want to reject invalid values.
- **Numbers** — `Number(raw)`; NaN or empty → missing/invalid as appropriate.
- **Optional keys** — If not set and `allowUnusedOptional` is false, you get an "unused" error. Set `allowUnusedOptional: true` to allow optional keys to be absent.
- **No global state** — Only reads from the provided env object (default `process.env`); does not mutate it.
- **Order of errors** — Schema keys first (missing/invalid/unused), then unexpected env keys. All errors are collected and reported together.

## Performance

- Single pass over schema keys and env keys.
- No I/O; only in-memory checks and small object allocation.
- Suitable for startup; no caching layer.

## Future extension ideas

- **`default`** — Per-key default when missing (optional keys).
- **`file`/`line` in errors** — From call stack or optional option for better annotations.
- **Allowlist of unexpected keys** — e.g. allow `LANG` and `PATH` but no others.
- **Coerce mode** — e.g. trim strings, normalize booleans, without changing the core “fail-fast” contract.

## Testing

Zero extra test dependencies; uses Node built-ins.

```bash
# Smoke test (Node 16+)
npm run test:smoke

# Full suite (Node 18+)
npm test
```

## License

MIT
