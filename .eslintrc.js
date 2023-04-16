module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    mocha: true,
  },
  plugins: ["@typescript-eslint"],
  extends: ["standard", "prettier", "plugin:node/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    "import/no-duplicates": ["warn"],
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] },
    ],
    "node/no-unpublished-require": ["warn"],
    "node/no-unpublished-import": ["warn"],
    "node/no-missing-import": ["warn"],
    "no-lone-blocks": ["off"],
    "no-unused-vars": ["warn"],
  },
  settings: {
    node: { tryExtensions: [".js", ".json", ".node", ".ts", ".d.ts"] },
  },
};
