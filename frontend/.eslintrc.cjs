/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
    './.eslintrc-auto-import.json',
    'standard',
  ],
  rules: {
    'jsx-quotes': [2, 'prefer-double'],
    'comma-dangle': [2, 'always-multiline'],
    'no-irregular-whitespace': 1,
    '@typescript-eslint/ban-ts-comment': [
      'error',
      { 'ts-ignore': 'allow-with-description' },
    ],
  },
  overrides: [
    {
      files: [
        'cypress/e2e/*.{spec,e2e}.{js,ts,jsx,tsx}',
        'cypress/support/*.{js,ts,jsx,tsx}',
        'src/**/*.{ct,cy}.{js,ts,jsx,tsx}',
      ],
      extends: [
        'plugin:cypress/recommended',
      ],
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
}
