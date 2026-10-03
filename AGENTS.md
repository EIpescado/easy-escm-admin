# SoybeanAdmin (easy-escm) — 智能体指南

本项目是 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) v2.2.0 的分支（上游包名仍为 `soybean-admin`），技术上基于 Vue 3 / Vite 8 / TypeScript / NaiveUI / UnoCSS，但已改造为 **easy-escm** 管理后台：接入真实认证、**后端动态菜单**与用户/角色/菜单管理页。改动集中在 `src/service/api/`、`src/store/modules/{auth,route}/`、`src/views/manage/`。不要按原版模板的默认行为假设。

## 快速命令

| 操作                | 命令                                                   |
| ------------------- | ------------------------------------------------------ |
| 启动开发(mode=test) | `pnpm dev`（端口 19527，自动打开浏览器）               |
| 启动生产模式        | `pnpm dev:prod`                                        |
| 构建生产 / 测试     | `pnpm build` / `pnpm build:test`                       |
| 类型检查            | `pnpm typecheck`（`vue-tsc --noEmit --skipLibCheck`）  |
| 代码检查            | `pnpm lint`（`oxlint --fix && eslint --fix .`）        |
| 格式化              | `pnpm fmt`（`oxfmt`）                                  |
| 预览构建产物        | `pnpm preview`（端口 19725）                           |
| 重新生成路由        | `pnpm gen-route`                                       |
| 提交                | `pnpm commit`（`sa git-commit`，Conventional Commits） |

- **没有测试框架，也没有 `pnpm test`**。验证手段是 `pnpm typecheck` + `pnpm lint` + 手动跑 dev server。
- pre-commit 钩子顺序：`typecheck -> lint -> fmt -> git diff --exit-code`。若代码未格式化会使提交失败，提交前先跑 `pnpm fmt`。

## 本地验证与 dev server（重要）

- **19527 是开发者（用户）手动启动的 dev server 端口，绝不要杀掉占用 19527 的进程。** 不要执行 `Get-NetTCPConnection -LocalPort 19527 | Stop-Process` 之类的"按端口杀进程"。
- 需要浏览器验证时，**优先复用已在运行的 `http://localhost:19527`**：临时探针文件（如根目录 `preview.html` + `src/preview/`）会被该 dev server 通过 HMR 直接加载，无需另起服务。
- 确实需要独立实例时，使用**专用端口并禁止端口回退**：`pnpm dev --port 19627 --strictPort`；收尾时只停止**自己启动的那个后台进程**（按返回的后台任务/PID），不要按端口杀。
- 由于 Vite 在端口被占用时会自动 +1，**自己起的服务可能并不在 19527 上**；因此按固定端口杀进程极易误杀用户的 19527。任何情况下都不要这样做。
- 验证用的临时文件（`preview.html`、`src/preview/`）**用完必须删除，且不要提交**。

## 后端依赖（重要）

- 接口地址由 `.env.test` / `.env.prod` 的 `VITE_SERVICE_BASE_URL` 决定：开发默认 `http://localhost:39999`，生产为 Apifox mock（`.env` 为公共配置，两个 mode 文件只覆盖该项）。
- 开发时 `VITE_HTTP_PROXY=Y`，请求经 Vite 代理 `/proxy-default`（见 `build/config/proxy.ts`）。
- 当前为**动态路由模式**（`.env` 的 `VITE_AUTH_ROUTE_MODE=dynamic`）：登录与菜单分别依赖后端 `/auth/login`、`/system/user/info`、`/system/menu/tree`。**后端不可用则无法进入系统**，不要误以为是前端 bug。
- 系统管理接口统一带 `/system/` 前缀：`/system/user/**`、`/system/role/**`、`/system/menu/**`（旧的无前缀 `/user`、`/role`、`/menu` 已废弃）。
- 响应信封 `{ code, message, res }`：`code` 等于 `VITE_SERVICE_SUCCESS_CODE`（`0`）即成功，`request` 自动解包返回 `res`（`src/service/request/index.ts`）。
- 认证头不是 `Authorization`，而是 `VITE_AUTH_HEADER_NAME=easy-auth`，值为 `Bearer <token>`。

