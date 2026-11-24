<template>
	<view v-if="update" class="update-mask" @touchmove.stop.prevent>
		<view class="update-card">
			<view class="update-top">
				<view class="update-icon">↑</view>
				<text class="update-eyebrow">FCPG UPDATE</text>
				<text class="update-title">{{ update.title || $t('appUpdate.title') }}</text>
				<text class="update-version">{{ $t('appUpdate.version') }} {{ update.latestVersionName || update.latestVersionCode }}</text>
			</view>
			<view class="update-body">
				<scroll-view scroll-y class="update-notes"><text>{{ update.updateNotes || $t('appUpdate.defaultNotes') }}</text></scroll-view>
				<view v-if="downloading" class="progress-area">
					<view class="progress-label"><text>{{ $t('appUpdate.downloading') }}</text><text>{{ progress }}%</text></view>
					<view class="progress-track"><view class="progress-fill" :style="{ width: progress + '%' }"></view></view>
					<text class="progress-hint">{{ $t('appUpdate.keepOpen') }}</text>
				</view>
				<text v-if="error" class="update-error">{{ error }}</text>
				<button v-if="!downloading" class="update-primary" @click="start">{{ error ? $t('appUpdate.retry') : $t('appUpdate.updateNow') }}</button>
				<button v-if="!downloading && !update.force" class="update-later" @click="later">{{ $t('appUpdate.later') }}</button>
			</view>
		</view>
	</view>
</template>

<script>
import { dismissOptionalUpdate, downloadAndInstall } from '@/common/appUpdate.js'

export default {
	data() { return { update: null, downloading: false, progress: 0, error: '' } },
	mounted() {
		uni.$on('app-update-available', this.showUpdate)
		const app = getApp()
		if (app && app.globalData && app.globalData.pendingAppUpdate) this.showUpdate(app.globalData.pendingAppUpdate)
	},
	beforeDestroy() { uni.$off('app-update-available', this.showUpdate) },
	methods: {
		showUpdate(update) { if (!this.downloading) { this.update = update; this.error = ''; this.progress = 0 } },
		clear() { const app = getApp(); if (app && app.globalData) app.globalData.pendingAppUpdate = null; this.update = null },
		later() { if (this.update && !this.update.force) { dismissOptionalUpdate(this.update); this.clear() } },
		async start() {
			if (this.downloading || !this.update) return
			this.downloading = true; this.progress = 0; this.error = ''
			try {
				await downloadAndInstall(this.update, (value) => { this.progress = Math.max(0, Math.min(100, Math.round(Number(value) || 0))) })
				this.clear()
				uni.showToast({ title: this.$t('appUpdate.installStarted'), icon: 'none' })
			} catch (error) {
				this.error = (error && error.message) || this.$t('appUpdate.failed')
			} finally { this.downloading = false }
		},
	},
}
</script>

<style scoped>
.update-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, .78); }
.update-card { width: 84%; max-width: 680rpx; border-radius: 30rpx; overflow: hidden; background: #181b23; border: 1px solid rgba(229,185,82,.35); box-shadow: 0 18rpx 70rpx rgba(0,0,0,.5); }
.update-top { display: flex; flex-direction: column; align-items: center; padding: 45rpx 36rpx 34rpx; background: linear-gradient(150deg,#4b3015,#211b1a 65%,#181b23); }
.update-icon { display: flex; justify-content: center; align-items: center; width: 90rpx; height: 90rpx; border-radius: 50%; background: #e5b952; color: #261b0a; font-size: 60rpx; font-weight: bold; }
.update-eyebrow { margin-top: 22rpx; color: #d7b76f; font-size: 20rpx; letter-spacing: 4rpx; }
.update-title { margin-top: 12rpx; color: #fff; font-size: 38rpx; font-weight: bold; text-align: center; }
.update-version { margin-top: 12rpx; color: #ddc996; font-size: 25rpx; }
.update-body { padding: 8rpx 40rpx 36rpx; }
.update-notes { max-height: 260rpx; margin-bottom: 30rpx; color: #d4d4d6; font-size: 27rpx; line-height: 1.6; white-space: pre-wrap; }
.update-primary, .update-later { border: 0; border-radius: 16rpx; font-size: 29rpx; line-height: 90rpx; }
.update-primary { background: #e5b952; color: #261b0a; font-weight: bold; }
.update-later { margin-top: 12rpx; background: transparent; color: #a4a6ab; }
.progress-area { margin: 8rpx 0 20rpx; }
.progress-label { display: flex; justify-content: space-between; color: #f2d489; font-size: 26rpx; }
.progress-track { height: 14rpx; margin-top: 18rpx; overflow: hidden; border-radius: 12rpx; background: #3c3e44; }
.progress-fill { height: 100%; border-radius: 12rpx; background: linear-gradient(90deg,#bd8126,#f4d67b); transition: width .25s ease; }
.progress-hint { display: block; margin-top: 16rpx; color: #a4a6ab; font-size: 23rpx; }
.update-error { display: block; margin-bottom: 20rpx; color: #ff9494; font-size: 24rpx; word-break: break-all; }
</style>
