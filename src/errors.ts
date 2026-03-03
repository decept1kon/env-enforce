import type { ValidationError as ValidationErrorType } from "./types.js";

/**
 * Thrown when validation fails. Contains all collected errors.
 * Not thrown when strictCI is true (process exits instead).
 */
export class EnvValidationError extends Error {
  readonly errors: readonly ValidationErrorType[];

  constructor(errors: readonly ValidationErrorType[]) {
    const first = errors[0];
    const summary =
      errors.length === 1
        ? first.message
        : `${errors.length} validation error(s): ${first.key} - ${first.message}`;
    super(summary);
    this.name = "EnvValidationError";
    this.errors = errors;
    Object.setPrototypeOf(this, EnvValidationError.prototype);
  }
}
