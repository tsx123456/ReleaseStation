<template>
	<view class="bottom-tab-swiper">
		<!-- #ifdef H5 -->
		<view v-if="showLoading" class="loading-page">
			<image class="splash" src="/static/launch/splash/splash.png"></image>
		</view>
		<!-- #endif -->
		<swiper class="swiper-container" :current="currentIndex" @change="onSwiperChange" :circular="false"
			:disable-touch="true" :previous-margin="previousMargin" :next-margin="nextMargin">
			<swiper-item v-for="(page, index) in pages" :key="index">
				<scroll-view class="page-scroll-wrapper" scroll-y>
					<HomePage v-if="page.name === 'HomePage'" ref="homePageRef" />
					<collectPage v-if="page.name === 'collectPage'" ref="collectPageRef" />
					<sharePage v-if="page.name === 'sharePage'" ref="sharePageRef" />
				</scroll-view>
			</swiper-item>
		</swiper>
		<view class="tab-bar" ref="tabBar" :style="{ paddingBottom: $bottomSafeHeight + 'px' }">
			<view class="tab-item" v-for="(page, index) in pages" :key="index"
				:class="{ active: currentIndex === index }" @click="goToPage(index)" ref="tabItems">
				{{ page.title }}
			</view>
			<view class="tab-underline" :style="underlineStyle"></view>
		</view>

		<view>
			<informationPopup ref="informationPopup" @todayAgainPopup="todayAgainPopup"></informationPopup>
		</view>
		<!-- #ifdef APP-PLUS -->
		<app-update-dialog />
		<!-- #endif -->
	</view>
</template>

<script>
	import HomePage from '@/pages/home/home.vue'
	import collectPage from '@/pages/collect/collect.vue'
	import sharePage from '@/pages/share/share.vue'
	import informationPopup from "@/component/informationPopup.vue"
	import AppUpdateDialog from '@/component/AppUpdateDialog.vue'
	import {
		suporteGetList,
	} from "@/api/information.js"

	export default {
		name: 'BottomTabSwiper',
		components: {
			HomePage,
			collectPage,
			sharePage,
			AppUpdateDialog,
			informationPopup
		},
		data() {
			return {
				currentIndex: 0,
				underlineStyle: {
					width: '0px',
					transform: 'translateX(0)'
				},
				previousMargin: '0px',
				nextMargin: '0px',
				showLoading: true,
				getInformationDataAll: [],
				informationList: [],
				isInformationPopup: false,
				isTodayAgainPopup: true,
			}
		},
		computed: {
			pages() {
				return [{
						title: this.$t('home.home'),
						name: 'HomePage'
					},
					{
						title: this.$t('home.collect'),
						name: 'collectPage'
					},
					{
						title: this.$t('home.share'),
						name: 'sharePage'
					}
				]
			}
		},
		watch: {
			currentIndex(newVal, oldVal) {
				if (oldVal === this.pages.length - 1 && newVal === 0) {
					this.previousMargin = '100%';
					this.nextMargin = '0px';
					setTimeout(() => {
						this.previousMargin = '0px';
					}, 50);
				} else {
					this.previousMargin = '0px';
					this.nextMargin = '0px';
				}

				this.updateUnderline()
				setTimeout(() => {
					this.notifyCurrentPage()
				}, 100)
			}
		},

		mounted() {
			// #ifdef H5
			setTimeout(() => {
				this.showLoading = false
				this.updateUnderline()
				this.notifyCurrentPage()
				// this.getSuporteData()
			}, 2000)
			// #endif

			// #ifndef H5
			this.showLoading = false
			this.updateUnderline()
			this.notifyCurrentPage()
			// this.getSuporteData()
			// #endif
		},

		methods: {
			goToPage(index) {
				if (this.currentIndex === this.pages.length - 1 && index === 0) {
					this.previousMargin = '100%';
					this.nextMargin = '0px';
					setTimeout(() => {
						this.currentIndex = index;
						this.previousMargin = '0px';
					}, 50);
				} else {
					this.currentIndex = index;
				}
			},
			onSwiperChange(e) {
				this.currentIndex = e.detail.current
			},
			updateUnderline() {
				this.$nextTick(() => {
					const tabItems = this.$refs.tabItems
					const activeTab = Array.isArray(tabItems) ? tabItems[this.currentIndex] : tabItems
					if (!activeTab) return

					// #ifdef H5
					const {
						offsetLeft,
						offsetWidth
					} = activeTab
					this.underlineStyle = {
						width: offsetWidth + 'px',
						transform: `translateX(${offsetLeft}px)`
					}
					// #endif

					// #ifndef H5
					const widthPercent = (100 / this.pages.length).toFixed(2)
					this.underlineStyle = {
						width: `${widthPercent}%`,
						transform: `translateX(${this.currentIndex * 100}%)`
					}
					// #endif
				})
			},
			notifyCurrentPage() {
				const comp = this.getCurrentPageComponent()
				const target = Array.isArray(comp) ? comp[0] : comp
				if (target && typeof target.open === 'function') {
					target.open()
				}
			},
			getCurrentPageComponent() {
				const currentPageName = this.pages[this.currentIndex].name
				const refMap = {
					HomePage: 'homePageRef',
					collectPage: 'collectPageRef',
					sharePage: 'sharePageRef'
				}
				return this.$refs[refMap[currentPageName]]
			},
			getSuporteData() {
				this.getInformationDataAll = []
				this.informationList = []
				try {
					let requestSuporteListData = {
						token: '',
					}
					suporteGetList(requestSuporteListData).then(data => {
						if (data.meta.code == 0) {
							data.data.rows.forEach((value, index) => {
								if (value.type == 1) {
									this.getInformationDataAll.push(value)
								}
							});
							this.informationList = []
							this.getInformationDataAll.forEach((item, index) => {
								if (item.is_popup == 1) {
									this.informationList.push(item)
								}
							})
							if (this.informationList.length > 0) {
								this.isInformationPopup = true
								this.openInformationPopup()
							} else {
								this.isInformationPopup = false
							}
							uni.setStorageSync('getInformationDataAll', this.getInformationDataAll)
						}
					})
				} catch (e) {

				}
			},
			openInformationPopup() {
				var date = new Date()
				var year = date.getFullYear()
				var month = date.getMonth() + 1
				var day = date.getDate()
				if (day != uni.getStorageSync('nowDate').day || month != uni.getStorageSync('nowDate').month ||
					year != uni.getStorageSync('nowDate').year) {
					this.$refs.informationPopup.open(this.informationList)
					this.$refs.informationPopup.isChecked = false
				}
			},
			todayAgainPopup() {

			}
		}
	}
</script>

<style scoped>
	.bottom-tab-swiper {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #000;
	}

	.swiper-container {
		flex: 1;
		height: 100%;
	}

	.page-scroll-wrapper {
		height: 100%;
		width: 100%;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		box-sizing: border-box;
	}

	.tab-bar {
		display: flex;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3rem;
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-top: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.08);
		color: #000;
		z-index: 9999;
	}

	.tab-item {
		flex: 1;
		text-align: center;
		line-height: 3rem;
		font-size: 0.8rem;
		color: #666;
		position: relative;
	}

	.tab-item.active {
		color: #409eff;
		font-weight: bold;
	}

	.tab-underline {
		position: absolute;
		bottom: 0;
		height: 0.1rem;
		background-color: #409eff;
		transition: all 0.3s ease;
		will-change: transform, width;
	}

	/* loading页样式 */
	.loading-page {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		background-color: #000;
		color: #fff;
		z-index: 10000;
	}

	.splash {
		width: 100vw;
		height: 100vh;
	}
</style>