## 动态路由 / 菜单（本分支核心）

- 路由由后端 `/system/menu/tree` 返回的 `MenuNode[]` 驱动，经 `transformMenuTreeToRoutes()` 转为 Elegant 路由（`src/store/modules/route/shared.ts`）。
- 后端菜单的 `component` 是字符串，如 `layout.base$view.manage_user`：`layout.*` 只允许 `base`/`blank`，`view.*` 必须能在 `src/views/**` 找到（组件名经 `@elegant-router/vue` 生成到 `src/router/elegant/`）。**找不到对应 view 的菜单会被跳过并打印 `[route] skip menu ...` 警告**，而非报错。
- 因此：新增/重命名 `src/views` 下的页面后，必须让路由重新生成（dev server 会自动生成，或手动 `pnpm gen-route`），否则动态菜单解析不到该组件。
- 菜单 i18n key 约定为 `route.<routerName>`，`MenuNode.name` 即路由名；缺少对应 `route.*` 文案时菜单会直接显示原始 key。
- 路由含 `meta.isDev` 时仅开发环境加载（`filterRoutesByDev`，见 `src/constants/env.ts` 的 `isDev`）。

## 项目结构

- **pnpm monorepo**，工作空间包在 `packages/*`：`@sa/scripts`（`pnpm sa <cmd>` CLI，支撑多数 npm scripts）、`@sa/axios`（实际使用的请求库）、`@sa/hooks`/`@sa/utils`/`@sa/color`/`@sa/materials`/`@sa/uno-preset`。`packages/alova` 存在但 `src/` 未引用。
- **入口** `src/main.ts`：bootstrap → NProgress/icons/dayjs → Pinia → Vue Router → i18n → 挂载。
- **状态**（Pinia，`src/store/modules/`）：`app`、`auth`、`route`、`tab`、`theme`。
- **API 层**：`src/service/request/`（axios 封装与拦截），`src/service/api/` 按模块拆分并在 `index.ts` 汇总导出；对应类型在 `src/typings/api/*.d.ts`（`Api.*` 命名空间）。
- **国际化**：`vue-i18n`，语言文件 `src/locales/langs/{zh-cn,en-us}.ts`。
- **样式**：UnoCSS（presetWind3 + 自定义 `@sa/uno-preset`）+ SCSS，Vite 自动注入 `@use "@/styles/scss/global.scss" as *`。

## 自动生成文件（勿手改）

- `src/router/elegant/{routes,imports,transform}.ts`
- `src/typings/elegant-router.d.ts`
- `src/typings/components.d.ts`

由 `@elegant-router/vue` 和 `unplugin-vue-components` 生成，已在 `.oxfmtrc.json` 的 `ignorePatterns` 中排除。

## 工具链注意事项

- **格式化器是 `oxfmt`，不是 Prettier**。`.oxfmtrc.json`：单引号、无尾逗号、箭头函数单参不加括号、行宽 120。
- **检查器以 `oxlint` 为主、`eslint` 为辅**（`@soybeanjs/eslint-config-vue`，见 `eslint.config.js`）。
- **类型检查用 `vue-tsc`，不是 `tsc`**。
- **必须使用 pnpm**（monorepo；npm/yarn 无法运行；`pnpm-workspace.yaml` 设 `shamefullyHoist: true`）。Node >=20.19，pnpm >=10.5。
- 组件自动导入：**不要手动 import 组件**。
- 图标：`@iconify/vue` + `vite-plugin-svg-icons`；前缀 `icon-`，本地图标前缀 `icon-local-`。
- npm 源：`.npmrc` 指向 `registry.npmmirror.com`。

## 代码规范

- 模板中组件用 PascalCase；`icon-*` 前缀组件不受此规则限制。
- 路径别名：`@/` → `src/`，`~/` → 项目根。
- Git 提交用 `pnpm commit`（Conventional Commits）。
