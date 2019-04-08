const path = require('path')
const { execSync } = require('child_process')

const configExists = (root) => {
  const configPath = path.join(root, 'cep-scripts.json')
  try {
    require(configPath)
    return true
  } catch (err) {
    return false
  }
}

const getConfig = () => {
  const configPath = path.join(process.cwd(), 'cep-scripts.json')
  return require(configPath)
}

const getPackageJson = () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  return require(packageJsonPath)
}

const executeCommand = (command, outputCommand = true) => {
  if (outputCommand) {
    console.info(`$ ${command}`)
  }
  const result = execSync(command, { cwd: process.cwd(), env: process.env }).toString()
  if (result && outputCommand) {
    console.log(result)
  }
  return result
}

module.exports = { configExists, getConfig, executeCommand, getPackageJson }
