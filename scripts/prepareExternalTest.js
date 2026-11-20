const fs = require('fs')
const path = require('path')

// Operate only in the CI checkout; never silently build against production.
const configPath = path.resolve(__dirname, '..', 'common', 'config.js')
const original = fs.readFileSync(configPath, 'utf8')
const source = 'CURRENT_ENVIRONMENT: ENVIRONMENT.STABLE'
if (original.split(source).length !== 2) throw new Error('无法唯一定位正式环境配置')
if (!original.includes("DEV_OUTSIDE: 'http://52.67.128.45:2009'")) throw new Error('外测接口地址与预期不符')
fs.writeFileSync(configPath, original.replace(source, 'CURRENT_ENVIRONMENT: ENVIRONMENT.DEV_OUTSIDE'))
console.log('External test configuration selected')
