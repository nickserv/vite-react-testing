import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

function isInGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

function isInMercurialRepository() {
  try {
    execSync('hg --cwd . root', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

const hasSourceControl = isInGitRepository() || isInMercurialRepository()

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebook/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'json',
  'web.jsx',
  'jsx'
]

// Resolve file paths in the same order as webpack
const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find((extension) =>
    fs.existsSync(resolveFn(`${filePath}.${extension}`))
  )

  if (extension) {
    return resolveFn(`${filePath}.${extension}`)
  }

  return resolveFn(`${filePath}.js`)
}

const testsSetup = resolveModule(resolveApp, 'src/setupTests')

const setupTestsMatches = testsSetup.match(/src[/\\]setupTests\.(.+)/)
const setupTestsFileExtension =
  (setupTestsMatches && setupTestsMatches[1]) || 'js'
const setupTestsFile = fs.existsSync(testsSetup)
  ? `<rootDir>/src/setupTests.${setupTestsFileExtension}`
  : undefined

export default {
  roots: ['<rootDir>/src'],

  collectCoverageFrom: ['src/**/*.{js,jsx}'],

  setupFiles: ['whatwg-fetch'],

  setupFilesAfterEnv: setupTestsFile ? [setupTestsFile] : [],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}'
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|mjs|cjs)$': 'babel-jest',
    '^.+\\.css$': './cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|cjs|css|json)$)': './fileTransform.js'
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs|cjs)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy'
  },
  moduleFileExtensions: [...moduleFileExtensions, 'node'].filter(
    (ext) => !ext.includes('mjs')
  ),
  watch: !!process.env.CI && hasSourceControl,
  watchAll: !!process.env.CI && !hasSourceControl,
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  resetMocks: true,
  extensionsToTreatAsEsm: ['.web.mjs', '.web.js', '.json', '.web.jsx', '.jsx']
}
