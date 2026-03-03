/**
 * Typical app entry: load dotenv first, then validate.
 */
import "dotenv/config";
import { validateEnv } from "../dist/index.js";

const env = validateEnv(
  {
    PORT: { type: "number", required: true },
    NODE_ENV: { type: "string", required: true },
    API_KEY: {
      type: "string",
      required: true,
      validate: (s) => (s.length >= 32 ? true : "API_KEY must be at least 32 characters"),
    },
  },
  { allowUnknown: true }
);

console.log("Listening on port", env.PORT);
