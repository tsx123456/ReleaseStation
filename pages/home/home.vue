<template>
	<view class="page">
		<NavBarVue></NavBarVue>
		<MyCarousel :images="imageList" />
		<popularGameVue :list="data" :imageList="applicationJumpLinkList" />
	</view>
</template>



<script>
	import popularGameVue from '@/component/popularGame.vue'
	import FloatButtonVue from '@/component/FloatButton.vue'
	import NavBarVue from '@/component/NavBar.vue'
	import MyCarousel from "@/component/MyCarousel.vue";

	import {
		getFcSwiperList,
		getFcPGList,
		applicationJumpLink
	} from '@/api/jsonbin.js';

	import {
		getClientGetThirdApp,
		getClientGetBanners,
		getClientGetPlatformList
	} from '@/api/home.js';


	export default {
		name: "HomePage",
		components: {
			popularGameVue,
			FloatButtonVue,
			NavBarVue,
			MyCarousel,
		},
		data() {
			return {
				imageList: [],
				data: [],
				applicationJumpLinkList: []
			}
		},

		mounted() {
			if (typeof plus !== 'undefined') {
				plus.navigator.setFullscreen(true)
			} else {
				document.addEventListener('plusready', () => {
					plus.navigator.setFullscreen(true)
				})
			}

		},
		methods: {
			async open() {
				try {
					// const swiperRes = await getFcSwiperList();
					// this.imageList = swiperRes.data;
					
					getClientGetBanners().then(data => {
						if (data.code == this.$config.code) {
							this.imageList = data.data.list;
						}
					})

					// const jumpLinkRes = await applicationJumpLink();
					// this.applicationJumpLinkList = jumpLinkRes.data;
					
					getClientGetThirdApp().then(data => {
						if (data.code == this.$config.code) {
							this.applicationJumpLinkList = data.data.list;
						}
					})

					// const fcPGRes = await getFcPGList();
					// this.data = this.transformData(fcPGRes.data);

					const postData = {
						"page": 1,
						"pageSize": 1000
					}
					getClientGetPlatformList(postData).then(data => {
						if (data.code == this.$config.code) {
							this.data = this.transformData(data.data.list);
						}
					})

				} catch (err) {
					console.error("err：", err);
				}
			},

			transformData(data) {
				return data.map(item => {
					const {
						imageUrl,
						...rest
					} = item;
					return {
						...rest,
						image: imageUrl,
						isStarred: false
					};
				});
			}

		}
	}
</script>

<style scoped>
	.page {
		display: flex;
		flex-direction: column;
		background-color: #000;
		margin-top: 4rem;
		padding-bottom: 4rem;
	}
</style>