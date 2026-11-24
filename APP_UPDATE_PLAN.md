# App 版本更新方案（基于当前前后端代码核对后的落地版）

日期：2026-11-17。本文是基于当前 App、Go 后端和管理后台源码的落地说明。Android 官网/直发渠道的版本检查、后台版本发布和客户端下载安装代码已在各自 `develop` 分支实现；真实 APK 签名、HBuilderX 编译、真机安装和 CI 凭据仍需在发布前确认。

## 0. 当前项目基线与结论

- App 是 Vue 2 + uni-app，测试分支当前配置为 `versionName=1.0.1-dev`、`versionCode=101`，用于验证高于历史包 `versionCode=100` 的更新路径；HBuilderX 云打包使用 `distribute.android.packagename`。项目方已确认 Android 包名为 `uni.app.UNI2BD90B9`，早期自行填写的 `com.tsx.fcStation` 不作为 Android 包名；首个桥接更新按该包名保持覆盖安装兼容，发布前仍需核对签名指纹。
- 当前 `common/config.js` 的业务环境仍是 `https://admin.fcpg.app`，版本检查基址可用 `VUE_APP_UPDATE_BASE_URL` 覆盖，未配置时沿用当前环境。虽然 `192.168.1.130` 是开发测试服务器，但当前该端口尚未部署本次 Go 版本中心；在部署完成前不要把它写成默认地址，正式分支也必须明确指向正式版本服务。
- `App.vue` 目前负责关闭启动屏，并在 App-Plus 启动/回前台时协调版本检查、可选/强制提示和下载安装；安装完成后的实际版本复核仍需真机验证。
- `pages/share/share.vue` 调用现有 `GET /api/packageManager/clientGetPackageInfo`，把 `apk_url` 拼成地址后通过 `plus.runtime.openURL` 交给系统/浏览器处理。这是下载入口，不是应用内更新闭环。
- Go 后端现有 `bus_packageManager` 按 `PC`、`iOS`、`Android` 分类保存下载地址，Android/iOS 各限制为一条记录；公开响应只有 PC 列表、iOS 落地页/mobileconfig、Android APK 地址，没有版本码、最低支持版本、更新说明、摘要、渠道或灰度信息。
- 因此不建议直接把版本字段堆到现有 `bus_packageManager` 并覆盖历史记录。建议新增独立的版本发布表和接口，同时保留旧接口，作为旧版 App 的过渡下载通道。

### HBuilderX 发行边界

- 当前项目的官方 H5 发行入口是 HBuilderX 菜单“发行 → 网站-PC Web或手机H5”。它用于生成/发布 `fcpg.app` 使用的网页资源，不会生成可安装的 Android APK，也不参与 App 覆盖安装更新。
- 当前项目的官方原生包发行入口是 HBuilderX 菜单“发行 → App-Android/iOS-云打包”。它对应本项目版本中心需要接收的 Android 安装包；自动化时使用已登录 DCloud、已配置包名和签名的 HBuilderX CLI，调用与该菜单等价的云打包能力。
- 仓库中的 `npm run build:h5` 和 `npm run build:app-plus` 只保留作本地诊断/兼容性检查，不能作为 HBuilderX 正式 H5 发布或签名 APK 产物的判定依据。当前已将 DCloud 编译包对齐到 HBuilderX 5.07 版本族并修复脚本平台变量，两个诊断构建均可通过；这些命令只证明源码可编译，不会替代云打包签名。App-Plus CLI 构建需设置 `HBUILDERX_CLI` 或 `UNI_HBUILDERX_PLUGINS`。

## 1. 推荐方案

后端统一管理版本、最低可用版本、发布渠道和灰度；客户端负责检查、展示、下载及按渠道调用系统安装方式。首期以 Android 官网分发整包更新为主要落地路径；根据实际发行渠道补充 Google Play 与 iOS。H5 使用网站部署和缓存更新流程，不提示安装 APK。

| 渠道 | 推荐更新方式 | 备注 |
| --- | --- | --- |
| Android 官网或其他允许直接分发的渠道 | App 下载 HTTPS APK，校验后唤起系统安装器 | 用户需确认安装；特定 Android 版本可能需要授权安装未知应用，不能静默安装。包名、签名与版本号须满足覆盖安装条件。 |
| Google Play | 优先通过 Play 更新；按需接入 Play In-App Updates，或打开商店详情 | 不走自下载 APK。应用内更新需要原生能力或可靠插件，并以 Play 实际可用性为准。 |
| iOS | 跳转对应的 App Store 或实际合法发行渠道更新 | 不把 APK 安装流程用于 iOS。当前分享页存在 iOS 下载页，但不能据此认定实际发行方式。 |
| H5 | 通过部署新资源、缓存策略及必要时刷新页面 | 与原生安装包版本分别管理。 |

