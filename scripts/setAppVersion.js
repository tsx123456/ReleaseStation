const fs = require('fs')
const path = require('path')

const manifestPath = path.resolve(__dirname, '..', 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const runNumber = Number(process.env.GITHUB_RUN_NUMBER || 0)
const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT || 1)
const currentCode = Number(manifest.versionCode || 0)
const requestedCode = Number(process.env.APP_VERSION_CODE || 0)
const pipelineCode = runNumber > 0 ? runNumber * 10 + Math.max(runAttempt, 1) + 100 : 0
const versionCode = requestedCode > 0
  ? requestedCode
  : Math.max(currentCode + 1, pipelineCode)
const versionName = String(
  process.env.APP_VERSION_NAME ||
  (runNumber > 0 ? `1.0.${runNumber}` : manifest.versionName || '1.0.0')
).trim()

if (!Number.isInteger(versionCode) || versionCode <= currentCode || versionCode > 2147483647) {
  throw new Error(`versionCode 必须是大于 ${currentCode} 且不超过 Android 上限的整数，当前为 ${versionCode}`)
}
if (!versionName) throw new Error('versionName 不能为空')

manifest.versionCode = String(versionCode)
manifest.versionName = versionName
if (manifest['app-plus']?.useragent?.value) {
  manifest['app-plus'].useragent.value = `DCloud-App/${versionName}`
}
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`, 'utf8')
console.log(`App version prepared: ${versionName} (${versionCode})`)
