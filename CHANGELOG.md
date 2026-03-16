# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-03-16

### Added
- `errorLocation` option to attach default `file`/`line` to all validation errors.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- GitHub issue templates for bug reports and feature requests.

### Changed
- README badges (npm version/downloads, CI status, license).
- README docs to mention new options and CI usage.

## [1.0.1] - 2026-03-12

### Added
- GitHub Actions workflow to publish to npm on `v*.*.*` tags.
- CI example using `env-enforce` to validate `NODE_AUTH_TOKEN` before publish.
- `@types/node` as a dev dependency for better TypeScript support.

### Changed
- Documentation polish and alignment between README and implementation.
- Package `exports` field for better Node/bundler compatibility.

## [1.0.0] - 2026-03-12

### Added
- Initial release of `env-enforce`.
- `validateEnv(schema, options)` with:
  - String, number, boolean, enum, and custom specs.
  - Options for `allowUnknown`, `allowUnusedOptional`, `allowEmpty`, `strictBooleans`, `strictCI`, `reporter`, `annotate`, and custom `env`.
- Pretty, JSON, and GitHub Actions annotation reporters.
- `EnvValidationError` and full TypeScript typings (`Schema`, `InferEnv`, etc.).

