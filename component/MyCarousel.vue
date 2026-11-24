<template>
	<view class="my-carousel">
		<u-swiper :list="formattedImages" keyName="imageUrl" :autoplay="true" :circular="true" :indicator="true"
			indicatorMode="dot" :height="swiperHeight" radius="1rem" mode="widthFix" bgColor="transparent"
			@click="handleSwiperClick"></u-swiper>
	</view>
</template>

<script>
	import setting from "@/common/config.js";

	export default {
		props: {
			images: {
				type: Array,
				default: () => []
			}
		},
		data() {
			return {
				swiperHeight: 0,
				devUrl: setting.CURRENT_ENVIRONMENT
			};
		},
		computed: {
			formattedImages() {
				return this.images.map(item => ({
					...item,
					imageUrl: this.devUrl + "/api/" + item.imageUrl
				}));
			}
		},
		mounted() {
			this.calcHeight();
			uni.onWindowResize(() => this.calcHeight());
		},
		methods: {
			calcHeight() {
				const screenWidth = uni.getSystemInfoSync().windowWidth - 20;
				const aspectRatio = 1020 / 300;
				this.swiperHeight = screenWidth / aspectRatio + "px";
			},
			handleSwiperClick(index) {
				const url = this.formattedImages[index]?.link;
				if (url) {
					uni.navigateTo({
						url: "/pages/webview/webview?url=" + encodeURIComponent(url)
					});
				}
			}
		}
	};
</script>

<style scoped>
	.my-carousel {
		width: calc(100% - 1rem);
		margin: 0.5rem auto;
		overflow: hidden;
	}

	/deep/ .u-swiper__item__image {
		width: 100% !important;
		height: auto !important;
		object-fit: contain !important;
	}
</style>