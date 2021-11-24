module.exports = {
  root: true,
  env: {
    node: true
  },
  "extends": [
    "plugin:vue/essential",
    "@vue/standard"
  ],
  rules: {
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    quotes: [
      "error",
      "double",
      {
        avoidEscape: true,
        allowTemplateLiterals: true
      }
    ],
    semi: [
      "error",
      "never"
    ],
    "no-extra-semi": "off",
    "no-extend-native": "off",
    "no-unused-expressions": "off",
    "node/no-deprecated-api": "off",
    "no-new": "off"
  },
  parserOptions: {
    parser: "babel-eslint"
  }
}
