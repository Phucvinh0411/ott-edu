import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // BẠN THÊM KHỐI NÀY VÀO ĐÂY
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // Override default ignores of eslint-config-next.
    ignores: [ // Lưu ý: Trong phiên bản ESLint mới, thuộc tính này tên là 'ignores'
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
]);

export default eslintConfig;