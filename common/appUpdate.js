import setting from '@/common/config.js'

const OPTIONAL_DISMISS_MS = 24 * 60 * 60 * 1000

function isAppPlus() {
	// #ifdef APP-PLUS
	return true
	// #endif
	// #ifndef APP-PLUS
	return false
	// #endif
}

export function getDownloadUrl(url) {
	if (!url) return ''
	if (/^https?:\/\//i.test(url)) return url
	const base = String(setting.APP_UPDATE_BASE_URL || setting.CURRENT_ENVIRONMENT).replace(/\/+$/, '')
	const path = String(url).replace(/^\/+/, '')
	// Version checks are exposed below /api, while locally stored upload files
	// are served by the backend's static /uploads route. Preserve that route
	// instead of incorrectly turning uploads/file/... into /api/uploads/....
	if (path.toLowerCase().startsWith('api/') || path.toLowerCase().startsWith('uploads/')) {
		return `${base}/${path}`
	}
	return `${base}/api/${path}`
}

export function getRuntimeInfo() {
	return new Promise((resolve) => {
		if (!isAppPlus()) {
			resolve(null)
			return
		}

		const read = () => {
			const systemInfo = uni.getSystemInfoSync()
			let appBaseInfo = {}
			try {
				if (typeof uni.getAppBaseInfo === 'function') appBaseInfo = uni.getAppBaseInfo() || {}
			} catch (error) {
				// Older runtime bases may not expose getAppBaseInfo; use manifest fallback.
			}
			const finish = (property = {}) => {
				const platform = String(systemInfo.platform || '').toLowerCase()
				const versionCode = Number(
					systemInfo.appVersionCode ||
					plus.runtime.versionCode ||
					property.versionCode ||
					0
				)
				resolve({
					platform: platform === 'ios' ? 'ios' : 'android',
					channel: setting.APP_UPDATE_CHANNEL,
					packageId: appBaseInfo.packageName || setting.APP_PACKAGE_ID,
					versionCode: Number.isFinite(versionCode) ? versionCode : 0,
					versionName: String(plus.runtime.version || property.version || systemInfo.appVersion || ''),
					locale: uni.getStorageSync('lang') || 'po',
				})
			}

			if (plus.runtime && typeof plus.runtime.getProperty === 'function') {
				plus.runtime.getProperty(plus.runtime.appid, finish)
			} else {
				finish()
			}
		}

		if (typeof plus !== 'undefined') {
			read()
		} else if (typeof document !== 'undefined') {
			document.addEventListener('plusready', read, { once: true })
		} else {
			resolve(null)
		}
	})
}

export function requestVersionCheck(runtime) {
	return new Promise((resolve, reject) => {
		const base = String(setting.APP_UPDATE_BASE_URL || setting.CURRENT_ENVIRONMENT).replace(/\/+$/, '')
		uni.request({
			url: `${base}${setting.APP_UPDATE_CHECK_PATH}`,
			method: 'POST',
			header: { 'Content-Type': 'application/json' },
			data: runtime,
			timeout: 10000,
			success: (res) => {
				if (res.statusCode !== 200 || !res.data || res.data.code !== 0) {
					reject(new Error((res.data && res.data.msg) || `HTTP ${res.statusCode}`))
					return
				}
				resolve(res.data.data || { result: 'none' })
			},
			fail: reject,
		})
	})
}

export async function checkForUpdate() {
	if (!isAppPlus()) return null
	const runtime = await getRuntimeInfo()
	if (!runtime || !runtime.versionCode) return null
	const result = await requestVersionCheck(runtime)
	if (!result || result.result === 'none') return null
	return {
		...result,
		force: result.result === 'force',
		url: getDownloadUrl(result.downloadUrl),
		currentVersionCode: runtime.versionCode,
		currentVersionName: runtime.versionName,
		platform: runtime.platform,
	}
}

export function shouldSkipOptionalUpdate(update) {
	if (!update || update.force || !update.releaseId) return false
	const dismissed = uni.getStorageSync(`app_update_dismissed_${update.releaseId}`)
	return dismissed && Date.now() - Number(dismissed) < OPTIONAL_DISMISS_MS
}

export function dismissOptionalUpdate(update) {
	if (!update || update.force || !update.releaseId) return
	uni.setStorageSync(`app_update_dismissed_${update.releaseId}`, Date.now())
}

export function downloadAndInstall(update, onProgress) {
	return new Promise((resolve, reject) => {
		if (!update || !update.url) {
			reject(new Error('更新地址为空'))
			return
		}

		// #ifdef APP-PLUS
		if (update.platform === 'ios' || update.downloadType === 'store' || update.downloadType === 'landing_page') {
			plus.runtime.openURL(update.url)
			resolve({ opened: true })
			return
		}
		if (update.platform !== 'android') {
			reject(new Error('当前平台不支持安装此更新包'))
			return
		}
		let task
		try {
			task = uni.downloadFile({
				url: update.url,
				timeout: 120000,
				success: (res) => {
					if (res.statusCode !== 200 || !res.tempFilePath) {
						reject(new Error(`下载失败（HTTP ${res.statusCode}）`))
						return
					}
					try {
						plus.runtime.install(
							res.tempFilePath,
							{},
							() => resolve({ installed: true }),
							(error) => reject(new Error(error && (error.message || error.code) || '安装失败'))
						)
					} catch (error) {
						reject(error)
					}
				},
				fail: reject,
			})
			task && task.onProgressUpdate && task.onProgressUpdate((progress) => {
				if (typeof onProgress === 'function') onProgress(progress.progress || 0, progress)
			})
		} catch (error) {
			reject(error)
		}
		// #endif
	})
}
