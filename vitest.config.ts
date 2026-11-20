import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
            '@': `${import.meta.dirname}/src`,
        },
    },
    test: {
        environment: 'happy-dom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'manifest.config.test.ts'],
    },
})
