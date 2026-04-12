// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/lib/**/*.test.ts', '**/__tests__/api/**/*.test.ts'],
      transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
      setupFiles: ['<rootDir>/jest.setup.ts'],
    },
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/components/**/*.test.tsx'],
      transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
      setupFiles: ['<rootDir>/jest.setup.ts'],
      setupFilesAfterEnv: ['@testing-library/jest-dom'],
    },
  ],
}

export default config
