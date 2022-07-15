const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')

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
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
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

const paths = {
  appPath: resolveApp('.'),
  appSrc: resolveApp('src'),
  appTsConfig: resolveApp('tsconfig.json'),
  appJsConfig: resolveApp('jsconfig.json'),
  testsSetup: resolveModule(resolveApp, 'src/setupTests'),
  appNodeModules: resolveApp('node_modules')
}

const setupTestsMatches = paths.testsSetup.match(/src[/\\]setupTests\.(.+)/)
const setupTestsFileExtension =
  (setupTestsMatches && setupTestsMatches[1]) || 'js'
const setupTestsFile = fs.existsSync(paths.testsSetup)
  ? `<rootDir>/src/setupTests.${setupTestsFileExtension}`
  : undefined

module.exports = {
  roots: ['<rootDir>/src'],

  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],

  setupFiles: [require.resolve('whatwg-fetch')],

  setupFilesAfterEnv: setupTestsFile ? [setupTestsFile] : [],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': require.resolve('babel-jest'),
    '^.+\\.css$': require.resolve('./cssTransform.js'),
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)':
      require.resolve('./fileTransform.js')
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs|cjs|ts|tsx)$',
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
  resetMocks: true
}
