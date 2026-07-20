import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "functions/lib/**",
      "scripts/*.js",
      "eslint-report.json",
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
];

export default eslintConfig;

