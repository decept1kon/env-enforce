import type {
  Schema,
  SchemaEntry,
  ValidateOptions,
  ValidationError as ValidationErrorType,
  ValidationResult,
} from "./types.js";

const BOOLEAN_TRUE = new Set(["true", "1", "yes"]);
const BOOLEAN_FALSE = new Set(["false", "0", "no", ""]);

function parseBoolean(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  const lower = raw.toLowerCase().trim();
  if (BOOLEAN_TRUE.has(lower)) return true;
  if (BOOLEAN_FALSE.has(lower)) return false;
  return false;
}

function parseNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return n;
}

function runValidate<T>(value: T, validate: (v: T) => true | string): true | string {
  try {
    return validate(value);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

function parseEntry(
  key: string,
  spec: SchemaEntry,
  raw: string | undefined,
  options: ValidateOptions
): { value?: unknown; error?: ValidationErrorType } {
  const required = spec.required !== false;
  const globalAllowEmpty = options.allowEmpty ?? false;
  const strictBooleans = options.strictBooleans ?? false;

  if (spec.type === "string") {
    const s = raw ?? "";
    const allowEmpty = spec.allowEmpty ?? globalAllowEmpty;
    const hasDefault = Object.prototype.hasOwnProperty.call(spec, "default");

    // Missing or empty handling with default support
    if (s === "") {
      if (hasDefault) {
        const value = spec.default as string;
        if (spec.validate) {
          const v = runValidate(value, spec.validate);
          if (v !== true) return { error: { kind: "invalid", key, message: v } };
        }
        return { value };
      }
      if (!allowEmpty) {
        if (required) {
          return {
            error: {
              kind: "missing",
              key,
              message: `Required environment variable "${key}" is missing or empty.`,
            },
          };
        }
        return { value: undefined };
      }
      // allowEmpty: true, no default
      const v = spec.validate ? runValidate("", spec.validate) : true;
      if (v !== true) return { error: { kind: "invalid", key, message: v } };
      return { value: "" };
    }
    if (spec.validate) {
      const v = runValidate(s, spec.validate);
      if (v !== true) return { error: { kind: "invalid", key, message: v } };
    }
    return { value: s };
  }

  if (spec.type === "number") {
    const hasDefault = Object.prototype.hasOwnProperty.call(spec, "default");
    const n = parseNumber(raw);
    if (n === null) {
      if ((raw === undefined || raw === "") && hasDefault) {
        const value = spec.default as number;
        if (spec.validate) {
          const v = runValidate(value, spec.validate);
          if (v !== true) return { error: { kind: "invalid", key, message: v } };
        }
        return { value };
      }
      if (required && (raw === undefined || raw === "")) {
        return {
          error: {
            kind: "missing",
            key,
            message: `Required environment variable "${key}" is missing or not a number.`,
          },
        };
      }
      if (raw !== undefined && raw !== "") {
        return {
          error: {
            kind: "invalid",
            key,
            message: `"${key}" must be a number, got: ${raw}`,
          },
        };
      }
      return { value: undefined };
    }
    if (spec.validate) {
      const v = runValidate(n, spec.validate);
      if (v !== true) return { error: { kind: "invalid", key, message: v } };
    }
    return { value: n };
  }

  if (spec.type === "boolean") {
    const hasDefault = Object.prototype.hasOwnProperty.call(spec, "default");

    if (raw === undefined) {
      if (hasDefault) {
        const value = spec.default as boolean;
        if (spec.validate) {
          const v = runValidate(value, spec.validate);
          if (v !== true) return { error: { kind: "invalid", key, message: v } };
        }
        return { value };
      }
      // Missing boolean defaults to false (as before).
      const b = false;
      if (spec.validate) {
        const v = runValidate(b, spec.validate);
        if (v !== true) return { error: { kind: "invalid", key, message: v } };
      }
      return { value: b };
    }

    const lower = raw.toLowerCase().trim();
    if (
      strictBooleans &&
      !BOOLEAN_TRUE.has(lower) &&
      !BOOLEAN_FALSE.has(lower)
    ) {
      return {
        error: {
          kind: "invalid",
          key,
          message: `"${key}" must be a boolean (true/false/1/0/yes/no), got: ${raw}`,
        },
      };
    }

    const b = parseBoolean(raw);
    if (spec.validate) {
      const v = runValidate(b, spec.validate);
      if (v !== true) return { error: { kind: "invalid", key, message: v } };
    }
    return { value: b };
  }

  if (spec.type === "enum") {
    const hasDefault = Object.prototype.hasOwnProperty.call(spec, "default");
    const allowed = spec.values;

    let value: string | undefined;
    const s = raw ?? "";
    if (s === "" && hasDefault) {
      value = spec.default as string;
    } else if (s === "") {
      if (required) {
        return {
          error: {
            kind: "missing",
            key,
            message: `Required environment variable "${key}" is missing or empty.`,
          },
        };
      }
      value = undefined;
    } else {
      value = s;
    }

    if (value !== undefined && !allowed.includes(value)) {
      return {
        error: {
          kind: "invalid",
          key,
          message: `"${key}" must be one of ${allowed.join(" | ")}, got: ${value}`,
        },
      };
    }

    if (value !== undefined && spec.validate) {
      const v = runValidate(value, spec.validate);
      if (v !== true) return { error: { kind: "invalid", key, message: v } };
    }

    return { value };
  }

  if (spec.type === "custom") {
    const hasDefault = Object.prototype.hasOwnProperty.call(spec, "default");
    try {
      let value: unknown;
      if (raw === undefined && hasDefault) {
        value = spec.default as unknown;
      } else {
        value = spec.parse(raw);
      }
      if (required && value === undefined && raw === undefined) {
        return { error: { kind: "missing", key, message: `Required environment variable "${key}" is missing.` } };
      }
      if (spec.validate && value !== undefined) {
        const v = runValidate(value, spec.validate);
        if (v !== true) return { error: { kind: "invalid", key, message: v } };
      }
      return { value };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { error: { kind: "invalid", key, message } };
    }
  }

  return { error: { kind: "invalid", key, message: `Unknown schema type for "${key}".` } };
}

export function runValidation(
  schema: Schema,
  options: ValidateOptions
): ValidationResult {
  const env = options.env ?? process.env;
  const allowUnknown = options.allowUnknown ?? false;
  const prefix = options.prefix;
  const errors: ValidationErrorType[] = [];
  const result: Record<string, unknown> = {};

  const defaultFile = options.errorLocation?.file;
  const defaultLine = options.errorLocation?.line;

  function pushError(err: ValidationErrorType) {
    errors.push({
      ...err,
      file: err.file ?? defaultFile,
      line: err.line ?? defaultLine,
    });
  }

  const schemaKeys = new Set(Object.keys(schema));
  const envKeys = new Set(
    Object.keys(env).filter((key) => !prefix || key.startsWith(prefix))
  );

  for (const key of schemaKeys) {
    const spec = schema[key];
    const raw = env[key];
    const out = parseEntry(key, spec, raw, options);
    if (out.error) {
      pushError(out.error);
    } else if (out.value !== undefined) {
      result[key] = out.value;
    } else {
      const required = spec.required !== false;
      const allowUnusedOptional = options.allowUnusedOptional ?? false;
      if (!required && !allowUnusedOptional) {
        pushError({
          kind: "unused",
          key,
          message: `Declared variable "${key}" is not set in environment.`,
        });
      }
    }
  }

  if (!allowUnknown) {
    for (const key of envKeys) {
      if (!schemaKeys.has(key)) {
        pushError({
          kind: "unexpected",
          key,
          message: `Unexpected environment variable "${key}" (not in schema).`,
        });
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }
  return { success: true, env: result };
}
