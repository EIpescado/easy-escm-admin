# SoybeanAdmin (easy-escm) — 智能体指南

本项目是 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) v2.2.0 的分支（上游包名仍为 `soybean-admin`），技术上基于 Vue 3 / Vite 8 / TypeScript / NaiveUI / UnoCSS，但已改造为 **easy-escm** 管理后台：接入真实认证、**后端动态菜单**与用户/角色/菜单管理页。改动集中在 `src/service/api/`、`src/store/modules/{auth,route}/`、`src/views/manage/`。不要按原版模板的默认行为假设。

> ⚠️ `docs/v3.md` 是未来 **v3.0 全栈重构草案**（ubean / vite-plus / SoybeanUI / Drizzle），**不是当前代码架构**。当前仍是上述 v2 技术栈；不要照该文档改代码。

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
- simple-git-hooks：`pre-commit` 为 `typecheck -> lint -> fmt -> git diff --exit-code`，`commit-msg` 为 `pnpm sa git-commit-verify`（Conventional Commits）。改动未格式化会让 pre-commit 失败，提交前先跑 `pnpm fmt`。

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
- `Accept-Language` 在每次请求时取自应用当前 locale（`getAcceptLanguage()`，`src/service/request/shared.ts`），会覆盖浏览器自带语言；切换语言后后端文案随之切换。
- 登录请求体在 `src/service/api/auth.ts` 中硬编码了 `clientId: 'escm-pc-api'`、`grantType: 'password'`、`orgCode: 'HFY'`；`fetchGetUserRoutes` 固定带 `rootId: 1`。切换后端 / 租户时先改这里。

## 动态路由 / 菜单（本分支核心）

- 路由由后端 `/system/menu/tree` 返回的 `MenuNode[]` 驱动，经 `transformMenuTreeToRoutes()` 转为 Elegant 路由（`src/store/modules/route/shared.ts`）。
- 后端菜单的 `component` 是字符串，如 `layout.base$view.manage_user`：`layout.*` 只允许 `base`/`blank`，`view.*` 必须能在 `src/views/**` 找到（组件名经 `@elegant-router/vue` 生成到 `src/router/elegant/`）。**找不到对应 view 的菜单会被跳过并打印 `[route] skip menu ...` 警告**，而非报错。
- 因此：新增/重命名 `src/views` 下的页面后，必须让路由重新生成（dev server 会自动生成，或手动 `pnpm gen-route`），否则动态菜单解析不到该组件。
- 菜单 i18n key 约定为 `route.<routerName>`，`MenuNode.name` 即路由名；缺少对应 `route.*` 文案时菜单会直接显示原始 key。
- 路由含 `meta.isDev` 时仅开发环境加载（`filterRoutesByDev`，见 `src/constants/env.ts` 的 `isDev`）。

## 系统管理页（本分支新增）

