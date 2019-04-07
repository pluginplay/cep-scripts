const { executeCommand, getConfig, getPackageJson } = require('../src/utils')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const zip = require('zip-folder')

const packagePlugin = (args, cli) => {
  const config = getConfig()
  const packageJson = getPackageJson()
  const files = {
    build: path.join(process.cwd(), 'build'),
    ucf: path.join(__dirname, '../resource/ucf.jar'),
    keystore: path.resolve(process.cwd(), 'signing', 'certificate', `${config.certificateName}.p12`),
    result: path.resolve(process.cwd(), config.packageName.replace('[version]', packageJson.version)),
    debugFile: path.resolve(process.cwd(), 'build', '.debug'),
    zipResult: path.resolve(process.cwd(), config.packageZipName.replace('[version]', packageJson.version))
  }

  if (!fs.existsSync(files.keystore)) {
    throw new Error(`Keystore does not exist at ${files.keystore}.`)
  }

  executeCommand('yarn build', !args.quiet)

  const sourcemapPromise = new Promise((resolve, reject) => {
    if (!args.quiet) {
      console.info('Removing sourcemaps...')
    }
    rimraf(path.join(files.build, '*.map'), {}, (err) => {
      if (err)
        reject(err)
      else
        resolve()
    })
  })

  return sourcemapPromise.then(() => {
    if (!args.quiet) {
      console.info('Removing debug file...')
    }
    fs.unlinkSync(files.debugFile)

    if (!args.quiet) {
      console.info('Packaging...')
    }
    executeCommand(`java -jar "${files.ucf}" -package -storetype "PKCS12" -keystore "${files.keystore}" -storepass "${config.certificatePassword}" "${files.result}" -C "${files.build}" .`, false)

    if (!args.quiet) {
      console.info('Zipping...')
    }
    const zipPromise = new Promise((resolve, reject) => {
      zip(files.build, files.zipResult, (err) => {
        if (err)
          reject(err)
        else
          resolve()
      })
    })

    return zipPromise
  }).then(() => {
    if (!args.quiet) {
      console.info('Packaged!')
    }
  })
}

module.exports = packagePlugin
