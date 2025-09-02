/**
 * 通用 uni-app 网络请求封装
 * 功能：
 *  - GET / POST 请求
 *  - 支持 Token 自动注入
 *  - 自动时间戳
 *  - 支持 Loading 显示
 *  - 请求/响应日志
 */
import setting, {
	CURRENT_ENVIRONMENT
} from "./config.js";
import store from "@/store";

let modalState = true;
let restrictedState = true;

const http = {
	// 全局默认配置
	config: {
		baseURL: CURRENT_ENVIRONMENT,
		header: {
			'Content-Type': 'application/json;charset=UTF-8'
		},
		custom: {
			ShowLoading: false, // 是否显示 Loading
			LoadingMask: true, // Loading 是否遮罩
			LoadingText: setting.LOADING_TEXT // Loading 文本
		},
		dataType: "json",
		responseType: "text",
		timeout: setting.TIMEOUT,
		sslVerify: false,
		withCredentials: false,
		firstIpv4: false
	},

	/**
	 * GET 请求
	 */
	get(url, data = {}, options = {}) {
		return this.request({
			...options,
			url,
			data,
			method: 'GET',
			header: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});
	},

	/**
	 * POST 请求
	 */
	post(url, data = {}, options = {}) {
		return this.request({
			...options,
			url,
			data,
			method: 'POST',
			header: {
				'Content-Type': 'application/json;charset=UTF-8'
			}
		});
	},

	/**
	 * 核心请求
	 */
	request(options = {}) {
		const config = {
			...this.config,
			...options,
			header: {
				...this.config.header,
				...options.header
			}
		};

		// URL
		config.url = config.baseURL + config.url;
		config.data = config.data || {};

		// token
		const token = uni.getStorageSync('token') || '';
		if (token) config.data.token = token;

		// 时间戳
		config.data.timestamp = Math.round(new Date() / 1000);

		// 显示 Loading
		if (config.custom.ShowLoading && !config.url.includes('/api/user/heartbeat')) {
			uni.showLoading({
				title: config.custom.LoadingText || '加载中...',
				mask: config.custom.LoadingMask
			});
		}

		// 请求日志
		if (setting.REQUEST_LOG) _reqlog(config);

		return new Promise((resolve, reject) => {
			uni.request(config)
				.then(res => {
					if (config.custom.ShowLoading) uni.hideLoading();
					if (setting.REQUEST_LOG) _reslog(res);

					if (res.statusCode === 200) {
						resolve(res.data);
					} else {
						reject(res);
					}
				})
				.catch(err => {
					if (config.custom.ShowLoading) uni.hideLoading();
					console.error('请求失败:', err);
					reject(err);
				});
		});
	}
};

/**
 * 请求日志
 */
function _reqlog(req) {
	console.log(`\n🚀 [Request] ${req.method} ${req.url}`);
	console.log(`📦 Params:`, req.data);
}

/**
 * 响应日志
 */
function _reslog(res) {
	console.log(`\n✅ [Response] Status: ${res.statusCode}`);
	console.log(`📦 Data:`, res.data);
}

export default http;