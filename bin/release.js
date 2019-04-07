const { executeCommand, getConfig, getPackageJson } = require('../src/utils')
const path = require('path')
const md2json = require('md-2-json')
const fs = require('fs')
const GitHubRelease = require('node-github-release')

const release = (args, cli) => {
  const config = getConfig()
  const packageJson = getPackageJson()
  const files = {
    result: path.resolve(process.cwd(), config.packageName.replace('[version]', packageJson.version)),
    zipResult: path.resolve(process.cwd(), config.packageZipName.replace('[version]', packageJson.version)),
    changelog: path.resolve(process.cwd(), 'CHANGELOG.md')
  }

  if (!fs.existsSync(files.changelog)) {
    throw new Error(`Changelog does not exist at ${files.changelog}`)
  }

  executeCommand('yarn package', !args.quiet)

  if (!args.quiet) console.log('\nGenerating Changelog...')
  const jsonChangelog = md2json.parse(fs.readFileSync(files.changelog, 'utf8'))
  const versions = jsonChangelog['Change Log']
  const versionKey = Object.keys(versions).filter((vers) => {
    return vers.startsWith(`${packageJson.version} `) || vers.startsWith(`[${packageJson.version}](`)
  })[0]
  if (!versionKey) throw new Error(`No changelog version found for ${packageJson.version}`)
  const body = md2json.toMd(versions[versionKey]).replace(/^#/mg, '##')
  const title = `${packageJson.version} ${versionKey.split(' ')[1]}`
  const preRelease = packageJson.version.startsWith('0.')

  if (config.enableSentry) {
    if (!args.quiet) console.log('Sending release commits to Sentry...')
    executeCommand(`sentry-cli releases set-commits --auto ${packageJson.version}`, !args.quiet)
    executeCommand(`sentry-cli releases deploys ${packageJson.version} new -e production`, !args.quiet)
  }

  if (!args.quiet) console.log('Creating release...')
  const release = new GitHubRelease(config.github.apiToken)
  return release.release(config.github.owner, config.github.repo, `v${packageJson.version}`, title, body, undefined,
    false, preRelease).then(() => {
    if (!args.quiet) console.log(`Uploading ${path.basename(files.result)}...`)
    return release.upload(config.github.owner, config.github.repo, `v${packageJson.version}`,
      path.basename(files.result), 'Non-Production Package (zxp)', files.result)
  }).then(() => {
    if (!args.quiet) console.log(`Uploading ${path.basename(files.zipResult)}...`)
    return release.upload(config.github.owner, config.github.repo, `v${packageJson.version}`,
      path.basename(files.zipResult), 'Production Build (zip)', files.zipResult)
  }).then(() => {
    if (!args.quiet) console.log('Complete!')
  })
}

module.exports = release
