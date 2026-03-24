const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

const copyRecursive = (sourceRelativePath) => {
  const source = path.join(rootDir, sourceRelativePath)
  const destination = path.join(distDir, sourceRelativePath)

  if (!fs.existsSync(source)) {
    return
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.cpSync(source, destination, { recursive: true, force: true })
}

copyRecursive('src/data')
copyRecursive('src/logs')
copyRecursive('.env')
