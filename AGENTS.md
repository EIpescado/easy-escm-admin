# SoybeanAdmin — 智能体指南

本项目是 SoybeanAdmin v2.2.0（上游：`soybeanjs/soybean-admin`），一个基于 Vue 3 / Vite 8 / TypeScript / NaiveUI / UnoCSS 的后台管理模板。

## 快速命令

| 操作           | 命令                                                            |
| -------------- | --------------------------------------------------------------- |
| 启动开发服务器 | `pnpm dev`（mode=test，端口 19527）                             |
| 启动生产模式   | `pnpm dev:prod`                                                 |
| 构建生产       | `pnpm build`                                                    |
| 构建测试       | `pnpm build:test`                                               |
| 类型检查       | `pnpm typecheck`（即 `vue-tsc --noEmit --skipLibCheck`）        |
| 代码检查       | `pnpm lint`（即 `oxlint --fix && eslint --fix .`）              |
| 格式化         | `pnpm fmt`（即 `oxfmt`）                                        |
| 提交           | `pnpm commit`（通过 `sa git-commit` 生成 Conventional Commits） |
| 预览构建产物   | `pnpm preview`（端口 9725）                                     |

提交前钩子顺序：`typecheck -> lint -> fmt -> git diff --exit-code`。

## 项目结构

- **pnpm monorepo** — 工作空间包位于 `packages/*`：
  - `@sa/scripts` — CLI 工具（`pnpm sa <cmd>`），供多数 npm scripts 使用
  - `@sa/axios`、`@sa/alova` — 两个请求库
  - `@sa/hooks`、`@sa/utils`、`@sa/color`、`@sa/materials`、`@sa/uno-preset` — 共享库
- **入口文件**: `src/main.ts` — 依次引导加载、NProgress、图标、dayjs、Pinia 状态、Vue Router、i18n，最后挂载
- **路由**: `vue-router`，默认 history 模式。路由由 `@elegant-router/vue` Vite 插件自动生成到 `src/router/elegant/`。如需重新生成，执行 `pnpm gen-route`
- **状态管理**（Pinia）：`app`、`auth`、`route`、`tab`、`theme`，位于 `src/store/modules/`
- **国际化**: `vue-i18n`，语言文件在 `src/locales/langs/`
- **样式**: UnoCSS（presetWind3 + 自定义 `@sa/uno-preset`）+ SCSS（Vite 自动注入 `@use "@/styles/scss/global.scss" as *`）
- **API 层**: `@sa/axios` 作为主请求库，`@sa/alova` 用于替代请求；开发模式下通过 `VITE_HTTP_PROXY=Y` 启用代理
- **权限**: 默认使用静态路由模式（`VITE_AUTH_ROUTE_MODE=static`，超级角色 `R_SUPER`）

## 工具链注意事项

- **格式化器**: 使用 `oxfmt`（**不是** Prettier）。配置文件 `.oxfmtrc.json` — 单引号、无尾逗号、箭头函数单一参数不加括号、行宽 120
- **代码检查**: 主检查器为 `oxlint`，辅以 `eslint`（使用 `@soybeanjs/eslint-config-vue` 配置）
- **类型检查**: 使用 `vue-tsc`（不是 `tsc`）
- **包管理器**: 必须使用 `pnpm >=10.5`（npm 或 yarn 无法运行）
- **环境模式**: `test`（默认开发模式）和 `prod`；环境变量分别在 `.env.test` 和 `.env.prod` 中
- **组件自动导入**: 使用 `unplugin-vue-components`，**不要手动 import 组件**
- **图标**: 使用 `@iconify/vue` + `vite-plugin-svg-icons`；前缀 `icon-`（本地图标前缀 `icon-local-`）
- **开发端口**: 19527，预览端口 19725
- **自动生成文件**（请勿手动编辑）：`src/typings/components.d.ts`、`src/typings/elegant-router.d.ts`、`src/router/elegant/` 目录下的所有文件

## 代码规范

- Vue 组件在模板中使用 PascalCase，`icon-*` 前缀的组件名不受此规则限制
- 路径别名：`@/` 指向 `src/`，`~/` 指向项目根目录
- Git 提交：使用 `pnpm commit`（Conventional Commits 格式）
- 环境要求：Node >=20.19.0，pnpm >=10.5.0
- 已配置 npm 镜像源：`.npmrc` 中设置 `registry=https://registry.npmmirror.com/`
