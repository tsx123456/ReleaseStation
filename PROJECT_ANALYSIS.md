# 项目分析

分析日期：2026-11-17。此文档基于静态代码检查，是项目快照；运行效果和接口行为需要在实际环境中验证。

## 项目定位与技术栈

这是一个名为 FCPG 的 uni-app 前端项目，提供首页平台展示、收藏、分享和网页承载等功能。`package.json` 使用 Vue 2、Vuex 3、uView 和 uni-app 相关依赖；`main.js` 初始化 uView、全局配置、安全区域和中英文国际化，默认语言为 `po`。同时存在 Vue 3 条件分支，但依赖和主要初始化路径基于 Vue 2，不能据此认定 Vue 3 已可用。

## 主要结构和数据流

- `main.js`、`App.vue`：应用初始化、生命周期及全局样式。
- `pages.json`：页面路由及导航样式；首个页面 `pages/index.vue` 用自定义底部导航组合 `pages/home/`、`pages/collect/`、`pages/share/`，另有 `pages/webview/`。
- `component/`：导航栏、轮播图、游戏卡片、弹窗等组件。
- `api/`：首页、用户、消息、下载和 JSONBin 数据接口；首页通过 `api/home.js` 获取轮播、第三方应用及平台列表。
- `common/uni.interface.js`：基于 `uni.request` 的请求封装，读取本地 token，附加时间戳；`common/config.js` 配置请求环境，当前选择 `STABLE`。`common/uview.interface.js` 另有 uView 请求相关封装，修改前应确认具体调用链。
- `common/lang/`：葡语和英语文案；`store/index.js` 定义 Vuex 状态；`utils/`、`styles/`、`data/` 提供辅助逻辑、样式和数据。
- `static/`、`resources/`、`src/assets/` 存放资源；`iosdownload/` 包含独立的 iOS 下载页面及资源。

## 构建与注意事项

- 项目方确认测试发布链路：HBuilderX 发行 H5 网页资源后，将产物放入 `E:\sjl_hbuilder\fcpg\WebGameAggregation_client` 的 `fcpgWeb`，提交该仓库 `test` 分支，再使用 Jenkins `fcpgweb_test` 部署；Go 后端和管理前端分别使用各自的 `test` 分支与 Jenkins 测试任务。实际部署前需核对现有产物和环境地址，避免覆盖不相关内容或将测试请求指向正式服务。
- `package.json` 提供 `npm run dev:h5`、`npm run build:h5` 和 `npm run build:app-plus`；还定义了包含 `%PLATFORM%` 占位符的脚本名。项目未定义测试或 lint 脚本。正式 H5 发行以 HBuilderX“发行 → 网站-PC Web或手机H5”为准，正式原生包以 HBuilderX“发行 → App-Android/iOS-云打包”为准。
- `scripts/buildUni.js` 为 CLI 构建显式指定项目根目录、平台、生产模式和 Sass 实现，并可读取 HBuilderX 插件目录；`renameApk.js` 只接受显式 APK 路径。这些 npm/uni CLI 脚本仅用于本地诊断或辅助准备，正式 APK 仍由已登录并配置签名的 HBuilderX CLI 云打包负责，不把普通 uni CLI 输出误当成签名 APK。
- `main.js` 直接导入 `vue-i18n`，但它未在 `package.json` 直接声明；当前构建环境能够继续解析到相关代码，但新环境仍需要核对依赖来源。
- 根目录同时存在 npm 和 pnpm 锁文件，尚不能仅凭文件判断团队使用哪个包管理器；变更依赖前先确认并维护一致性。
- `uni_modules/` 被 Git 忽略，但源码引用其中的 uView；本机目录存在，其他环境需要确认其来源。`node_modules/` 和 `unpackage/` 也被忽略。
- `pages.json` 中出现两次 `easycom` 配置，当前内容相同；后续调整时需留意重复键的解析行为。
- `build:app-plus` 现在只执行 App-Plus 资源编译；它不会生成签名 APK。`renameApk.js` 已改为必须显式传入 APK 路径，避免从旧的 `unpackage` 目录误取历史包。正式 APK 仍由 HBuilderX“App-Android/iOS-云打包”产生。
- 仓库包含指向线上环境和外部服务的配置；调试或验证接口前应确认目标，避免无意影响真实数据。

