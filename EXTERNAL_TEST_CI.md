# Android 外测自动构建

此流程只服务 `test` 分支的外测，不部署正式环境。功能代码推送后，工作流会尝试云打包、核对产物并向外测版本中心创建**草稿**；仅修改 Markdown 不触发构建。首次启用前需实测，当前不自动发布。

## Runner 和仓库配置

- 准备有 `self-hosted`、`Windows`、`hbuilderx` 标签的专用 Windows Runner，安装 Node.js 18+、Java、HBuilderX 并登录有云打包权限的账号。Runner 必须能够访问外测后端和受信的云下载主机，并能读取项目需要的构建依赖。
- 仓库变量：`FCPG_TEST_RELEASE_ENABLED`（验证前不设置为 `true`）、`HBUILDERX_CLI`、`FCPG_ANDROID_AAPT`、`FCPG_ANDROID_APKSIGNER_JAR`、`FCPG_HBUILDER_DOWNLOAD_HOST`、`FCPG_TEST_CERT_FILE`、`FCPG_TEST_CERT_ALIAS`、`FCPG_UNI_MODULES_SOURCE`。下载主机须由项目方根据真实云打包链接和重定向核实；仅允许该 HTTPS 主机，不记录链接。
- Git 忽略 `uni_modules`。Runner 从 `FCPG_UNI_MODULES_SOURCE` 复制依赖至干净检出目录，并核对仓库中的 `scripts/uni-modules.sha256`；源目录变化将停止构建。依赖升级时应先审查来源和改动，再更新摘要与该快照。
- 仓库密钥：`FCPG_TEST_CERT_PASSWORD`、`FCPG_TEST_STORE_PASSWORD`、`FCPG_TEST_RELEASE_TOKEN`。外测 Go 服务还须在部署环境中配置对应的 `FCPG_APP_RELEASE_UPLOAD_TOKEN`；不要把令牌或证书密码写入仓库。
- 外测接口和版本查询固定为 `http://52.67.128.45:2009`。外测接口使用 HTTP，令牌应只在可信网络中传输；要用于持续自动化，应先为测试服务配置受信 HTTPS 和访问限制。

## 首次验收

1. 检查 Runner 登录状态、证书权限及 HBuilderX 云下载主机；确认外测数据库和文件存储与正式环境隔离。
2. 检查外测版本中心的最高版本，并确认 Runner 能访问版本检查接口和 CI 上传接口。工作流会拒绝生成不高于现有已发布版本的包，但并发的其他发布或草稿仍需运维协调。
3. 在 `test` 上手动运行工作流，查看是否使用本次云打包结果、签名与版本是否匹配，以及是否只生成草稿。
4. 核对草稿 APK 的版本、文件大小、SHA-256、下载地址及测试设备实际可访问性。当前后端上传返回的 `uploads/` 路径在外测需要 `/api/` 前缀；未修复并验证之前，人工修正草稿路径并发布，不能启用自动发布。
5. 完成一轮真机安装与失败回滚验证后，再设计自动发布的校验和开关。当前工作流不具备自动发布能力，也不能视为正式发布方案。
