<template>
	<view class="container" :style="{ paddingTop: $topSafeHeight + 'px' }">
		<view class="header">
			<text class="title">{{$t('appTitle')}}</text>
			<button class="download-btn" @click="openLink()">{{$t('share.downloadNow')}}</button>
		</view>
		<view class="content">
			<view class="content_left">
				<view class="qrcode-box">
					<canvas id="qrCodeUrl" canvas-id="qrCodeUrl" class="qrcode-canvas"></canvas>
				</view>
				<button class="save-btn" @click="saveQRCode('qrCodeUrl')">{{$t('share.clickToSave')}}</button>
			</view>
			<view class="content_right">
				<view class="link-box">
					<text class="link-text">{{ qrCodeUrl }}</text>
					<image class="btn_copy" src="/static/copy.png" @click="copyToClipboard(qrCodeUrl)"></image>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import UQRCode from 'uqrcodejs'
	import {
		getClientGetPackageInfo
	} from '@/api/home.js';
	import setting from "@/common/config.js";

	export default {
		data() {
			return {
				apkDownLoadUrl: "",
				// iosUrl: "http://18.231.202.26:30000/iosdownload/iosindex.html",
				iosUrl: "https://fcpg.app/iosdownload/iosindex.html",
				downloadUrl: '',
				platform: '',
				qrCodeUrl: 'https://fcpg.app',
				devUrl: setting.CURRENT_ENVIRONMENT,
			}
		},
		onReady() {
			this.open()
		},
		methods: {
			open() {
				getClientGetPackageInfo().then(data => {
					if (data.code == 0) {
						this.apkDownLoadUrl = this.devUrl + "/api/" + data.data.apk_url
						this.setDownloadUrl()
					}
				})

				this.generateQRCode(this.qrCodeUrl, 'qrCodeUrl')
			},
			setDownloadUrl() {
				// #ifdef APP-PLUS
				const systemInfo = uni.getSystemInfoSync()
				this.platform = systemInfo.platform
				this.downloadUrl = this.platform === 'android' ? this.apkDownLoadUrl : this.iosUrl
				// #endif

				// #ifdef H5
				const ua = navigator.userAgent.toLowerCase()

				if (ua.includes('iphone') || ua.includes('ipad') || (ua.includes('macintosh') && 'ontouchend' in
					document)) {
					this.downloadUrl = this.iosUrl
				} else if (ua.includes('android')) {
					this.downloadUrl = this.apkDownLoadUrl
				} else if (ua.includes('windows') || ua.includes('win')) {
					this.downloadUrl = this.apkDownLoadUrl
				} else {
					this.downloadUrl = this.apkDownLoadUrl
				}
				// #endif
			},
			generateQRCode(url, canvasId) {
				if (!url) return
				try {
					const qr = new UQRCode()
					qr.data = url
					qr.size = 100
					qr.margin = 0
					qr.colorDark = "#000000"
					qr.colorLight = "#ffffff"
					qr.make()
					const ctx = uni.createCanvasContext(canvasId, this)
					qr.canvasContext = ctx
					qr.drawCanvas()
				} catch (e) {
					uni.showToast({
						title: this.$t('buildFailure'),
						icon: 'none'
					})
				}
			},
			saveQRCode(canvasId) {
				uni.showLoading({
					title: this.$t('processing'),
					mask: true
				});

				uni.canvasToTempFilePath({
					canvasId,
					success: res => {
						const tempFilePath = res.tempFilePath || ''

						// #ifdef H5
						if (tempFilePath.startsWith('data:image')) {
							const link = document.createElement('a')
							link.href = tempFilePath
							link.download = 'fcShare.png'
							document.body.appendChild(link)
							link.click()
							document.body.removeChild(link)
							uni.hideLoading()
							uni.showToast({
								title: this.$t('imageDownloaded'),
								icon: 'none'
							})
							return
						}
						// #endif

						// #ifndef H5
						uni.saveImageToPhotosAlbum({
							filePath: tempFilePath,
							success: () => {
								uni.hideLoading()
								uni.showToast({
									title: this.$t('savedSuccessfully'),
									icon: 'none'
								})
							},
							fail: err => {
								uni.hideLoading()
								this.handleSaveFail(err)
							}
						})
						// #endif
					},
					fail: err => {
						uni.hideLoading()
						uni.showToast({
							title: this.$t('share.pleaseGenerateQRCodeFirst'),
							icon: 'none'
						})
					}
				}, this)
			},
			handleSaveFail(err) {
				if (err.errMsg.includes('auth')) {
					uni.showModal({
						title: this.$t('hint'),
						content: this.$t('share.AlbumPermissionRequiredSavePictures'),
						success: res => {
							if (res.confirm) uni.openSetting()
						}
					})
				} else {
					uni.showToast({
						title: this.$t('saveFailed'),
						icon: 'none'
					})
				}
			},
			openLink() {
			    // #ifdef APP-PLUS
			    plus.runtime.openURL(this.downloadUrl);
			    this.platform = "APP";
			    // #endif
			
			    // #ifdef H5
			    window.open(this.downloadUrl, '_blank');
			    this.platform = "H5";
			    // #endif
			
			    // 发送 GA4 事件
			    if (typeof gtag !== 'undefined') {
			        gtag('event', 'clickDownload', {
			            'event_category': 'download_actions',
			            'event_label': 'download_link_click',
			            'platform': this.platform,
			            'value': 1
			        });
			    }
			},
			copyToClipboard(text) {
				// #ifdef APP-PLUS
				uni.setClipboardData({
					data: text,
					success: () => uni.showToast({
						title: this.$t('copySuccess'),
						icon: 'none'
					})
				})
				// #endif

				// #ifdef H5
				const textarea = document.createElement('textarea')
				textarea.value = text
				textarea.style.position = 'fixed'
				document.body.appendChild(textarea)
				textarea.select()
				try {
					document.execCommand('copy')
					uni.showToast({
						title: this.$t('copySuccess'),
						icon: 'none'
					})
				} catch (err) {
					uni.showToast({
						title: this.$t('copyFailure'),
						icon: 'none'
					})
				}
				document.body.removeChild(textarea)
				// #endif
			}
		}
	}