- 页面在 `src/views/manage/{user,user-detail,role,menu,dict,user-dict}/`，路由名固定为 `manage_user` / `manage_role` / `manage_menu` / `manage_dict` / `manage_user-dict`（见 `src/router/elegant/imports.ts`）。
- 用户详情是独立页面 `src/views/manage/user-detail/[id].vue`（路由 `manage_user-detail`，路径 `/manage/user-detail/:id`，参数经 `props.id` 注入），由用户列表的「详情」行按钮进入。dynamic 模式下需后端菜单提供对应节点（建议 `hideInMenu: true`）才会注册该路由。
- 按钮权限由后端菜单 `meta.buttons` 下发，按 `position` 分组：`top`（工具栏）/ `row`（行操作）/ `left-top`（右侧面板工具栏）/ `left-row`（右侧面板行操作）；用 `usePageButtons()`（`src/hooks/business/page-buttons.ts`）读取，`click` 动作映射到 i18n，未知动作回退后端 `name`。
- 按钮可用性可配置：页面用 `usePageButtonState<Row>(rules)`（同文件）声明规则，规则以 `click` 为 key、接收 `{ rows, position }` 并返回 `true` 表示禁用（top 的 `rows` 是勾选行，row 的 `rows` 是当前行）。行按钮经 `TableRowOperation` 的 `disabled`、工具栏按钮经 `TableToolbarButtons` 的 `:disabled` 生效。
- 列表查询走后端动态查询模型：`PageQo` 的 `items`（条件）/ `orders`（排序）/ `exportItems`（导出列），与后端 `BaseQo` 对齐（`src/typings/api/system-manage.d.ts`），前端在 `src/components/advanced/query-filter/` 组装。
- 导出复用同一 search 接口并带 `export: true`，后端返回 xlsx 流（`responseType: 'blob'`）。
- 列表页统一走 `<ManageList>`（`src/components/advanced/manage-list.vue`，内部用 `useManageTable()`）。页面只给 `tableKey` / `api` / `fields` / `columns`，外加可选的 `exportApi` / `selection` / `sortable` / `extraItems` / `immediate` / `rowAction` / `buttonRules` / `buttons` / `title`；查询栏、卡片、工具栏按钮、导出、列设置、刷新、排序、分页、行高样式都由组件提供，**页面不要再手写 `QueryFilter` / `NCard` / `TableHeaderOperation` / 操作列**。`rowAction` 会在最左侧生成由路由 `row` 按钮驱动的操作列并按 `buttonRules` 置灰，`v-model`/`ref` 可拿 `getData` 刷新。user 页是样板；role / dict / user-dict 尚未迁移。
- `useManageTable()`（`src/hooks/business/manage-table.ts`）是组件底层的组合式函数：传 `tableKey` / `api` / `columns`（可选 `extraItems` 固定条件、`immediate`、`sortable`），返回 `conditions`、`tablePagination`、`exportItems`、`params`、`buildItems`、`handleSearch` / `handleReset` 等；**菜单页是特例**（前端本地过滤 + 无分页，不用它）。
- `sortable` 默认 `false`，只有 user / role 开启（分页条右侧自动挂 `QuerySortButton`）。排序项与列显隐按 `tableKey` 存 localStorage，`setTableSetting` 按 key 合并，因此两者互不覆盖。
- 排序字段与导出字段规则不同（`src/utils/table.ts`）：`getSortFields()` 返回**所有**数据列（含列设置里未勾选 / 隐藏的列——隐藏不等于不能排序），`getExportItems()` 只取**已勾选且可见**的列。
- 查询条件的 `fast` 反直觉：后端把普通 item **AND** 起来，所以需要 OR 的字段（`code like ? or name like ?`）要标 `fast: true`——`buildFieldSlots()` 先把它们合并成一个「关键词」虚拟字段（`queryFilter.keyword`，锁定 `like`），`toQueryItems()` 再展开成**每个 prop 一条** `fast: true` item。后端 `DynamicConditionInterceptor` 会把本次查询里**所有** `fast` 条件合并成一个 or 组，再与普通条件 AND；`fast` 一律按 `like` 处理、值只取第一个非空值、且**只支持字符类型字段**（数字/日期字段会被忽略并打 WARN），传空串会让整个 or 组恒真——所以「一个字段必须传一行，值不能为空」。
- **字典管理** `manage_dict`：字典主表 + 字典明细两个列表（左右布局、各自查询栏、明细按 `pid` 与主表联动），接口 `/system/dict/**`、`/system/dictEntry/**`。
- **用户字典** `manage_user-dict`：左用户 + 右「拥有字典」列表。右侧数据**直接来自** `/system/dict/userDictDetail` 返回的 `dictList`（后端 `SystemUserDictVo` 的字段就叫 `dictList`，前端类型曾被误写成 `dictIds`），不需要拉全量字典。右侧工具栏的 4 个按钮由后端菜单下发，`click` 分别是 `addUserDict`（弹窗里**搜索**字典——用 `fast` 同时搜 code/name——并多选，不做全量加载）/ `removeUserDict`（作用于表格勾选行）/ `bindUserAllDict` / `removeUserAllDict`。
- **权限树**（角色管理右侧）：数据源用 `/system/menu/wholeTree`；已绑定项取自 `/system/role/menuAndButtonIds`（含菜单 + 按钮 id），保存走 `/system/role/bind`，按 `menuIds` / `buttonIds` 分别提交并自动补全被勾选节点的上级菜单；树按 `meta.i18nKey` 优先、回退 `name` 显示，并用 `getMenuNodeType`（`src/utils/menu.ts`）区分 root/目录/菜单/按钮。

