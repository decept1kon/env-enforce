# Contributing to env-enforce

Contributions are welcome. This project aims to stay minimal, zero-dependency at runtime, and sync-only for startup validation.

## What we’re especially interested in

- **Real-world use cases**: new examples, CI setups, edge cases
- **DX improvements**: clearer error messages, better docs, small ergonomic wins
- **Performance and robustness**: micro-optimisations that keep the code simple

## Development setup

- **Requirements**: Node ≥16, npm

```bash
git clone https://github.com/Decept1kon/env-enforce.git
cd env-enforce
npm install
```

**Build & test:**

```bash
npm run build
npm run test:smoke
npm test
```

## Pull requests

- Keep the **API surface minimal** and **zero runtime dependencies**.
- Prefer small, focused PRs with a short motivation in the description.
- Add tests for new behavior and update the README where relevant.

## License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers this project.
