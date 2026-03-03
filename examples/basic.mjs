/**
 * Basic usage (run after dotenv has loaded).
 * Node run: node examples/basic.mjs
 * Set env: PORT=3000 NODE_ENV=development node examples/basic.mjs
 */
import { validateEnv } from "../dist/index.js";

const env = validateEnv(
  {
    PORT: { type: "number", required: true },
    NODE_ENV: { type: "string", required: true },
    DEBUG: { type: "boolean", required: false },
  },
  { allowUnknown: true, allowUnusedOptional: true }
);

console.log("Valid env:", env);
// env.PORT is number, env.NODE_ENV is string, env.DEBUG is boolean
