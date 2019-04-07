const { getConfig, executeCommand } = require('../src/utils')
const path = require('path')
const fs = require('fs')
const ncp = require('ncp')

const deployLocal = (args, cli) => {
  const config = getConfig()

  return new Promise((resolve, reject) => {
    const directories = {
      build: path.resolve(process.cwd(), 'build'),
      target: path.resolve(config.buildTarget)
    }

    executeCommand('yarn build', !args.quiet)

    if (!fs.existsSync(directories.target)) {
      fs.mkdirSync(directories.target)
    }

    ncp(directories.build, directories.target, {}, (err) => {
      if (err)
        reject(err)
      else
        resolve()
    })
  })
}

module.exports = deployLocal
