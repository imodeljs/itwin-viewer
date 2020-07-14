const lintStaged = require("lint-staged");
console.log("linting");
lintStaged({debug: true, config: {
  "*.{ts,tsx}": [
    "node ../../../common/scripts/copyright-linter.js --",
    "node --max_old_space_size=4096 ./node_modules/eslint/bin/eslint.js --config ../../../common/config/.eslintrc.ts.autofix.json --ignore-path ../../../common/config/.eslintignore --fix",
    "prettier --write --config ../../../.prettierrc --ignore-path ../../../.prettierignore",
    "node --max_old_space_size=4096 ./node_modules/eslint/bin/eslint.js --config ../../../common/config/.eslintrc.ts.json --ignore-path ../../../common/config/.eslintignore --color"
  ],
  "*.{md,json}": [
    "prettier --write --config ../../../.prettierrc --ignore-path ../../../.prettierignore"
  ],
  "*.{scss,css}": [
    "node ../../../common/config/scripts/copyright-linter.js --",
    "stylelint --fix --config ../../../.stylelintrc"
  ]
}});

