import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".next/**",
    ".build/**",
    "node_modules/**",
    "out/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
