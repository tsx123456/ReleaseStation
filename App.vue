<script>
	import {
		checkForUpdate,
		shouldSkipOptionalUpdate,
	} from '@/common/appUpdate.js'

	export default {
		globalData: { pendingAppUpdate: null },
		data() {
			return {
				checkingUpdate: false,
				lastUpdateCheckAt: 0,
			}
		},
		mounted() {
			if (process.env.UNI_PLATFORM === 'app-plus') {
				const closeSplash = () => {
					this.$nextTick(() => {
						setTimeout(() => {
							if (typeof plus !== 'undefined') {
								plus.navigator.closeSplashscreen()
								uni.hideLoading()
							}
							this.scheduleUpdateCheck(800)
						}, 1000)
					})
				}

				if (typeof plus !== 'undefined') {
					closeSplash()
				} else if (typeof document !== 'undefined') {
					document.addEventListener('plusready', closeSplash, { once: true })
				}
			}
		},
		onShow() {
			this.scheduleUpdateCheck(500)
		},
		methods: {
			scheduleUpdateCheck(delay = 0) {
				if (process.env.UNI_PLATFORM !== 'app-plus') return
				setTimeout(() => this.checkUpdate(), delay)
			},
			async checkUpdate() {
				if (this.checkingUpdate || Date.now() - this.lastUpdateCheckAt < 10 * 60 * 1000) return
				this.checkingUpdate = true
				this.lastUpdateCheckAt = Date.now()
				try {
					const update = await checkForUpdate()
					if (update && !shouldSkipOptionalUpdate(update)) {
						this.promptUpdate(update)
					}
				} catch (error) {
					// 版本检查失败不阻断正常业务，下一次启动或回前台继续检查。
					console.warn('[app-update] version check failed', error)
				} finally {
					this.checkingUpdate = false
				}
			},
			promptUpdate(update) {
				this.globalData.pendingAppUpdate = update
				uni.$emit('app-update-available', update)
			},
		},
	}
</script>