首期不默认采用 WGT 热更新：它不能替代涉及原生模块、权限、SDK 或系统配置的整包更新，且需要处理原生基座兼容和各平台发行规则。以后确有需求时单独设计资源版本、兼容范围、灰度和回退。

## 2. 强制与可选策略

每个平台、渠道维护 `latestVersionCode` 和 `minSupportedVersionCode`，使用单调递增整数比较；`versionName` 仅用于展示。规则：

1. 当前版本低于最低支持版本：强制更新，显示不可关闭的更新页，提供更新、重试和联系客服等出口，不进入正常业务。
2. 当前版本不低于最低版本但低于最新版本：可选更新，允许稍后提醒；按版本记录忽略状态，建议默认 24 小时后再次提醒，新版本或策略变化立即重新评估。
3. 当前版本大于或等于最新版本：无更新。只有在该渠道该设备能实际取得兼容安装包时才返回更新目标；不能给无法升级的用户设置强制门槛。

版本检查在 App 原生环境就绪后尽早执行；从后台返回可按节流策略重新检查，设置页提供手动检查入口。可选弹窗与首页公告错峰展示；强制更新覆盖其他弹窗。网络超时或检查失败不能误判为已是最新：正常用户可继续使用并稍后重试；已通过可信成功响应确认需强更时，保持限制并提供重试。缓存策略应有有效期和撤回机制，避免永久锁死；最终离线策略需结合业务风险确定。

客户端弹窗只能约束支持该机制的客户端，不能保证阻止绕过或未集成更新的旧版本。如需真正停止旧版敏感接口，后端须配合版本兼容策略，并考虑客户端上报版本可被伪造，不能将它当作安全认证。

## 3. 建议接口契约

建议独立的公开只读检查接口 `POST /api/app/version/check`，实际路由及响应外层沿用后端既有规范。无需登录，防止登录前无法更新；限流、超时、错误码和缓存控制按现有架构确定。只发送必要信息，不发送 token 或设备唯一标识。示例为设计草案：

```json
{
  "platform": "android",
  "channel": "official",
  "packageId": "uni.app.UNI2BD90B9",
  "versionCode": 100,
  "versionName": "1.0.0",
  "locale": "po"
}
```

```json
{
  "latestVersionCode": 102,
  "latestVersionName": "1.0.2",
  "minSupportedVersionCode": 101,
  "releaseId": "release-example-102",
  "updateNotes": "修复问题并改善体验",
  "download": {
    "type": "apk",
    "url": "https://downloads.example.com/fcpg-1.0.2.apk",
    "sizeBytes": 25000000,
    "sha256": "发布时填写实际文件的 SHA-256"
  }
}
```

示例中的版本、地址、文件大小和摘要均非真实发布数据。iOS 的数字构建号获取方式、渠道标识的固化方式，以及历史已发布版本与版本号对应关系需结合实际包确认；不可简单把 `manifest.json` 的当前值视为线上用户版本。服务端必须校验平台、渠道、包标识与最低版本配置，保证 `minSupportedVersionCode <= latestVersionCode`。商店渠道使用 `store` 类型及对应商店链接；未命中灰度或没有可用目标时返回明确的无更新结果。返回更新目标与最低版本必须使用同一套渠道、兼容性和灰度规则。

## 4. 客户端实现建议

