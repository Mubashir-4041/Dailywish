import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/** Flat ESLint config (ESLint 9 + Next.js 16). */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Server logging uses defensive `no-console` disable comments; the rule
    // isn't enabled, so don't flag those directives as unused.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Intentional hydration flags & event-listener setState in effects.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      'scripts/**',
    ],
  },
];

export default eslintConfig;