</script>

<style>
	.container {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #111923;
	}

	.header {
		background-color: #151d29;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 0.5rem;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		position: relative;
		border-bottom: 0.15rem solid #293548;
	}

	.download-btn {
		background-color: #1a73e8;
		color: #fff;
		font-weight: bold;
		border-radius: 0.6rem;
		font-size: 0.8rem;
		padding: 0 1rem;
		border: none;
		margin-left: auto;
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
	}

	.content {
		background-color: #151d29;
		margin: 1rem 0.5rem;
		height: auto;
		padding: 0.5rem;
		border-radius: 0.5rem;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.title {
		font-size: 1.2rem;
		font-weight: bold;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.menu-btn {
		position: fixed;
		right: 0.5rem;
		top: 0.5rem;
		font-size: 1rem;
		line-height: 1;
		padding: 0.5rem 1rem;
		color: #333;
		z-index: 999;
	}

	.qrcode-box {
		width: 110px;
		height: 110px;
		background-color: #fff;
		border-radius: 0.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 0.2rem 0.6rem rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	.qrcode-canvas {
		width: 100px;
		height: 100px;
		border-radius: 0.5rem;
	}

	.btn-group {
		display: flex;
		justify-content: center;
		gap: 10px;
		width: 100%;
		margin-bottom: 1.5rem;
	}

	.save-btn {
		width: 110px;
		background-color: #1a73e8;
		color: white;
		border-radius: 15px;
		font-size: 15px;
		box-shadow: 0 0.2rem 0.6rem rgba(26, 115, 232, 0.3);
		border: none;
		padding: 8px 0;
		line-height: 1;
	}

	.header .save-btn {
		background-color: white;
		color: #1a73e8;
		font-weight: bold;
		margin-bottom: 0;
		width: auto;
		padding: 5px 15px;
	}

	.content_left {}

	.content_right {
		width: 100%;
	}

	.link-box {
		background-color: #1e1e2f;
		border-radius: 10px;
		padding: 10px 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 10px 16px;
		min-height: 40px;
		border: 1px solid #2c2c3c;
	}

	.link-text {
		color: #ccc;
		font-size: 14px;
		word-break: break-all;
		white-space: normal;
		line-height: 20px;
	}

	.btn_copy {
		width: 18px;
		height: 18px;
		margin-left: 12px;
	}
</style>