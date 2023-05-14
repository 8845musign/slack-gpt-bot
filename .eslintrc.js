module.exports = {
  env: {
    'googleappsscript/googleappsscript': true
  },
  extends: [
    'standard',
    'prettier',
    "plugin:googleappsscript/recommended"
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
  },
  plugins: [
    'googleappsscript'
  ]
}
