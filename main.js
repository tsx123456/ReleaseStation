import App from './App'

import {
	initRem
} from './utils/rem.js'
initRem()

// #ifndef VUE3
import Vue from 'vue'
import uView from '@/uni_modules/uview-ui'
import 'uview-ui/theme.scss'
Vue.use(uView)

import './uni.promisify.adaptor'
Vue.config.productionTip = false


import globalConfig from './common/global.js'

Vue.prototype.$config = globalConfig


// 获取刘海和底部横条高度
const systemInfo = uni.getSystemInfoSync()
const topSafeHeight = systemInfo.safeAreaInsets ?
	systemInfo.safeAreaInsets.top :
	systemInfo.safeArea.top
const bottomSafeHeight = systemInfo.safeAreaInsets ?
	systemInfo.safeAreaInsets.bottom :
	(systemInfo.screenHeight - systemInfo.safeArea.height - systemInfo.safeArea.top)
// 挂载为全局变量
Vue.prototype.$topSafeHeight = topSafeHeight
Vue.prototype.$bottomSafeHeight = bottomSafeHeight



//多语言引入
import VueI18n from 'vue-i18n'
import po from '@/common/lang/po.js'
import en from '@/common/lang/en.js'
Vue.use(VueI18n)
const i18n = new VueI18n({
	// locale: uni.getStorageSync('lang') ? uni.getStorageSync('lang') : 'po',
	locale: 'po',
	messages: {
		'en': en,
		'po': po
	}
})


App.mpType = 'app'
const app = new Vue({
	i18n,
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
export function createApp() {
	const app = createSSRApp(App)
	return {
		app
	}
}
// #endif