/**
 * Schema entry for string environment variables.
 */
export interface StringSpec {
  readonly type: "string";
  readonly required?: boolean;
  /** Default value when missing (and not overridden by env). */
  readonly default?: string;
  /** If true, empty string is valid; if false, empty is treated as missing. Default: false */
  readonly allowEmpty?: boolean;
  /** Return true to accept, or a string error message to reject. */
  readonly validate?: (value: string) => true | string;
}

/**
 * Schema entry for number environment variables.
 */
export interface NumberSpec {
  readonly type: "number";
  readonly required?: boolean;
  /** Default value when missing (and not overridden by env). */
  readonly default?: number;
  readonly validate?: (value: number) => true | string;
}

/**
 * Schema entry for boolean environment variables.
 * Accepts: "true", "1", "yes" (true); "false", "0", "no", "" (false).
 */
export interface BooleanSpec {
  readonly type: "boolean";
  readonly required?: boolean;
  /** Default value when missing (and not overridden by env). */
  readonly default?: boolean;
  readonly validate?: (value: boolean) => true | string;
}

/**
 * Fixed string enum type.
 */
export interface EnumSpec {
  readonly type: "enum";
  /** Allowed values (case-sensitive). */
  readonly values: readonly string[];
  readonly required?: boolean;
  /** Default value when missing (and not overridden by env). */
  readonly default?: string;
  /** Additional validation hook after enum check. */
  readonly validate?: (value: string) => true | string;
}

/**
 * Custom parser/validator. Receives raw string (or undefined if missing).
 * Should return the typed value on success, or throw on failure.
 * Additional checks can be implemented via the optional `validate` hook,
 * which should return `true` to accept or a string error message to reject.
 */
export interface CustomSpec<T = unknown> {
  readonly type: "custom";
  readonly required?: boolean;
  /** Default value when missing (and not overridden by env). */
  readonly default?: T;
  readonly parse: (raw: string | undefined) => T;
  readonly validate?: (value: T) => true | string;
}

export type SchemaEntry =
  | StringSpec
  | NumberSpec
  | BooleanSpec
  | EnumSpec
  | CustomSpec<unknown>;

export type Schema = Record<string, SchemaEntry>;

/** Options for validateEnv(). */
export interface ValidateOptions {
  /** Only consider environment variables whose names start with this prefix when checking for unexpected keys. */
  prefix?: string;
  /** Allow environment variables not declared in the schema. Default: false */
  allowUnknown?: boolean;
  /** Do not report "unused" for optional keys that are not set. Default: false */
  allowUnusedOptional?: boolean;
  /** Global default for allowEmpty on string keys (per-key overrides). Default: false */
  allowEmpty?: boolean;
  /** Treat unknown boolean strings as invalid rather than coercing to false. Default: false */
  strictBooleans?: boolean;
  /** On validation failure, call process.exit(1). For CI. Default: false */
  strictCI?: boolean;
  /** Reporter: "pretty" | "json" | custom. Default: "pretty" */
  reporter?: "pretty" | "json" | Reporter;
  /** Emit GitHub Actions workflow command (file:line) for errors. Default: false */
  annotate?: boolean;
  /** Source env object (default: process.env). Used for testing. */
  env?: NodeJS.ProcessEnv;
}

export interface Reporter {
  report(result: ValidationResult): void;
}

export type ValidationResult =
  | { success: true; env: Record<string, unknown> }
  | { success: false; errors: ValidationError[] };

export interface ValidationError {
  kind: "missing" | "unexpected" | "unused" | "invalid";
  key: string;
  message: string;
  /** For annotate: optional file path (e.g. path to file that references the var). */
  file?: string;
  line?: number;
}

/** Infer the validated env object type from a schema. */
export type InferEnv<S extends Schema> = {
  [K in keyof S]: S[K] extends StringSpec
    ? string
    : S[K] extends NumberSpec
      ? number
      : S[K] extends BooleanSpec
        ? boolean
        : S[K] extends EnumSpec
          ? S[K]["values"][number]
          : S[K] extends CustomSpec<infer T>
            ? T
            : never;
};
