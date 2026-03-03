# env-enforce

![runtime size](https://img.shields.io/badge/runtime-~12KB%20JS,_0%20deps-brightgreen)

A zero-dependency, fail-fast environment variable validator for Node.js services. Run once at startup; no global state, no async, no reloading.

- **Production-safe env validation for serious Node services**
- **Zero runtime dependencies**
- **TypeScript** with inferred return types from your schema
- **Sync only** — designed for top-level validation before your app runs
- **Node ≥16**

## Install

```bash
npm install env-enforce
```

## Quick start

Load `.env` with [dotenv](https://www.npmjs.com/package/dotenv) (or similar), then validate:

```ts
import "dotenv/config";
import { validateEnv } from "env-enforce";

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
| `enum`    | `{ type: "enum", values: readonly string[], required?: boolean, default?: string, validate?: (s: string) => true \| string }` | union of values |
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

- **missing** — Declared as required but not present in env (or empty when `allowEmpty` is false).
- **invalid** — Present in env but fails type coercion, enum membership, or custom `validate`.
- **unexpected** — Present in env but not declared in the schema (within the optional `prefix` filter).
- **unused** — Declared in the schema as optional but not set in env (use `allowUnusedOptional` to allow).

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
} from "env-enforce";
import { EnvValidationError } from "env-enforce";
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

**GitHub Actions CI example**

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Validate environment
        run: node dist/index.js
        env:
          # app-specific vars
          APP_PORT: 3000
          APP_ENV: production
          # secrets come from GitHub Actions env
          API_KEY: ${{ secrets.API_KEY }}
```

In a real project you would export a `validateEnv` call from your app’s entrypoint (or a tiny `ci/validate-env` script) and let `strictCI: true` plus `annotate: true` turn failures into a non-zero exit code with inline annotations.

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

| | env-enforce | dotenv-safe | envalid | t3-env |
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
| Runtime size disclosure | ~12 KB JS CommonJS, 0 deps | — | — | — |

**When to use env-enforce**

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
- **Booleans** — By default, `"true"`, `"1"`, `"yes"` → `true`; `"false"`, `"0"`, `"no"`, `""` → `false`. With `strictBooleans: true`, any other value is an error.
- **Numbers** — `Number(raw)`; NaN or empty → missing/invalid as appropriate.
- **Optional keys** — If not set and `allowUnusedOptional` is false, you get an "unused" error. Set `allowUnusedOptional: true` to allow optional keys to be absent.
- **No global state** — Only reads from the provided env object (default `process.env`); does not mutate it.
- **Order of errors** — Schema keys first (missing/invalid/unused), then unexpected env keys. All errors are collected and reported together.

## Performance

- Single pass over schema keys and env keys.
- No I/O; only in-memory checks and small object allocation.
- Suitable for startup; no caching layer.

**Micro-benchmark (example)**

```bash
node -e \"const { validateEnv } = require('./dist'); const schema = { PORT: { type: 'number', default: 3000 }, NODE_ENV: { type: 'string', default: 'production' } }; console.time('validate'); for (let i = 0; i < 100000; i++) validateEnv(schema, { allowUnknown: true, allowUnusedOptional: true }); console.timeEnd('validate');\"
```

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

## Contributing

Contributions are welcome, especially around:

- **Real-world use cases**: new examples, CI setups, and edge cases.
- **DX improvements**: clearer error messages, better docs, tiny ergonomic wins.
- **Performance and robustness**: micro-optimisations that keep the code simple.

### Development workflow

- **Requirements**: Node ≥16, npm.
- **Install**:

```bash
git clone https://github.com/decept1kon/env-enforce.git
cd env-enforce
npm install
```

- **Build & test**:

```bash
npm run build
npm run test:smoke
npm test
```

### Pull requests

- Keep the **API surface minimal** and **zero-dependency** at runtime.
- Prefer small, focused PRs with a short motivation in the description.
- Include tests for new behavior and update the README where relevant.

## License

MIT