## 数据约定（重要）

- 后端 **Long 一律以字符串返回**；`@sa/axios` 已全局用自定义 JSON 解析**保留大整数为字符串**（`packages/axios/src/{options,shared}.ts`），避免精度丢失。
- 枚举字段经全局 `BaseEnum2KeyWriter` 输出 **两个字段**：`state`（文案，如「启用」）与 `stateEnum`（枚举名，如 `ON`）。判断状态请用 `stateEnum`。
- 列表查询字段用动态 `items`（`prop` 为实体属性名，如 `pid`、`roleCode`、`state`）。

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
- CI（`.github/workflows/linter.yml`）仅在 PR 到 `main` 时跑 `super-linter`，**不跑 typecheck / build**；本地务必自行执行 `pnpm typecheck`。
- 图标：`@iconify/vue` + `vite-plugin-svg-icons`；前缀 `icon-`，本地图标前缀 `icon-local-`。
- npm 源：`.npmrc` 指向 `registry.npmmirror.com`。

## 代码规范

- 模板中组件用 PascalCase；`icon-*` 前缀组件不受此规则限制。
- 路径别名：`@/` → `src/`，`~/` → 项目根。
- Git 提交用 `pnpm commit`（Conventional Commits）。
- **表单提交必须防重复点击：接口返回前不允许再次提交。** 用 `submitting` 状态同时驱动「禁用 + loading」，处理函数开头先拦截，结束后在 `finally` 里复位（请求失败也要复位）：

  ```ts
  const submitting = ref(false);

  async function handleSubmit() {
    if (submitting.value) return;

    // set the flag before the first await, otherwise clicks landing in the same tick slip through
    submitting.value = true;

    try {
      await validate();

      const { error } = await fetchUpdateXxx(model);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        emit('submitted');
      }
    } finally {
      submitting.value = false;
    }
  }
  ```

  提交按钮统一 `:loading="submitting" :disabled="submitting"`；弹窗的 `Esc` / 遮罩点击关闭等其它入口也应在 `submitting` 时拦截。处理函数里的拦截不能省——naive-ui 的 `NButton` 在 `loading` 时会忽略点击，但 `@keyup.enter` 这类不经按钮的入口不会。
  - 表单弹窗**不要手写底部按钮**：用 `FormDialog` 的内置「取消 / 确认」，把提交逻辑通过 `:submit="handleSubmit"` 传入即可——`validate()`、防重复点击（loading + disabled）、提交中拦截关闭都由它负责；只有要换掉底部按钮时才传 `#footer` 插槽。非 `FormDialog` 的表单（如 `pwd-login`）按上面的范式自行加 `submitting`。

- **优先使用官方文档的现成能力，不要自己造轮子。** 组件库能通过属性/配置直接实现的效果，先用官方写法；只有当官方能力确实覆盖不了时才写自定义 `render`/`h()`。动手前先查官方文档（NaiveUI: https://www.naiveui.com/zh-CN/os-theme/components ）。
  - 典型例子：表格文字列的「单行 + 溢出省略号 + hover 提示」**不要**手写 `renderEllipsis` / `NEllipsis`，DataTable 列上直接写 `ellipsis: { tooltip: true }` 即可（naive-ui 会自动把单元格内容包进 `NEllipsis`，`render` 的返回值同样会被包）。只有需要空值占位符（如 `-`）这类官方属性覆盖不到的情况，才补一个一行的 `render: row => row.xxx || '-'`。