<style lang="scss">
	@import "@/uni_modules/uview-ui/index.scss";
	@import "@/common/table.scss";
	@import "@/common/datetime-picker.scss";
	@import "@/common/page-pagination.scss";
	@import "@/common/event_details.scss";
	@import "@/common/modal.scss";
	@import "@/static/htmlConfig/htmlConfig.css";

	html {
		--theme-rem-unit: 100;
		--theme-header-height: 0.8rem;
		--theme-scroll-bar-bg-color: var(--theme-color-line);
		--theme-filter-active-color: var(--theme-primary-color);
		--theme-profile-vip-bg: rgb(36, 178, 153);
		--theme-profile-vip-color: #e5b952;
		// --theme-main-bg-color: #151D29;
		--theme-main-bg-color-hex: 21, 29, 41;
		// --theme-bg-color: #111923;
		--theme-table-bg-color: var(--theme-bg-color);
		--theme-disabled-bg-color: #999;
		--theme-countTo-bg: #22674B;
		--theme-ant-message-bg: #FFF;
		--theme-bg-shadow: rgba(0, 0, 0, 0.06);
		--theme-load-bg-color: #29354866;
		--theme-home-bg-color: 14, 19, 27;
		// --theme-primary-color: #005DFE;
		--theme-primay-color-hex: 0, 93, 254;
		// --theme-primary-font-color: #FFFFFF;
		--theme-disabled-font-color: #fff;
		--theme-ant-message-font-color: #333333;
		--theme-aside-icon-color-0: var(--theme-btm-def-color);
		--theme-aside-icon-color-1: var(--theme-btm-def-color);
		--theme-aside-icon-color-2: #666;
		--theme-aside-font-color: #fff;
		--theme-aside-active-font-color: var(--theme-primary-color);
		--theme-aside-active-bg-color-0: #1E2836;
		--theme-aside-active-bg-color-1: var(--theme-main-bg-color);
		--theme-aside-box-shadow: 0 0.02rem 0.04rem 0 rgba(0, 0, 0, 0.3);
		--theme-aside-no-active-box-shadow: #0000001F;
		--theme-jackpot-bg-color-0: #fff;
		--theme-jackpot-bg-color-1: #edf3fd;
		--theme-jackpot-num-bg-color-0: #c9d2df;
		--theme-jackpot-num-bg-color-1: #f5f8fe;
		--theme-jackpot-num-bg-color-2: #c9d2df;
		--theme-jackpot-num-bg-shadow-color-0: #fff6;
		--theme-jackpot-num-bg-shadow-color-1: #fff6;
		--theme-jackpot-title-color: #FFFFFF;
		--theme-game-lobby-border: #262D38;
		--theme-search-icon-color: var(--theme-primary-color);
		// --theme-btm-def-color: #7D8BA1;
		--theme-btm-bg-color: var(--theme-main-bg-color);
		--theme-mine-icon-color: var(--theme-primary-color);
		--theme-hx-color: #FFFFFF;
		--theme-text-color-darken: #FFFFFF;
		--skin__neutral_2: #55657E;
		// --theme-text-color: #ADB6C4;
		// --theme-text-color-lighten: #55657E;
		--theme-text-color-lighten-withshadow: var(--theme-text-color-lighten);
		--theme-text-color-placeholder: var(--theme-text-color-lighten);
		--theme-text-color-task-btn: #fff;
		--theme-text-color-process-text: #fff;
		--theme-text-color-activities-text: #fff;
		--theme-text-color-side-tabs: var(--theme-btm-def-color);
		--theme-alt-text-color: #333333;
		--theme-text-person-color: #FFFFFF;
		// --theme-color-line: #293548;
		--theme-color-line-hex: 41, 53, 72;
		--theme-active-bg-color: var(--theme-bg-color);
		--theme-active-gou-color: var(--theme-primary-color);
		--theme-cardBg-color: rgba(7, 112, 255, 0.8);
		--theme-cardShadow-mask-color: rgba(254, 255, 255, 0.9);
		--theme-cardShadow-font-color: #fff;
		--theme-progress-line-color: var(--theme-text-color-lighten);
		--theme-text-color-darken-hex: 255, 255, 255;
		--theme-secondary-color-success: #04BE02;
		--theme-secondary-color-success-linear-gradient: #18c516;
		--theme-secondary-color-success-text: #fff;
		--theme-secondary-color-error: #EC0000;
		--theme-secondary-color-error-linear-gradient: #f35a4a;
		--theme-secondary-color-finance: #FFAA09;
		--theme-secondary-color-finance-hex: 255, 170, 9;
		--theme-secondary-color-finance-linear-gradient: #ffb325;
		--theme-secondary-color-tabs-start-gradient: #fff;
		--theme-secondary-color-tabs-end-gradient: #f2f3f7;
		--theme-secondary-color-tabs-active-start-gradien: #46a1ff;
		--theme-secondary-color-tabs-active-end-gradient: #1678ff;
		--theme-secondary-color-tabs-active-border: transparent;
		--theme-secondary-color-help-text-color: #FFFFFF;
		--theme-label-secondary-color-finance: #FFF600;
		--theme-event-luck-wheel-silver: #1672f2;
		--theme-event-luck-wheel-gold: #FFF600;
		--theme-event-luck-wheel-diamond: #b751ff;
		--theme-user-card-top-bg-color: #0533C6;
		--theme-user-card-bg-color: #052FBC;
		--theme-user-card-bottom-bg-color: #04259C;
		--theme-vip-progress-bg-color: var(--theme-primary-color);
		--theme-top-nav-bg: var(--theme-bg-color);
		--theme-side-menu-bg-color: #161F2C;
		// --theme-side-menu-btn-color: #182434;
		--theme-side-menu-btn-color-hex: 24, 36, 52;
		--theme-side-menu-btn-hover: #202e40;
		--theme-side-footer-bg-color: var(--theme-bg-color);
		--theme-tabbar-bg-color: var(--theme-bg-color);
		--theme-home-bg: var(--theme-bg-color);
		--theme-side-bg-color: #0f212e;
		--theme-left-nav-text-color: var(--theme-btm-def-color);
		--theme-left-nav-text-active-color: #333333;
		--theme-side-popver-text-color: #fff;
		--theme-game-card-ddt_bg: var(--theme-side-menu-btn-color);
		--theme-game-card-ddt_icon: #1D2B3D;
		--theme-alt-primary: var(--theme-primary-color);
		--theme-alt-neutral-1: var(--theme-btm-def-color);
		--theme-alt-neutral-2: var(--theme-btm-def-color);
		--theme-alt-border: var(--theme-text-color);
		--theme-profile_icon_1: var(--theme-primary-color);
		--theme-profile_icon_2: var(--theme-primary-color);
		--theme-profile_icon_3: var(--theme-primary-color);
		--theme-profile_icon_4: var(--theme-primary-color);
		--theme-web_filter_gou: #FFFFFF;
		--theme-aside-active-box-shadow: 0 0.02rem 0.04rem 0 rgba(0, 0, 0, 0.1);
		--theme-max-width: 516.6791604197902px;
		--vh: 1vh;
		--theme-height: calc(var(--vh, 1vh)* 100);
		--theme-ant-primary-color-0: var(--theme-primary-color);
		--theme-ant-primary-color-1: #196dfe;
		--theme-ant-primary-color-2: #337dfe;
		--theme-ant-primary-color-3: #4d8efe;
		--theme-ant-primary-color-4: #669efe;
		--theme-ant-primary-color-5: #80aeff;
		--theme-ant-primary-color-6: #99beff;
		--theme-ant-primary-color-7: #b3ceff;
		--theme-ant-primary-color-8: #ccdfff;
		--theme-ant-primary-color-9: #E6F3FF;
		--theme-ant-primary-color-10: #A3D1FF;
		--theme-ant-primary-color-11: #7AB8FF;
		--theme-ant-primary-color-12: #529DFF;
		--theme-ant-primary-color-13: #297EFF;
		--theme-ant-primary-color-14: var(--theme-primary-color);
		--theme-ant-primary-color-15: #0048D9;
		--theme-ant-primary-color-16: #0036B3;
		--theme-ant-primary-color-17: #00258C;
		--theme-ant-primary-color-18: #001866;
		--theme-ant-primary-color-19: 0, 93, 254;

		--theme-width-vh: 56.2vh;
		--theme-left-vh: calc((100vw - var(--theme-width-vh)) / 2);
	}

	// @media only screen and (min-width: 0) and (max-width: 56.2vh) {
	// 	html {
	// 		--theme-width-vh: 100vw;
	// 	}

	// }

	// @media (min-width: 56.2vh) {
	// 	html {
	// 		--theme-width-vh: 56.2vh;
	// 	}
	// }

	// html {
	// 	margin: 0px auto;
	// 	width: var(--theme-width-vh);
	// 	background-color: var(--theme-color-line);
	// 	overflow: hidden;
	// 	position: relative;
	// }
</style>
