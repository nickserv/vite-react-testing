const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const resolve = require('resolve')

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

/**
 * Get additional module paths based on the baseUrl of a compilerOptions object.
 *
 * @param {Object} options
 */
function getAdditionalModulePaths(options = {}) {
  const baseUrl = options.baseUrl

  if (!baseUrl) {
    return ''
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl)

  // We don't need to do anything if `baseUrl` is set to `node_modules`. This is
  // the default behavior.
  if (path.relative(paths.appNodeModules, baseUrlResolved) === '') {
    return null
  }

  // Allow the user set the `baseUrl` to `appSrc`.
  if (path.relative(paths.appSrc, baseUrlResolved) === '') {
    return [paths.appSrc]
  }

  // If the path is equal to the root directory we ignore it here.
  // We don't want to allow importing from the root directly as source files are
  // not transpiled outside of `src`. We do allow importing them with the
  // absolute path (e.g. `src/Components/Button.js`) but we set that up with
  // an alias.
  if (path.relative(paths.appPath, baseUrlResolved) === '') {
    return null
  }

  // Otherwise, throw an error.
  throw new Error(
    chalk.red.bold(
      "Your project's `baseUrl` can only be set to `src` or `node_modules`." +
        ' Create React App does not support other values at this time.'
    )
  )
}

/**
 * Get webpack aliases based on the baseUrl of a compilerOptions object.
 *
 * @param {*} options
 */
function getWebpackAliases(options = {}) {
  const baseUrl = options.baseUrl

  if (!baseUrl) {
    return {}
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl)

  if (path.relative(paths.appPath, baseUrlResolved) === '') {
    return {
      src: paths.appSrc
    }
  }
}

/**
 * Get jest aliases based on the baseUrl of a compilerOptions object.
 *
 * @param {*} options
 */
function getJestAliases(options = {}) {
  const baseUrl = options.baseUrl

  if (!baseUrl) {
    return {}
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl)

  if (path.relative(paths.appPath, baseUrlResolved) === '') {
    return {
      '^src/(.*)$': '<rootDir>/src/$1'
    }
  }
}

function getModules() {
  // Check if TypeScript is setup
  const hasTsConfig = fs.existsSync(paths.appTsConfig)
  const hasJsConfig = fs.existsSync(paths.appJsConfig)

  if (hasTsConfig && hasJsConfig) {
    throw new Error(
      'You have both a tsconfig.json and a jsconfig.json. If you are using TypeScript please remove your jsconfig.json file.'
    )
  }

  let config

  // If there's a tsconfig.json we assume it's a
  // TypeScript project and set up the config
  // based on tsconfig.json
  if (hasTsConfig) {
    const ts = require(resolve.sync('typescript', {
      basedir: paths.appNodeModules
    }))
    config = ts.readConfigFile(paths.appTsConfig, ts.sys.readFile).config
    // Otherwise we'll check if there is jsconfig.json
    // for non TS projects.
  } else if (hasJsConfig) {
    config = require(paths.appJsConfig)
  }

  config = config || {}
  const options = config.compilerOptions || {}

  const additionalModulePaths = getAdditionalModulePaths(options)

  return {
    additionalModulePaths: additionalModulePaths,
    webpackAliases: getWebpackAliases(options),
    jestAliases: getJestAliases(options),
    hasTsConfig
  }
}

const modules = getModules()

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
  modulePaths: modules.additionalModulePaths || [],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    ...(modules.jestAliases || {})
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
