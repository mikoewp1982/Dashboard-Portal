import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "functions/lib/**",
    "scripts/*.js",
    "eslint-report.json",
  ]),
  {
    files: [
      "src/app/dashboard/(with-sidebar)/edulock/admin/page.tsx",
      "src/app/dashboard/(with-sidebar)/edulock/super/page.tsx",
      "src/app/super-admin/database/page.tsx",
      "src/app/dashboard/(with-sidebar)/page.tsx",
      "src/app/dashboard/(with-sidebar)/super/audit/page.tsx",
      "src/app/dashboard/(with-sidebar)/super/broadcast/page.tsx",
      "src/app/dashboard/(with-sidebar)/super/global-config/page.tsx",
      "src/app/dashboard/(with-sidebar)/super/page.tsx",
      "src/app/dashboard/(with-sidebar)/super/service-status/page.tsx",
      "src/app/dashboard/(with-sidebar)/super/support/page.tsx",
      "src/app/dashboard/(with-sidebar)/super/sync-jobs/page.tsx",
      "src/app/dashboard/(with-sidebar)/super/tenants/page.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
