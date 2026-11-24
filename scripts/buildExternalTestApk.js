const fs = require('fs')
const path = require('path')
const https = require('https')
const { spawn, spawnSync } = require('child_process')

const required = (name) => {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`Missing configuration: ${name}`)
  return value
}
const workspace = path.resolve(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(workspace, 'manifest.json'), 'utf8'))
const cli = required('HBUILDERX_CLI')
const host = required('HBUILDER_DOWNLOAD_HOST').toLowerCase()
const apk = path.join(required('RUNNER_TEMP'), `fcpg-test-${required('GITHUB_RUN_ID')}-${required('GITHUB_RUN_ATTEMPT')}.apk`)
const args = ['pack', '--project', workspace, '--platform', 'android', '--safemode', 'false',
  '--android.packagename', required('APP_PACKAGE_ID'), '--android.androidpacktype', '0',
  '--android.certalias', required('ANDROID_CERT_ALIAS'), '--android.certfile', required('ANDROID_CERT_FILE'),
  '--android.certpassword', required('ANDROID_CERT_PASSWORD'), '--android.storepassword', required('ANDROID_STORE_PASSWORD')]

function download(url, count = 0) {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== host || parsed.username || parsed.password || count > 3) {
    throw new Error('Cloud APK download URL is not from the configured HTTPS host')
  }
  return new Promise((resolve, reject) => {
    const req = https.get(parsed, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        try { download(new URL(res.headers.location, parsed).href, count + 1).then(resolve, reject) } catch (error) { reject(error) }
        return
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`Cloud download failed: HTTP ${res.statusCode}`)); return }
      const out = fs.createWriteStream(apk, { flags: 'wx' })
      res.pipe(out)
      out.on('finish', () => out.close(resolve))
      out.on('error', reject)
      res.on('error', reject)
    })
    req.setTimeout(120000, () => req.destroy(new Error('Cloud download timed out')))
    req.on('error', reject)
  })
}
function check(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true })
  if (result.error || result.status !== 0) throw new Error(`APK validation failed: ${path.basename(command)}`)
  return `${result.stdout || ''}\n${result.stderr || ''}`
}
async function main() {
  if (fs.existsSync(apk)) throw new Error('Output already exists; refusing to reuse an APK')
  const checkURL = 'http://52.67.128.45:2009/api/app/version/check?platform=android&channel=official&packageId=uni.app.UNI2BD90B9&versionCode=0'
  const response = await fetch(checkURL, { signal: AbortSignal.timeout(15000) })
  const state = await response.json()
  if (!response.ok || state.code !== 0 || !state.data || !['none', 'optional', 'force'].includes(state.data.result)) throw new Error('Cannot verify the current external test version')
  const latest = Number(state.data.latestVersionCode || 0)
  if (!Number.isSafeInteger(latest) || Number(manifest.versionCode) <= Math.max(106, latest)) throw new Error('Generated version must exceed the current external test version')
  let output = ''
  const child = spawn(cli, args, { cwd: workspace, windowsHide: true })
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output += chunk.toString(); if (output.length > 2e6) output = output.slice(-1e6) })
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) })
  if (code !== 0) throw new Error('HBuilderX cloud packaging failed')
  const match = output.match(/下载地址\s*[:：]\s*(https?:\/\/[^\s]+)/)
  if (!match) throw new Error('Cloud packaging did not return a download URL; no old APK will be used')
  await download(match[1])
  const info = check(required('ANDROID_AAPT'), ['dump', 'badging', apk])
  if (!info.includes(`name='${required('APP_PACKAGE_ID')}'`) || !info.includes(`versionCode='${manifest.versionCode}'`) || !info.includes(`versionName='${manifest.versionName}'`)) {
    throw new Error('APK package or version differs from this build')
  }
  const signature = check('java', ['-jar', required('ANDROID_APKSIGNER_JAR'), 'verify', '--print-certs', apk])
  const signers = [...signature.matchAll(/Signer #\d+ certificate SHA-256 digest:\s*([a-f0-9]{64})/gi)].map(match => match[1].toLowerCase())
  if (signers.length !== 1 || signers[0] !== 'c41d9bf1466e751ee15d4267604184e283ade2feeee84f0c983789d9fc13f555') throw new Error('APK signing certificate does not match the existing app')
  console.log(`Verified external test APK: ${manifest.versionName} (${manifest.versionCode})`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
