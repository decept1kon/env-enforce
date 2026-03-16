# Security Policy

## Supported Versions

We aim to support the latest minor versions of `env-enforce`:

- `1.x` – **actively supported**

Older versions may continue to work, but only the latest `1.x` will receive security-related fixes.

## Reporting a Vulnerability

If you discover a security vulnerability in `env-enforce`:

1. **Do not open a public GitHub issue** with details.
2. Instead, please report it privately by opening a new GitHub issue with a minimal description and marking it as a security concern, or by describing it briefly and asking for a private contact channel.

Please include:

- A clear description of the issue.
- Steps to reproduce, if possible.
- The impact you believe it has (e.g. DoS, data leak, config bypass).
- The version(s) of `env-enforce` and Node.js you’re using.

We will:

- Acknowledge receipt of your report as soon as possible.
- Investigate and validate the issue.
- Work on a fix and coordinate a release.
- Credit you in the release notes, unless you prefer to remain anonymous.

## Scope

`env-enforce` is a small, sync-only library that validates environment variables at startup. Security issues in **downstream applications** using this library are out of scope unless they are directly caused by a defect in `env-enforce` itself.