- 在 `App.vue` 的应用启动生命周期协调检查，等待 `plus` 就绪；更新业务抽取到独立服务，避免与当前启动页关闭逻辑和首页组件耦合。用 `#ifdef APP-PLUS` 隔离原生 API，H5 不执行原生流程。
- 使用原生运行时取得已安装包版本并核实各平台的数字版本号；当前开发分支 `manifest.json` 标注为 `1.0.1-dev` / `101`，只能代表待打包配置，不等于线上已发布版本。不要将 WGT 资源版本误当作原生包版本。[uni-app 版本说明](https://uniapp.dcloud.net.cn/collocation/manifest.html)
- 版本检查使用独立、不自动携带 token 的请求路径；现有 `common/uni.interface.js` 会把 token 附到请求数据，不能直接假定符合该契约。不要在日志输出完整下载地址中的敏感参数。
- 可选更新展示版本、说明、稍后再说和立即更新；强制更新不提供跳过。语言接入 `common/lang/po.js` 与 `common/lang/en.js`。
- Android 官网包展示下载进度；处理取消、断网、超时、空间不足、校验失败、权限拒绝、用户取消安装和系统返回等情况，可重试。安装器发起成功不代表安装完成；回到应用或重启后重新读取实际版本再判断。
- 必须限制 HTTPS 地址及允许的下载域名和重定向目标；验证下载文件大小及 SHA-256 后才唤起安装。摘要通过可信 HTTPS 接口传输；评估并验证当前 uni-app 运行时计算文件 SHA-256 的可用能力，必要时使用经过审查的原生插件。哈希校验不能替代 APK 签名及可靠的发布链。
- 检查 Android 包名和既有签名证书一致、版本码递增。未知来源安装权限和系统提示以实际目标 SDK、设备及打包配置验证，禁止假设可静默安装。

## 5. 后台与发布流程

后台建议支持按平台、渠道创建版本草稿，配置版本码、最低版本、说明、安装渠道、安装包地址、大小和 SHA-256，并记录操作者与时间；上传文件完成、签名和摘要验证后才允许发布。分阶段灰度、暂停、恢复、撤销及审计；上调最低版本前确认目标包在相应渠道和地区已可下载。灰度设备需稳定分组，且强制门槛与实际可获得版本一致。

发布顺序：打包并确认版本和签名 → 上传至 HTTPS 存储/CDN → 验证下载、摘要和覆盖安装 → 配置小范围可选更新 → 观察成功与失败 → 扩大范围 → 确有必要再提升最低支持版本。出现问题时撤回策略或下调最低版本、发布更高版本修复；Android 一般不能依赖直接安装更低版本完成回退。保留检查、下载、安装发起及新版本启动等匿名汇总事件，注意区分安装发起与安装成功。

## 6. 验收清单

- 同版本、较新版本、可选更新、强制更新及最低版本边界；渠道、平台和灰度隔离。
- 首次启动、后台返回、连续点击、公告同时出现、取消后再次提醒及多语言。
- 下载中断、超时、弱网、空间不足、摘要不一致、不可用链接、权限拒绝、用户取消及重试。
- 使用真实已安装旧包验证同签名覆盖安装、安装后版本读取、数据保留；覆盖不同 Android 版本及厂商设备。
- iOS 商店或实际发行渠道的更新可用性；Google Play 按其测试轨道验证；H5 不触发原生更新。
- 检查接口不可用、强制策略撤销及服务端最低版本调整；不能把安装器启动当作升级成功。

## 7. 后端代码核对结论

1. 现有 `bus_packageManager` 和 `clientGetPackageInfo` 可以继续作为兼容下载入口，但不适合作为版本发布历史。
2. Android 包名已由项目方确认是 `uni.app.UNI2BD90B9`；实际发行渠道、已发布版本码、签名证书指纹和可用打包密钥仍需在首个真实 APK 上确认，新包必须与已安装旧包使用相同包名和可升级签名。
3. iOS 当前代码只打开固定的 iOS 下载页；`mobileconfig` 不能等同于 App Store 更新机制，必须按实际发行渠道确定跳转地址。
4. 现有 `common/uni.interface.js` 会自动把本地 token 放入请求数据，版本检查应使用独立的公开请求方法，不能直接复用为“无需登录”的契约。
5. 当前 `manifest.json` 没有看到 `INSTALL_PACKAGES` / `REQUEST_INSTALL_PACKAGES`；若采用非 Google Play 的 Android APK 安装，需要在打包配置和真实设备上验证权限及系统设置流程。
6. 旧版 App 没有版本检查代码，无法被新增接口主动唤醒。旧版只能通过现有分享页、首页/公告 Banner、二维码落地页等已有入口，先安装一个带更新能力的“桥接版本”。

## 8. 本项目的分阶段实施顺序

### 阶段 0：发行基线确认（开始写代码前）

1. 从线上或测试设备取一份当前真实 APK，记录包名、`versionName`、`versionCode`、签名证书 SHA-256、目标 SDK 和发行渠道。
2. 确认下载域名、HTTPS 证书、是否使用 CDN，以及 Android 是否存在 Google Play 渠道。
3. 确定桥接版本号（必须大于线上已发布最大 `versionCode`）和下一版本号；不能仅依据仓库中的 `100` 推断线上版本。

### 阶段 1：后端版本中心

新增独立 `app_release`（名称可按后端命名规范调整）模型，至少包含：

| 字段 | 作用 |
| --- | --- |
| `platform` / `channel` | `android`、`ios`、`h5` 与 `official`、`play` 等渠道隔离 |
| `package_id` | 防止把其他 App 的包误发给当前客户端 |
| `version_name` / `version_code` | 展示版本与单调递增比较值 |
| `min_supported_version_code` | 低于该值返回强制更新 |
| `status` | 草稿、灰度、已发布、暂停、撤回 |
| `update_mode` | 可选或强制；强制仍需受最低版本规则约束 |
| `notes` | 葡语/英语更新说明，至少保留默认语言 |
| `download_type` / `download_url` | `apk`、`store`、`landing_page` 等 |
| `file_size` / `sha256` | 下载前后的完整性校验与展示 |
| `rollout_percent` / `target_rule` | 灰度比例或用户分组规则 |
| `published_at`、`created_by`、`updated_by` | 发布和审计 |

新增公开只读检查接口，例如 `POST /api/app/version/check`，不要求登录、不返回 token、不依赖旧的广告/安装包分页结构。接口按平台、渠道、包标识、版本码选择“该设备实际可获得”的目标版本，并返回 `none`、`optional` 或 `force` 三种结果。后台管理接口负责草稿、上传、校验、发布、灰度、暂停、撤回和审计。

现有 `clientGetPackageInfo` 保持不变。发布 Android 版本时，可同步把旧表的 Android 地址指向可用的最新 APK，确保没有更新能力的旧 App 仍能通过分享页下载桥接版本。

### 阶段 2：App 更新协调器

新增独立的 `common/appUpdate`（或同等目录）服务，不把业务逻辑写进首页或分享页：

1. `App.vue` 在 `plusready` 后调用一次检查；从后台返回按节流策略再检查；增加手动检查入口时复用同一服务。
2. 使用 `uni.getSystemInfoSync().appVersionCode` 或已验证的 `plus.runtime.versionCode` 取得数字版本，并以 `plus.runtime.version` 取得展示版本；在真实基座上确认 API 返回值。
3. 版本检查请求不携带登录 token；检查失败不误判为“已是最新”，普通用户继续使用并稍后重试。
4. `optional` 显示更新说明、稍后和立即更新；`force` 跳转不可绕过的更新页，页面只保留更新、重试和联系客服/帮助出口。
5. 更新页和弹窗放入 `component/` 或独立 `pages/update/`，语言文本加入 `common/lang/po.js`、`common/lang/en.js`。

### 阶段 3：Android 下载与安装

仅对允许直接分发 APK 的渠道实现：

1. 校验返回地址为 HTTPS 且域名在白名单内，不接受任意跳转地址。
2. 使用 `uni.downloadFile` 下载并监听 `onProgressUpdate`；处理取消、断网、超时、空间不足、重试和残留文件。
3. 对文件大小、扩展名和 SHA-256 做校验；校验失败不得唤起安装器。
4. 调用 `plus.runtime.install` 唤起 Android 安装器；安装发起不等于安装成功，回到 App 或重启后重新读取版本码确认结果。
5. 在 `manifest.json` 的 Android 权限中按实际打包渠道增加并验证安装相关权限；Google Play 渠道不得走自下载 APK。

Google Play 版本由 Play 商店或 Play In-App Updates 处理；iOS 只跳转 App Store 或公司确认的合法发行页，不能用 APK 流程，也不能把 `mobileconfig` 当作 App 安装包更新。

### 阶段 4：后台管理页面

在现有“安装包管理”旁增加“版本发布/更新策略”页面，不破坏旧页面。页面最小功能：上传 APK、自动计算或服务端计算摘要、录入版本码/最低版本/更新说明、选择渠道、预览下载地址、灰度发布、暂停/撤回、查看发布记录。发布前校验：文件可下载、包名一致、签名一致、版本码大于历史最大值、最低版本不高于目标版本。

### 阶段 5：灰度与正式发布

先发布桥接版本为可选更新，观察下载、安装发起和新版本启动数据；确认稳定后再发布业务修复版本。只有当目标包在对应渠道可稳定下载时，才提高 `min_supported_version_code`。发生问题时优先暂停或撤回策略并发布更高版本，不依赖直接安装低版本回滚。

## 9. 老版本用户的实际迁移路径

```text
没有更新能力的旧版
        │
        ├─ 现有分享页 / 首页 Banner / 二维码落地页
        │             ↓
        │       下载并安装桥接版本
        │             ↓
        └─ 桥接版本开始检查版本
                      ↓
          可选更新 → 用户确认后升级
          强制更新 → 仅允许下载、安装、重试
```

因此第一版不能直接对旧版本“远程强制弹窗”。如果确实要停止旧版访问敏感业务，后端可以在业务接口返回统一的升级提示和桥接下载地址，但这只能作为兼容兜底，不能替代客户端更新能力，也不能当作安全认证。

## 10. 首批交付边界与验收结果

首批建议只做“Android 官网/允许直发渠道 + 可选/强制更新 + 可重试下载 + 系统安装器 + 后端版本发布”闭环；Google Play、iOS 商店内更新、WGT 热更新、复杂设备灰度作为后续渠道能力，不与首批 APK 流程混在一起。

已完成的代码闭环：后端独立版本表和公开检查接口、后台版本发布页、App 启动/回前台检查、可选/强制系统弹窗、Android 下载进度、系统安装器和失败重试；旧版兼容入口 `clientGetPackageInfo` 保留。后端开发接口已在本机测试库验证无发布记录时返回 `result=none`，并同时验证了 `/app/version/check` 与 `/api/app/version/check`。

尚未完成的发布验收：本地 App-Plus 编译链已经通过，但还必须由 HBuilderX 云打包产出 `versionCode=101` APK，再用真实旧 APK 和真实签名做真机验证，包括同签名覆盖安装、版本码递增、首次启动检查、后台返回检查、可选/强制边界、下载失败重试、摘要错误、安装权限拒绝、用户取消安装、安装完成后的版本复核，以及旧版通过分享页安装桥接版本。后端和流水线会计算并保存 SHA-256，但当前客户端尚未在 uni-app JS 层强制校验下载文件摘要；正式发布前需用真实基座验证 `plus.io` 能力，或接入经过审查的原生哈希插件后再把摘要校验设为安装前门禁。当前服务的 `rolloutPercent` 仍是数据字段，公开检查尚未按设备稳定分组执行灰度。自动打包上传还需要 CI 平台、Android 签名/云打包凭据、发布接口令牌、开发服务器部署和下载存储配置，未在未提供凭据的情况下启用正式流水线。

参考：[HTML5+ Runtime](https://www.html5plus.org/specification/Runtime.html)、[Android 未知来源安装](https://developer.android.com/studio/publish)、[Android 应用签名](https://developer.android.com/studio/publish/app-signing)、[Google Play 应用内更新](https://developer.android.com/guide/playcore/in-app-updates)、[DCloud Android 权限说明](https://uniapp.dcloud.net.cn/tutorial/app-permission-android.html)、[Apple 开发者协议](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)。

## 11. 自动打包上传配置

App 仓库新增 `.github/workflows/app-release.yml`、`scripts/setAppVersion.js` 和 `scripts/publishRelease.js`。流水线监听 `develop` push，但只有仓库变量 `FCPG_RELEASE_ENABLED=true` 时才执行，避免在凭据未配置时误打包。实际启用前需要：

1. 配置能访问开发服务器的 Windows self-hosted Runner，并安装已登录 DCloud 账号的 HBuilderX；Runner 标签为 `self-hosted`、`Windows`、`hbuilderx`，仓库变量 `HBUILDERX_CLI` 指向 `cli.exe`。
2. 配置仓库 Secret `FCPG_APP_RELEASE_API_URL`（开发环境应指向 `/api/app/version/ci-upload`）和 `FCPG_APP_RELEASE_TOKEN`；后端进程设置同值的 `FCPG_APP_RELEASE_UPLOAD_TOKEN`。令牌不写入仓库。
3. 如版本中心不在当前业务环境，配置仓库变量 `FCPG_APP_UPDATE_BASE_URL`，流水线会以 `VUE_APP_UPDATE_BASE_URL` 注入 App；当前 `192.168.1.130:8090` 尚未部署本次版本路由，不能直接使用。
4. 确认 HBuilderX 云打包使用与已运营 APK 相同的包名和签名证书；先用测试版本验证覆盖安装，再把 `FCPG_RELEASE_ENABLED` 打开。

流水线以 `GITHUB_RUN_NUMBER` 生成递增版本号（也可用 `APP_VERSION_CODE` 覆盖），调用 HBuilderX CLI 生成正式 APK，读取 `unpackage` 下的产物，上传后端，由后端计算文件大小和 SHA-256 并按 `publish=true` 发布。当前本机已消除 App-Plus 源码编译错误，但云打包仍受签名配置、HBuilderX 云打包能力及环境凭据限制；仓库没有可直接复用的正式签名、开发服务器 CI 令牌或真实 Runner，因此流水线保持关闭。
