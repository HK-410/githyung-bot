module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['bld', 'chr', 'doc', 'ftr', 'fix', 'prf', 'rfc', 'rvt', 'sty', 'tst', 'mod', 'add', 'rmv'],
    ],
  },
};
