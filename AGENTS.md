# 项目协作规范

本文件适用于整个仓库。开始修改前先阅读本文件、`PROJECT_ANALYSIS.md` 和 `CHANGELOG.md` 中相关记录，并核对当前代码；分析文档是快照，实际行为以代码为准。

## 项目与修改原则

- 本项目是 Vue 2 / uni-app 项目，兼顾 H5 和 App。保留现有 `#ifdef` / `#ifndef` 平台条件编译和 uni-app API，修改时检查受影响平台。
- `pages.json` 管理页面配置，`pages/index.vue` 组合首页、收藏和分享；页面、公共组件、API 和公共逻辑分别优先放在 `pages/`、`component/`、`api/` 和 `common/` 等现有目录。
- 网络请求先检查 `api/`、`common/uni.interface.js` 和 `common/config.js` 的现有约定。涉及环境地址、认证信息、外部跳转或线上数据时，先确认影响范围；不要将密钥、令牌或个人数据写入代码、日志和文档。
- 语言文本参考 `common/lang/po.js` 和 `common/lang/en.js`；涉及文案时检查相关语言和默认语言。
- 保持既有风格和改动范围，不随意升级框架、重写模块、修改锁文件或覆盖用户已有改动。`node_modules/`、`uni_modules/`、`unpackage/` 被 Git 忽略，不要将生成物或依赖当作常规源码修改；确需修改时先确认来源及持久化方式。

## 验证

- 依据改动选择相关检查，记录实际执行的命令、结果和未验证的范围。项目 `package.json` 未定义测试或 lint 脚本，不能声称它们已通过。
- H5 构建脚本为 `npm run build:h5`；是否能运行取决于本地依赖和 uni-app 环境。构建可能写入已有输出，执行前检查输出位置和现有文件。
- `npm run build:app-plus` 会执行 `renameApk.js`，涉及构建输出和 APK 重命名；执行前先检查输出位置及影响，不把它当作无副作用的检查。
- 涉及界面、导航、接口或平台分支的修改，尽可能在对应目标环境验证关键交互和异常状态；无法验证时明确说明。

## 修改记录（必须）

- 每次实际修改仓库内容，交付前都在根目录 `CHANGELOG.md` 顶部新增一条记录；同一任务的多次相关修改可合并成一条。仅阅读、分析而未修改文件时无需新增记录。
- 使用本地日期和简短标题，写明修改目的、主要文件或范围、实际验证结果及未验证事项。客观记录失败或阻碍，不编造验证结果。
- 保留历史记录，不覆盖或删除旧条目；不记录敏感数据。若项目结构、运行方式或重要约定发生变化，同步更新 `PROJECT_ANALYSIS.md`。

## 测试发布约定

- 用户要求后续改动在检查无问题后提交到对应项目的 `test` 分支，并通过 Jenkins 部署测试环境；发布前确认分支、实际目标、环境配置及改动范围，部署后核对日志和功能。正式环境不因测试部署而自动更新。
- FCPG 源码是本仓库；HBuilderX 发行的 H5 网页资源按团队现有流程提交至 `E:\sjl_hbuilder\fcpg\WebGameAggregation_client` 仓库的 `test` 分支，由 Jenkins `fcpgweb_test` 部署。项目方要求先同步该产物仓库的 `master` 到 `test`，但本次核对发现 `master` 产物指向正式接口，项目方要求先制作指向 `http://52.67.128.45:2009` 的测试产物，核实后再推送和部署。H5 资源不是 Android/iOS 安装包。
- Go 后端 `WebAggregationPlatform_Sever` 与管理前端 `WebAggregationPlatform_Sever_Client` 分别有自己的 `test` 分支和 Jenkins 测试任务；不得把其他项目的“开发-聚合后台”任务当作 FCPG 服务。修改、提交和部署结果及未验证事项应记入相应项目的 Markdown 记录。
