const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function digestTree(root) {
  const rootInfo = fs.lstatSync(root)
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) throw new Error('Runner dependency source must be a real directory')
  const entries = []
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name
      const full = path.join(dir, entry.name)
      if (entry.isSymbolicLink()) throw new Error('Runner dependencies must not contain symbolic links')
      if (entry.isDirectory()) walk(full, name)
      else if (entry.isFile()) entries.push(name)
      else throw new Error('Unsupported dependency entry')
    }
  }
  walk(root)
  if (!entries.length) throw new Error('Runner dependencies are empty')
  const hash = crypto.createHash('sha256')
  for (const name of entries.sort()) {
    const data = fs.readFileSync(path.join(root, ...name.split('/')))
    hash.update(`${Buffer.byteLength(name)}:${name}:${data.length}:`)
    hash.update(data)
  }
  return hash.digest('hex')
}

if (process.argv[2] === '--hash') {
  if (!process.argv[3]) throw new Error('Missing source directory')
  console.log(digestTree(path.resolve(process.argv[3])))
} else {
  const source = String(process.env.FCPG_UNI_MODULES_SOURCE || '').trim()
  if (!source) throw new Error('Missing FCPG_UNI_MODULES_SOURCE')
  const target = path.resolve(__dirname, '..', 'uni_modules')
  const expected = fs.readFileSync(path.join(__dirname, 'uni-modules.sha256'), 'utf8').trim()
  if (!/^[0-9a-f]{64}$/.test(expected) || digestTree(path.resolve(source)) !== expected) throw new Error('Runner dependencies do not match the pinned snapshot')
  if (fs.existsSync(target)) throw new Error('Checkout uni_modules already exists; refusing to overwrite')
  fs.cpSync(path.resolve(source), target, { recursive: true, errorOnExist: true, force: false })
  if (digestTree(target) !== expected) throw new Error('Copied dependency snapshot failed verification')
  console.log('Pinned uni_modules snapshot prepared')
}