## 本次版本更新改造后的结构变化

- `common/appUpdate.js` 负责 App-Plus 运行时版本读取、公开版本检查、可选更新忽略记录和 Android 下载/安装；`App.vue` 协调启动与回前台检查并通知首页的 `component/AppUpdateDialog.vue` 展示更新及下载进度，不在 `App.vue` 增加模板。版本服务可由 `VUE_APP_UPDATE_BASE_URL` 注入，默认沿用当前环境；新界面仍需打包真机验证。
- `manifest.json` 的 Android 云打包包名字段已修正为 HBuilderX 要求的 `packagename`；项目方已确认 Android 包名为 `uni.app.UNI2BD90B9`。早期自行填写的 `com.tsx.fcStation` 不作为 Android 包名；正式发布前仍需核对签名指纹。`com.tsx.fcStation` 在当前清单中仅作为 iOS `bundleIdentifier` 保留。
- `manifest.json` 为直发 Android 包增加了 `REQUEST_INSTALL_PACKAGES` 权限；此权限只适用于允许直接分发 APK 的渠道，Google Play 渠道仍应使用商店更新。
- `packageManager.vue` 旁增加版本发布页，后台前端通过 `src/api/appRelease.js` 调用版本草稿、发布、暂停/恢复和删除接口；旧安装包管理页继续保留。
- Go 后端新增 `bus_app_releases` 版本表、公开检查路由 `/app/version/check`（开发配置同时提供 `/api/app/version/check` 别名）和管理 CRUD/发布接口。旧 `bus_packageManager` 与客户端下载接口未删除，用于旧版本桥接。
- `.github/workflows/app-release.yml` 仅监听 `test`（忽略纯 Markdown 推送），且需显式启用；使用 Windows 自托管 HBuilderX Runner 构建外测 APK，严格校验本次云包的来源、包名、版本和签名后上传草稿。运行需配置 CLI、Android 工具、受信云下载主机、签名和外测上传令牌；自动发布仍未启用，外测下载地址前缀需核对。该流程尚未真实运行验证。

## 当前验证状态

- Go 后端目标包编译通过，开发服务连接测试库后，两个公开检查路径在无发布记录时均返回 `result=none`。
- 管理后台前端 `npm run build` 通过；版本发布页面已进入原安装包管理标签页。
- 当前测试分支的 `manifest.json` 已临时递增到 `versionName=1.0.1-dev`、`versionCode=101`，用于后续桥接包验收；测试库中历史 APK 仍为 `versionCode=100`，不能把该源码版本视为已发布版本。
- App 的 `npm run build:h5` 和 `npm run build:app-plus` 已在完整对齐 HBuilderX 5.07 内置的 DCloud `2.0.2-alpha-5000120260205002` 版本族、补充 `webpack-uni-mp-loader` 并修正脚本平台/生产环境变量后通过；此前的 `recyclableRender`、`lib/style` 和 `webpack-uni-mp-loader` 错误已消除。App-Plus CLI 构建需要提供 `HBUILDERX_CLI` 或 `UNI_HBUILDERX_PLUGINS` 以定位 HBuilderX 插件目录。当前只剩 `suporteGetdetailed` 导出缺失、Browserslist/资源体积等非阻断警告。该本地编译结果不等于 HBuilderX 云打包结果。
- HBuilderX 5.07 Android 云打包仍被签名配置阻塞：缺少签名库密码会直接失败，公共测试证书不能替代已运营包签名；云证书/云打包还必须在 HBuilderX 登录态和项目配置中实际产出新 APK。CI 脚本已完成语法和包名参数核对，但没有可复用的正式签名、Runner、发布令牌或开发服务器发布记录，仍未执行真实上传。
- 版本接口返回 SHA-256 元数据，后端 CI 上传会计算摘要；App 端暂未把摘要校验作为安装前门禁，且当前服务的 `rolloutPercent` 字段仍未在公开检查服务中执行灰度分流，需在正式启用灰度或安全门禁前补齐并在真机验证。
