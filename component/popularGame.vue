<template>
	<scroll-view class="game-wrapper" scroll-y :scroll-top="scrollTop" ref="scrollView" @scroll="onScroll">
		<div class="companyBox" v-if="imageList.length > 0">
			<image class="svgIcon" style="margin-right: 1rem;" src="@/static/APP/img_logo.png" />
			<div class="svgIconList">
				<image class="svgIcon" v-for="(item, i) in imageList" :key="i" :src="devUrl + '/api/' + item.imageUrl"
					@click="openExternalLink(item.link)" />
			</div>
		</div>

		<div class="game-grid">
			<div class="game-card" v-for="(game, index) in localList" :key="index" @click="goToWebView(game.url)">
				<image class="game-image" :src="devUrl + '/api/' + game.image" mode="aspectFit"></image>
				<div class="game-title">{{ game.name }}</div>
				<image class="star-icon" :src="game.isStarred ? '/static/star-on.png' : '/static/star-off.png'"
					mode="widthFix" @click.stop="toggleStar(index)"></image>
			</div>
		</div>
	</scroll-view>
</template>

<script>
	const STARRED_LIST_KEY = 'starredGameList'
	
	import setting from "@/common/config.js";

	export default {
		name: 'GameCardGrid',
		props: {
			list: {
				type: Array,
				default: () => []
			},
			imageList: {
				type: Array,
				default: () => []
			}
		},
		data() {
			return {
				localList: [],
				scrollTop: 0,
				devUrl: setting.CURRENT_ENVIRONMENT,
			}
		},
		watch: {
			list: {
				immediate: true,
				deep: true,
				handler(newVal) {
					if (!Array.isArray(newVal)) return
					this.localList = JSON.parse(JSON.stringify(newVal))
					this.loadStarStatus()
				}
			}
		},
		methods: {
			goToWebView(url) {
				uni.navigateTo({
					url: `/pages/webview/webview?url=${encodeURIComponent(url)}`
				})
			},
			toggleStar(index) {
				const game = this.localList[index]
				game.isStarred = !game.isStarred

				let starredList = uni.getStorageSync(STARRED_LIST_KEY) || []

				if (game.isStarred) {
					const exists = starredList.some(item => item.url === game.url)
					if (!exists) {
						starredList.push({
							conpany: game.conpany,
							name: game.name,
							image: game.image,
							url: game.url,
							isStarred: true
						})
					}
				} else {
					starredList = starredList.filter(item => item.url !== game.url)
				}

				uni.setStorageSync(STARRED_LIST_KEY, starredList)
			},
			loadStarStatus() {
				const starredList = uni.getStorageSync(STARRED_LIST_KEY) || []
				const starredMap = new Map()

				starredList.forEach(game => {
					if (game && game.url) {
						starredMap.set(game.url, true)
					}
				})

				if (!Array.isArray(this.localList)) return

				this.localList.forEach(game => {
					if (game && game.url) {
						game.isStarred = starredMap.has(game.url)
					}
				})
			},
			scrollToTop() {
				this.scrollTop = 0
				this.$nextTick(() => {
					this.scrollTop = 0.01
				})
			},
			onScroll(e) {

			},
			openExternalLink(url) {
				// #ifdef APP-PLUS
				if (typeof plus !== 'undefined' && plus.runtime) {
					plus.runtime.openURL(url)
				}
				// #endif

				// #ifdef H5
				window.open(url, '_blank')
				// #endif
			}
		}
	}
</script>

<style scoped>
	.game-wrapper {
		background-color: #000;
	}

	.companyBox {
		display: flex;
		align-items: center;
		margin: 1rem;
	}

	.svgIconList {
		display: flex;
		gap: 0.4rem;
	}

	.svgIcon {
		width: 2.2rem;
		height: 2.2rem;
		cursor: pointer;
	}

	.game-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 10px;
		padding: 0 10px 10px;
		box-sizing: border-box;
	}

	.game-card {
		background-color: #1f1f1f;
		border-radius: 0.6rem;
		overflow: hidden;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 140px;
		padding: 0 10px;
		position: relative;
		transition: transform 0.2s;
	}

	.game-card:active {
		transform: scale(0.98);
	}

	.game-image {
		width: 100px;
		height: 100px;
		object-fit: contain;
	}

	.game-title {
		color: #fff;
		font-size: 0.6rem;
		margin: 5px 0;
	}

	.star-icon {
		position: absolute;
		top: 3px;
		right: 3px;
		width: 20px;
		height: 20px;
		z-index: 99;
	}
</style>