import type {
  Schema,
  ValidateOptions,
  InferEnv,
  ValidationResult,
} from "./types.js";
import { runValidation } from "./validate.js";
import { EnvValidationError } from "./errors.js";
import {
  createPrettyReporter,
  createJsonReporter,
  createAnnotationReporter,
} from "./reporters.js";

/**
 * Validates environment variables against a schema. Runs synchronously at startup.
 * Throws EnvValidationError on failure (or exits with 1 if strictCI is true).
 *
 * @example
 * ```ts
 * import { validateEnv } from "dotenv-safe-once";
 * import "dotenv/config";
 *
 * const env = validateEnv({
 *   PORT: { type: "number", required: true },
 *   NODE_ENV: { type: "string", required: true },
 * });
 * // env.PORT is number, env.NODE_ENV is string
 * ```
 */
export function validateEnv<S extends Schema>(
  schema: S,
  options: ValidateOptions = {}
): InferEnv<S> {
  const result = runValidation(schema, options);

  const reporterOption = options.reporter ?? "pretty";

  let reporter: { report: (r: ValidationResult) => void };
  if (reporterOption === "pretty") {
    reporter = createPrettyReporter();
  } else if (reporterOption === "json") {
    reporter = createJsonReporter();
  } else if (
    typeof reporterOption === "object" &&
    typeof (reporterOption as { report?: unknown }).report === "function"
  ) {
    reporter = reporterOption;
  } else {
    reporter = createPrettyReporter();
  }

  if (!result.success) {
    reporter.report(result);
    if (options.annotate) {
      createAnnotationReporter().report(result);
    }
    if (options.strictCI) {
      process.stderr.write(
        "\nCI strict mode violation (strictCI=true) – exiting with code 1.\n"
      );
      process.exit(1);
    }
    throw new EnvValidationError(result.errors);
  }

  return result.env as InferEnv<S>;
}

export type {
  Schema,
  SchemaEntry,
  StringSpec,
  NumberSpec,
  BooleanSpec,
  CustomSpec,
  ValidateOptions,
  InferEnv,
  Reporter,
  ValidationResult,
  ValidationError,
} from "./types.js";
export { EnvValidationError } from "./errors.js";
