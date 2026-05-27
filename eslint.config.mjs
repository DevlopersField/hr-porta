import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["lib/db/**", "lib/uploads.ts", "scripts/**", "app/api/uploads/**", "app/api/health/route.ts", "**/*.test.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          { name: "fs", message: "Filesystem access only allowed in lib/db/* — use the data layer." },
          { name: "fs/promises", message: "Filesystem access only allowed in lib/db/* — use the data layer." },
          { name: "node:fs", message: "Filesystem access only allowed in lib/db/* — use the data layer." },
          { name: "node:fs/promises", message: "Filesystem access only allowed in lib/db/* — use the data layer." },
        ],
      }],
    },
  },
]);

export default eslintConfig;
