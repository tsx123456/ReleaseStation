const fs = require('fs')
const path = require('path')

const apkPath = path.resolve(process.argv[2] || '')
if (!process.argv[2] || !fs.existsSync(apkPath)) {
  throw new Error('用法: node scripts/publishRelease.js <apk-path>')
}
if (!apkPath.toLowerCase().endsWith('.apk')) throw new Error('发布文件必须是 APK')

const apiURL = String(process.env.APP_RELEASE_API_URL || '').trim()
const token = String(process.env.APP_RELEASE_TOKEN || '').trim()
if (!apiURL || !token) throw new Error('必须设置 APP_RELEASE_API_URL 和 APP_RELEASE_TOKEN')
if (typeof fetch !== 'function' || typeof FormData !== 'function' || typeof Blob !== 'function') {
  throw new Error('发布脚本需要 Node.js 18 或更高版本')
}

const manifestPath = path.resolve(__dirname, '..', 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const android = manifest['app-plus']?.distribute?.android || {}
const stat = fs.statSync(apkPath)
const form = new FormData()
const append = (name, value) => form.append(name, String(value ?? ''))

append('platform', process.env.APP_PLATFORM || 'android')
append('channel', process.env.APP_CHANNEL || 'official')
append('packageId', process.env.APP_PACKAGE_ID || android.packagename || android.package || 'uni.app.UNI2BD90B9')
append('versionName', process.env.APP_VERSION_NAME || manifest.versionName)
append('versionCode', process.env.APP_VERSION_CODE || manifest.versionCode)
append('minSupportedVersionCode', process.env.APP_MIN_SUPPORTED_VERSION_CODE || '0')
append('updateMode', process.env.APP_UPDATE_MODE || 'optional')
append('title', process.env.APP_UPDATE_TITLE || '发现新版本')
append('notes', process.env.APP_UPDATE_NOTES || `自动构建版本 ${manifest.versionName}`)
append('downloadType', 'apk')
append('rolloutPercent', process.env.APP_ROLLOUT_PERCENT || '100')
append('publish', process.env.APP_PUBLISH || 'true')
form.append('file', new Blob([fs.readFileSync(apkPath)], { type: 'application/vnd.android.package-archive' }), path.basename(apkPath))

;(async () => {
  const response = await fetch(apiURL, {
    method: 'POST',
    headers: { 'X-App-Release-Token': token },
    body: form,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.code !== 0) {
    throw new Error(`版本上传失败（HTTP ${response.status}）：${body.msg || '未知错误'}`)
  }
  console.log(`Release uploaded: ${body.data?.versionName || manifest.versionName} (${body.data?.versionCode || manifest.versionCode}), ${stat.size} bytes`)
})().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
