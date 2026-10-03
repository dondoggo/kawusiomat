export default [
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**', 'sw.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                setInterval: 'readonly',
                AudioContext: 'readonly',
                requestAnimationFrame: 'readonly',
                performance: 'readonly',
                console: 'readonly',
                Promise: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-const-assign': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-unreachable': 'warn',
            'eqeqeq': ['warn', 'always'],
            'no-implicit-globals': 'error',
            'no-redeclare': 'error',
            'no-shadow': 'warn',
            'prefer-arrow-callback': 'warn',
            'prefer-template': 'warn',
            'no-eval': 'error',
            'no-implied-eval': 'error'
        }
    },
    {
        files: ['sw.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                self: 'readonly',
                caches: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                Promise: 'readonly'
            }
        },
        rules: {
            'no-undef': 'error',
            'no-var': 'error',
            'prefer-const': 'warn',
            'eqeqeq': ['warn', 'always']
        }
    }
];
