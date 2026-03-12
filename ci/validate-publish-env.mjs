import { validateEnv } from "../dist/index.js";

validateEnv(
  {
    NODE_AUTH_TOKEN: {
      type: "string",
      required: true,
      validate: (s) =>
        s.length > 0 ? true : "NODE_AUTH_TOKEN must be set for npm publish",
    },
    NODE_ENV: {
      type: "string",
      required: false,
      default: "production",
    },
  },
  {
    strictCI: true,
    reporter: "pretty",
    annotate: true,
    allowUnknown: true,
  }
);

