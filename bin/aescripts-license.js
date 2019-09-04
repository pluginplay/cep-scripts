const { executeCommand } = require('../src/utils')
const path = require('path')
const fs = require('fs')

String.prototype.replaceAndEnforce = function (find, replace) {
  const oldLength = this.length
  const result = this.replace(find, replace)
  if (result.length === oldLength) {
    throw new Error(`Expected to replace '${find}' with '${replace}', but didn't.`)
  }
  return result
}

const aescriptsLicense = (args, cli) => {
  const files = {
    vendor: path.resolve(process.cwd(), 'src/vendor'),
    aesp: path.resolve(process.cwd(), 'aescripts/aesp.js'),
    custom: path.resolve(process.cwd(), 'aescripts/custom'),
    dialog: path.resolve(process.cwd(), 'aescripts/dialog'),
    static: path.resolve(process.cwd(), 'static'),
    packageJson: path.resolve(process.cwd(), 'aescripts/package.json')
  }

  const keysToCheck = ['aesp', 'custom', 'dialog', 'packageJson']
  keysToCheck.forEach((key) => {
    if (!fs.existsSync(files[key])) {
      throw new Error(`Path '${files[key]}' does not exist. Please copy the aescripts license bundle to ` +
        'the aescripts directory inside the root of this project.')
    }
  })

  if (!args.quiet) console.log('CREATE src/vendor')
  if (!fs.existsSync(files.vendor)) {
    fs.mkdirSync(files.vendor)
  }

  if (!args.quiet) console.log('TRANSFORM src/vendor/aesp.js')
  let contents = fs.readFileSync(files.aesp, 'utf8')
    .replaceAndEnforce('A.appendChild(I),document.head.appendChild(A)', 'A.appendChild(I)')
    .replaceAndEnforce('i.id=A,document.head.appendChild(i)', 'i.id=A')
  contents = `/* eslint-disable */\nconst Ajv = require('ajv')\n\n${contents}\n\nmodule.exports = Aesp\n`

  if (!args.quiet) console.log('WRITE src/vendor/aesp.js')
  fs.writeFileSync(path.join(files.vendor, 'aesp.js'), contents, 'utf8')

  if (!args.quiet) console.log('COPY custom -> static/custom')
  executeCommand(`cp -r ${files.custom} ${files.static}/`)

  if (!args.quiet) console.log('COPY dialog -> static/dialog')
  executeCommand(`cp -r ${files.dialog} ${files.static}/`)

  if (!args.quiet) console.log('\nReading package.json...')
  const packageJson = require(files.packageJson)
  const packages = Object.keys(packageJson.dependencies).map((dep) => {
    return `${dep}@${packageJson.dependencies[dep]}`
  }).join(' ')

  executeCommand(`yarn add ${packages}`, !args.quiet)

  if (!args.quiet) console.log('Installing dependent packages...')
  executeCommand('yarn add ajv', !args.quiet)

  if (!args.quiet) console.log('\n\nComplete!')
  if (!args.quiet) console.log('Please refer to the adding-aescripts.md file for more information on what to do now.')
}

module.exports = aescriptsLicense
