#!/usr/bin/env node

const yargs = require('yargs')
const { cond, equals } = require('ramda')
const { configExists } = require('../src/utils')
const deployLocal = require('./deploy-local')
const aescriptsLicense = require('./aescripts-license')
const packagePlugin = require('./package')
const release = require('./release')

const cli = yargs
  .usage('Usage: $0 <command> [options]')
  .help(false)
  .option('help', {
    description: 'Show help',
    boolean: true,
    default: false,
    global: true
  })
  .option('quiet', {
    description: 'Disable console output of CLI commands',
    boolean: true,
    default: false,
    global: true
  })
  .option('debug', {
    description: 'Run in debug mode',
    boolean: true,
    default: false,
    global: true
  })
  .command('deploy-local', 'Build the project and deploy locally')
  .command('aescripts-licensing', 'Prepare AEScripts licensing and add it to your project')
  .command('package', 'Package and sign your project')
  .command('release', 'Package, sign, and release to Github your project')
  .wrap(null)

const args = cli.argv
const command = args._[0]
const root = process.cwd()

if (!configExists(root)) {
  throw new Error('No build configuration could be found for CEP Scripts. Create a file at the root of ' +
    'the project called \'cep-scripts.json\'\n\nThere is an example available in the cep-scripts repository.')
}

process.on('unhandledRejection', (err) => {
  if (!args.quiet) {
    console.error('')
    console.error(err)
  }

  process.exit(1)
})

if (args.help) {
  cli.showHelp()
  process.exit(0)
}

const result = cond([
  [equals('deploy-local'), () => deployLocal(args, cli)],
  [equals('aescripts-licensing'), () => aescriptsLicense(args, cli)],
  [equals('package'), () => packagePlugin(args, cli)],
  [equals('release'), () => release(args, cli)]
])(command)

if (result) {
  result.then(() => {
    process.exit(0)
  })
} else {
  cli.showHelp()
}
