module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	overrides: [{
		files: ['*.ts', '*.tsx'],
		extends: [
			'plugin:@typescript-eslint/recommended',
			'plugin:@typescript-eslint/recommended-requiring-type-checking',
		],
		parserOptions: {
			project: ['./tsconfig.json']
		},
		rules: {
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/require-await": "error",
			"@typescript-eslint/restrict-template-expressions": "off",
			"require-await": "off",
			"@typescript-eslint/no-explicit-any": "off",
		}
	}],
	plugins: [
		'@typescript-eslint',
		'jest',
	],
	extends: [
		'eslint:recommended',
		'plugin:jest/recommended',
	],
};
