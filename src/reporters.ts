import type { ValidationResult, ValidationError } from "./types.js";

const KIND_LABELS: Record<ValidationError["kind"], string> = {
  missing: "Missing",
  unexpected: "Unexpected",
  unused: "Unused",
  invalid: "Invalid",
};

function formatAnnotation(err: ValidationError): string {
  const file = err.file ?? "env";
  const line = err.line ?? 1;
  const msg = err.message.replace(/\r?\n/g, " ");
  return `::error file=${file},line=${line}::${err.key}: ${msg}`;
}

export function createPrettyReporter(): {
  report(result: ValidationResult): void;
} {
  return {
    report(result: ValidationResult): void {
      if (result.success) return;
      const lines: string[] = [];
      lines.push("");
      lines.push("  \u2716 Environment validation failed");
      lines.push("");
      for (const err of result.errors) {
        const label = KIND_LABELS[err.kind];
        lines.push(`    \u2022 [${label}] ${err.key}`);
        lines.push(`      ${err.message}`);
      }
      lines.push("");
      process.stderr.write(lines.join("\n") + "\n");
    },
  };
}

export function createJsonReporter(): { report(result: ValidationResult): void } {
  return {
    report(result: ValidationResult): void {
      if (result.success) return;
      const payload = JSON.stringify(
        { success: false, errors: result.errors },
        null,
        2
      );
      process.stderr.write(payload + "\n");
    },
  };
}

export function createAnnotationReporter(): {
  report(result: ValidationResult): void;
} {
  return {
    report(result: ValidationResult): void {
      if (result.success) return;
      for (const err of result.errors) {
        process.stderr.write(formatAnnotation(err) + "\n");
      }
    },
  };
}
