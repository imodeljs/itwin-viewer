const lintStaged = require("lint-staged");

module.exports = async function(){
  const ret = await lintStaged({debug: true, config: {
    "*.{ts,tsx}": [
      "node ./common/scripts/copyright-linter.js --",
      "node --max_old_space_size=4096 ./common/scripts/node_modules/eslint/bin/eslint.js --config ./common/scripts/.eslintrc.ts.autofix.json --ignore-path ./.eslintignore --fix",
      "prettier --write --config ./.prettierrc --ignore-path ./.prettierignore",
      "node --max_old_space_size=4096 ./common/scripts/node_modules/eslint/bin/eslint.js --config ./common/scripts/.eslintrc.ts.json --ignore-path ./.eslintignore --color"
    ],
    "*.{md,json}": [
      "prettier --write --config ./.prettierrc --ignore-path ./.prettierignore"
    ],
    "*.{scss,css}": [
      "node ./common/scripts/copyright-linter.js --",
      "stylelint --fix --config ./.stylelintrc"
    ]
  }});

console.log("ret");
console.log(ret);
}

