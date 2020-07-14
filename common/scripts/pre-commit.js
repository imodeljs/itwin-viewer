const lintStaged = require("lint-staged");
return lintStaged({debug: true, config: {
  "*.{ts,tsx}": [
    "node ./copyright-linter.js --",
    "node --max_old_space_size=4096 ./node_modules/eslint/bin/eslint.js --config ../config/.eslintrc.ts.autofix.json --ignore-path ..//config/.eslintignore --fix",
    "prettier --write --config ../../.prettierrc --ignore-path ../../.prettierignore",
    "node --max_old_space_size=4096 ./node_modules/eslint/bin/eslint.js --config ../config/.eslintrc.ts.json --ignore-path ../config/.eslintignore --color"
  ],
  "*.{md,json}": [
    "prettier --write --config ../../.prettierrc --ignore-path ../../.prettierignore"
  ],
  "*.{scss,css}": [
    "node ../config/scripts/copyright-linter.js --",
    "stylelint --fix --config ../../.stylelintrc"
  ]
}});

