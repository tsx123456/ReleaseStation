const ENVIRONMENT = {
	DEV_136: 'http://192.168.1.136:9080', //test
	DEV_176: 'http://192.168.1.176:9080', //local
	DEV_74: 'http://192.168.1.74:8083', //cj
	DEV_118: 'http://192.168.1.118:8083', //xp
	// #ifndef APP-PLUS
	DEV_OUTSIDE: 'http://52.67.128.45:2009', //外测-h5端不需要地址
	STABLE: 'https://admin.fcpg.app', //正式-h5端不需要地址
	// #endif
	// #ifdef APP-PLUS
	DEV_OUTSIDE: 'http://52.67.128.45:2009', //外测
	STABLE: 'https://admin.fcpg.app', //正式-app端需要地址 https://www.365bets.top/prod-api/  prod-api/
	// #endif
};

module.exports = {
	ENVIRONMENT,
	// 当前环境
	CURRENT_ENVIRONMENT: ENVIRONMENT.STABLE,
	// //是否开发模式
	// IS_DEV: true,
	// // 开发环境地址
	// DEV_URL: "http://test.asdf.cyou", //"http://192.168.1.130:10081",// http://test.asdf.cyou
	// // 生产环境地址
	// PRO_URL: "正式地址",
	//请求超时时间
	TIMEOUT: 60000,
	//是否开启请求日志
	REQUEST_LOG: false,
	//是否开启请求异常提示
	CATCH_MESS: false,
	//请求时提示文字
	LOADING_TEXT: 'loading',
	//是否需要签名
	IS_SECRET: false,
	//签名字符串
	APP_SECRET: "uniapp!@#2022",
	// 运行配置
	devServer: {
		port: '8222', //代理端口
		open: false, //项目启动时是否自动打开浏览器，我这里设置为false,不打开，true表示打开
		proxy: {
			'/api': {
				target: process.env.VUE_APP_HTTP_URL,
				changeOrigin: true, //是否跨域
				ws: true,
				pathRewrite: { //重写路径
					'^/api': 'http://localhost:8080/api' // 或 者 'http://localhost:8080/api'
				}
				// 既然我们设置了代理，则所有请求url都已写成/api/xxx/xxx，那请求如何知道我们到底请求的是哪个服务器的数据呢
				// 因此这里的意义在于， 以 /api开头的url请求，代理都会知道实际上应该请求那里，
				// ‘我是服务器/api’，后面的/api根据实际请求地址决定，即我的请求url：/api/test/test，被代理后请求的则是
				// https://我是服务器/api/test/test
			}

		}
	},
};