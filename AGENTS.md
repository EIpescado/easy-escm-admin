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

- 菜单分组：`manage`（系统管理）、`message`（消息管理）、`file`（系统文件管理）、`api`（接口管理）都是 `pc-root`（id=1）下的目录（`component: layout.base`，sn 20 / 30 / 40 / 50）。**消息模版 / 公告管理 / 第三方模版**挂在 `message` 下，**文件管理 / 特殊用途文件**挂在 `file` 下，**回调记录 / 第三方系统配置**挂在 `api` 下，其余管理页仍在 `manage` 下；这些页面的路由名与 URL 仍是 `manage_*` / `/manage/*`（只改了菜单归属），要改 URL 需同时把 view 目录挪到对应的 `src/views/<group>/**` 并重新生成 elegant 路由，否则 tab 用的 `getRoutePath` 会和实际路由不一致。`message` / `file` / `api` 是纯菜单目录（没有 view 目录），elegant 不会生成这些 RouteKey，因此 `route.message` / `route.file` / `route.api` 的文案要在 `src/typings/app.d.ts` 的 `I18nRouteKey` 里手工并上这三个 key。
- 页面在 `src/views/manage/{user,user-detail,role,menu,dict,user-dict,file,callback,client,msg-template,no,notice,org,special-file,third,third-template}/`，路由名固定为 `manage_user` / `manage_role` / `manage_menu` / `manage_dict` / `manage_user-dict` / `manage_file` / `manage_callback` / `manage_client` / `manage_msg-template` / `manage_no` / `manage_notice` / `manage_org` / `manage_special-file` / `manage_third` / `manage_third-template`（见 `src/router/elegant/imports.ts`）。
- 用户详情是独立页面 `src/views/manage/user-detail/[id].vue`（路由 `manage_user-detail`，路径 `/manage/user-detail/:id`，参数经 `props.id` 注入），由用户列表的「详情」行按钮进入。dynamic 模式下需后端菜单提供对应节点（建议 `hideInMenu: true`）才会注册该路由。
- 按钮权限由后端菜单 `meta.buttons` 下发，按 `position` 分组：`top`（工具栏）/ `row`（行操作）/ `left-top`（右侧面板工具栏）/ `left-row`（右侧面板行操作）；用 `usePageButtons()`（`src/hooks/business/page-buttons.ts`）读取，`click` 动作映射到 i18n，未知动作回退后端 `name`。**页面不允许写本地兜底按钮**，所有按钮必须由后端菜单动态下发（`click` 决定前端行为，`i18nKey` 决定文案）。
- 按钮可用性可配置：页面用 `usePageButtonState<Row>(rules)`（同文件）声明规则，规则以 `click` 为 key、接收 `{ rows, position }` 并返回 `true` 表示禁用（top 的 `rows` 是勾选行，row 的 `rows` 是当前行）。行按钮经 `TableRowOperation` 的 `disabled`、工具栏按钮经 `TableToolbarButtons` 的 `:disabled` 生效。
- 列表查询走后端动态查询模型：`PageQo` 的 `items`（条件）/ `orders`（排序）/ `exportItems`（导出列），与后端 `BaseQo` 对齐（`src/typings/api/system-manage.d.ts`），前端在 `src/components/advanced/query-filter/` 组装。
- 导出复用同一 search 接口并带 `export: true`，后端返回 xlsx 流（`responseType: 'blob'`）。
- 列表页统一走 `<ManageList>`（`src/components/advanced/manage-list.vue`，内部用 `useManageTable()`）。页面只给 `tableKey` / `url` / `fields` / `columns`，外加可选的 `exportable` / `selection` / `sortable` / `defaultOrders` / `extraItems` / `extraParams` / `immediate` / `rowAction` / `buttonRules` / `buttons` / `title`；查询栏、卡片、工具栏按钮、导出、列设置、刷新、排序、分页、行高样式都由组件提供，**页面不要再手写 `QueryFilter` / `NCard` / `TableHeaderOperation` / 操作列**。`rowAction` 会在最左侧生成由路由行按钮驱动的操作列并按 `buttonRules` 置灰，`ref` 可拿 `getData` / `reload` 刷新。所有 `/system/**` 列表共用同一「`PageQo` 进 / `PageResult` 出」形状，故组件直接用 `url` 走 `fetchPageSearch()` / `fetchPageExport()`（`src/service/api/system-manage.ts`），页面不必再为每个资源写 fetch / export。**`title` 不显式声明时卡片无标题**，不要默认填路由名；只有并排多列表（如字典页的主表/明细）才传。
  - **日期 / 时间列统一固定宽度且不换行**：`ManageList` 会给 key 以 `Time` / `Date` 结尾的列（`createTime` / `requestTime` / `updateTime` …，含 `_time` 形式）设成固定 `width: 170` 并给单元格 `white-space: nowrap`（`src/utils/table.ts` 的 `withDateColumnStyle()`），因为后端的 `yyyy-MM-dd HH:mm:ss` 中间有空格，窄列会折成两行。页面不要再给时间列单独写更小的 `width`，也不要用 `minWidth` 指望它撑开（naive-ui 分列时可能压到 150 左右导致换行）。
  - **按钮来源用 position 区分**：`topButtonPosition`（默认 `top`，工具栏按钮）/ `rowButtonPosition`（默认 `row`，操作列按钮）。一个页面有多个列表时各自配置，例如字典页明细列表传 `top-button-position="left-top"` + `row-button-position="left-row"`、用户字典右侧面板传 `top-button-position="left-top"`，这样同一路由的 4 组 `meta.buttons` 才能各归其位。`buttonRules` 收到的 `position` 也是这个配置值。
  - `extraParams`（Qo **顶层**参数，如 `userId`）与 `extraItems`（`items` 条件）不同，前者直接合并进请求体。
  - `defaultOrders` 是 Qo 顶层的默认排序（`OrderByItem[]`）：非排序列表每次查询都带上它（字典明细就是 `[{ prop: 'sn', asc: true }]`，默认按排序号升序）；可排序列表则把它当作「用户还没选排序」时的初始值，用户改排序后以用户的为准。
  - **空值不要用 `-` 占位**：列表单元格空值就渲染为空字符串（标签类列无值时不渲染标签），不要写 `row.xxx || '-'` 这种兜底；否则空数据样式很脏。
- `useManageTable()`（`src/hooks/business/manage-table.ts`）是组件底层的组合式函数：传 `tableKey` / `api` / `columns`（可选 `extraItems` 固定条件、`immediate`、`sortable`），返回 `conditions`、`tablePagination`、`exportItems`、`params`、`buildItems` / `buildParams`、`handleSearch` / `handleReset` 等；**菜单页是特例**（前端本地过滤 + 无分页，不用它）。
- `sortable` 默认 `false`，只有 user / role 开启（分页条右侧自动挂 `QuerySortButton`）。排序项与列显隐按 `tableKey` 存 localStorage，`setTableSetting` 按 key 合并，因此两者互不覆盖。
- 排序字段与导出字段规则不同（`src/utils/table.ts`）：`getSortFields()` 返回**所有**数据列（含列设置里未勾选 / 隐藏的列——隐藏不等于不能排序），`getExportItems()` 只取**已勾选且可见**的列。
- 查询条件的 `fast` 反直觉：后端把普通 item **AND** 起来，所以需要 OR 的字段（`code like ? or name like ?`）要标 `fast: true`——`buildFieldSlots()` 先把它们合并成一个「关键词」虚拟字段（`queryFilter.keyword`，锁定 `like`），`toQueryItems()` 再展开成**每个 prop 一条** `fast: true` item。后端 `DynamicConditionInterceptor` 会把本次查询里**所有** `fast` 条件合并成一个 or 组，再与普通条件 AND；`fast` 一律按 `like` 处理、值只取第一个非空值、且**只支持字符类型字段**（数字/日期字段会被忽略并打 WARN），传空串会让整个 or 组恒真——所以「一个字段必须传一行，值不能为空」。
- 查询字段可以标 `param: true`：表示它后端**不是实体字段**（而是 Qo 顶层参数，如 `showRequestContent`）。`createCondition` 会把该标记带到条件上，`toQueryItems()` 直接**跳过**这类条件、**不放进 `items`**；改由 `useManageTable#buildParams()` 收集成顶层参数（`{ [prop]: values[0] }`，值按字符串传，后端自己反序列化成 Boolean/数字）合并进请求体。导出请求同样带上（`ManageList` 的 `handleExport` 会合并 `buildParams()`）。
- 查询字段可以标 `defaultValues: string[]` 给一个**默认值**：`useManageTable` 首次渲染时据此预置一个条件（date 字段默认算子是 `between`，传 `[start, end]`），并把它算进 `params.items`，所以**首次查询就带上默认值**、筛选栏也会显示。`QueryComplexFilter#syncConditions` 按 `prop` 保留已有条件，不会覆盖用户后续修改。日期默认值用 `src/utils/date.ts` 的 `getTodayRange()` / `getLastYearRange()`（`YYYY-MM-DD`，后端 `between` 会把纯日期的结束值补到当天 23:59:59）。现状：用户列表默认近一年 + 状态默认「正常」，文件上传时间、回调请求时间默认今天。
- **布局 / 通用下拉**：`RemoteSelect`（`src/components/advanced/remote-select.vue`）用于所有「字典 / 角色 / 用户」下拉——`source="dict|user|role"`，字典再传 `dict-code`。它挂载时先拉第 1 页（`size=20`），输入关键字时防抖后重新请求（`:debounce`，默认 300ms），滚动到底部自动加载下一页；加载中下拉底部追加一行「加载中…」（禁用项）并显示 `:loading` 与 `#empty` 里的 `NSpin`。查询走 `/system/dictEntry/search`（先按 code 查字典 id，再用 `pid eq` + `fast` 代码/名称）、`/system/user/search`（`fast` username/nickname）、`/system/role/search`（`fast` roleCode/roleName）。编辑态用 `:fallback-option="{ label, value }"` 让当前值在分页数据到达前也有文案。**不要再在页面里 `fetchDictSelect` / `fetchRoleSelect` 全量拉取下拉选项**；只有查询栏的字段可以直接写 `remote: { source, dictCode }`（`QueryField.remote`，由 `query-value-editor` 渲染 `RemoteSelect`）。
- **JSON 展示**：`JsonViewer` + `JsonNode`（`src/components/advanced/`）是自写的递归 JSON 树，支持按层级折叠（`collapse-depth`，默认 2）、点三角逐节点折叠、右上「全部展开 / 全部折叠」、键/字符串/数字/布尔/null 分色（语法高亮）。弹窗/详情需要展示 JSON 时用它（非 JSON 文本回退 `<pre>`），不要再用裸 `<pre>` 平铺。
- **启用 / 禁用一律是行按钮**（`click=enable` / `disable`），不要放进新增/编辑表单。后端为此补了 `POST /system/org|specialFile|third|thirdTemplate/enable|disable`（`IdFo`，切 `AbleStateEnum`）；特殊用途文件因为实体有库中不存在的 `org_id` 列，不能走 `switchAbleState`（内部 `selectById`），控制器里改用 `updateByWrapper` 直接 set state。页面用 `PageButtonStateRules` 按 `stateEnum`（特殊文件 / 第三方模版的 To 只有裸 `state`，用 `row.state`）置灰，新增弹窗只提交 `state: 'ON'`，不展示状态字段。
- **字典管理** `manage_dict`：字典主表 + 字典明细两个列表（左右布局、各自查询栏、明细按 `pid` 与主表联动），接口 `/system/dict/**`、`/system/dictEntry/**`。明细列表通过 `default-orders="[{ prop: 'sn', asc: true }]"` 默认按排序号升序排列。
- **取号管理** `manage_no`（`src/views/manage/no/`）：列表 `url="/system/no/search"`，列 `docType` / `prefix` / `format` / `template` / `currentNo`（Long，字符串形式）/ `bit` / `batchNumber` / `lastFetchTime` / `remark` / `createTime`。新增、编辑走 `POST /system/no` / `/system/no/update`（`SystemNoFo`）；编辑时用 `/system/no/detail` 拉详情（列表 `SystemNoTo` 原先没有 `template` / `lastFetchTime`，已同步补上）。没有启用/禁用、也没有删除接口，所以只有 `top` 的 `click=create` 和 `row` 的 `click=update` 两个按钮。`currentNo` 以字符串提交，避免 Long 精度丢失。
- **公告管理** `manage_notice`（`src/views/manage/notice/`）：列表 `url="/system/notice/search"`，列 `type`（`typeVal`）/ `title` / `onTime` / `offTime` / `creator` / `createTime`。后端 search 是手写 SQL，**只读 Qo 顶层的 `title` / `type`**（不是 `items`），所以查询栏这两个字段必须标 `param: true`；SQL 还固定 `on_time <= NOW()` 并按当前组织的可见范围过滤，所以列表只显示“已生效且当前组织可见”的公告。编辑用 `/system/notice/detail`（列表 To 没有 `content` / `targets`）。可见范围用 `NDynamicInput` 编辑 `[{ targetType, targetCode }]`，类型取字典 `system_notice_target_type`（ORG / ROLE / LEVEL），编码分别填组织编码 / 角色编码 / 层级编码，留空即全员可见。时间字段用 `NDatePicker` + `value-format="yyyy-MM-dd HH:mm:ss"`（与后端 FastJSON 全局日期格式一致）。列表的**标题列可点击**，弹出只读的 `NoticeDetailModal`（`src/components/advanced/notice-detail-modal.vue`，首页「最新公告」也用同一个组件）：先显示行里的标题/类型，再请求 `/system/notice/detail` 取 `content` 用 `v-html` 渲染；详情 Vo 没有 `typeVal`，所以组件把详情合并到行数据上保留译文。弹窗头部只放「类型 tag（`NTag`，info）+ 发布时间」，**不展示发布人**（`publishTime` 是弹窗专用文案，列表/筛选仍用「生效时间」）。正文放在 `.notice-scroll` 里（`max-height: 60vh` + 内部滚动），公告再长也不会把弹窗顶出屏幕；弹窗标题、meta 行、正文都是居中的——标题由 naive-ui 渲染在外层，用非 scoped 的 `.notice-detail-modal .n-card-header__main` 居中；正文里的图片受全局 preflight 影响是 `display: block`，`text-align` 对它无效，必须在 `.notice-content img` 上额外加 `margin: 0 auto` 才能居中。**公告内容用富文本**：`RichTextEditor`（`src/components/advanced/rich-text-editor.vue`，基于 `@wangeditor/editor` + `@wangeditor/editor-for-vue@next`），`model.content` 直接存编辑器产出的 HTML；没有上传接口，图片走 base64（≤5MB），视频组已从工具栏移除。富文本不是 naive-ui 控件，无法自己触发表单校验，所以页面通过 `NFormItem` 的 ref 调 `validate({ trigger: 'change' })` 清掉「不能为空」；判断空内容要用 `isBlankHtml()`（`src/utils/common.ts`）——空编辑器也会产出 `<p><br></p>`，直接 `required` 会误判为有值；**只有内容非空时才 validate**，因为编辑器挂载时也会触发一次 change，否则一打开弹窗就红。`@wangeditor/editor-for-vue` 的 `exports` 没有 `types` 条件，类型声明由 `src/typings/wangeditor.d.ts` 补。
- **首页最新公告**：`src/views/home/modules/latest-notice.vue`（替代原模板的「项目动态」卡片）复用 `/system/notice/search` 取前 5 条——后端 SQL 已按 `on_time DESC` 排序并按当前组织的可见范围过滤，只显示已生效的公告；展示「标题 + 生效时间」，标题过长省略并带 tooltip。**「更多公告」**只在当前用户拥有 `manage_notice` 路由（`router.hasRoute`）时才显示并跳转公告列表；**点击单条公告**则是弹详情框（复用 `src/components/advanced/notice-detail-modal.vue`，`/system/notice/detail` 取 `content`，`v-html` 渲染富文本，`mask-closable=false`），不需要该菜单权限。没有公告时显示「暂无公告」。
- **组织管理** `manage_org`（`src/views/manage/org/`）：列表 `url="/system/org/search"`，列 `code` / `name` / `state`（`cell: 'enabled'`）/ `remark` / `creator` / `createTime`。新增、编辑走 `POST /system/org` / `/system/org/update`，编辑用 `/system/org/detail`；启用/禁用走 `/system/org/enable` / `/disable`（行按钮），表单不再有状态字段。后端还有 `/system/org/dynamicSwitch/{orgId}`（切换当前登录组织），本页未使用。
- **特殊用途文件** `manage_special-file`（`src/views/manage/special-file/`）：列表 `url="/system/specialFile/search"`，列 `code` / `fileName` / 适用用户（`userId` → 用户名，空表示全部）/ `state`（`cell: 'enabled'`）/ `remark` / `createTime`。表单的文件字段是**上传**（`src/components/advanced/file-upload-modal.vue`，与文件管理共用：≤5M 直接传、更大自动分片，成功时 `emit('uploaded', file)`）而不是从文件列表里挑；已上传的文件用 **`NUpload` 的 `file-list` 展示**（`show-trigger=false`、`list-type` 默认 text，只借用它的列表和按钮）：文件名点击走 `on-preview` 打开预览弹窗，垃圾桶走 `on-remove` 清空（同步清 `fileId` / `fileName`），下载图标走 `on-download` 调 `/system/file/download` 并 `return false` 阻止 naive-ui 用空的 `file.url` 再下一次；空列表时显示「请上传文件」占位。**不要自己用 input + 按钮拼文件行。** 适用用户用 `RemoteSelect source="user"`，可留空表示所有用户。后端 `SystemSpecialFileFo` / `Vo` 原来没有 `state`，已补上；启用/禁用走 `/system/specialFile/enable` / `/disable`。**本地库的 `system_special_file` 表没有 `org_id` 列**（实体有该字段），`selectById` 会列出所有实体列从而报 `Unknown column 'org_id'`，因此更新/切状态都绕开 `selectById`（`update` 直接由 Fo 构造实体，状态用 `updateByWrapper`）。页面暂不提供组织维度（等库补列后再加）。**下载**：行按钮 `click=download`，用行的 `fileId` 调 `/system/file/download`（`fetchFileDownload([fileId])`，blob）再用 `getDownloadFileName` / `saveBlob` 保存，文件名取响应头 `content-disposition`；没有 `fileId` 的行按钮置灰，下载中丢第二次点击，后端返回 JSON 错误体时提示「下载失败」。
- **第三方系统配置** `manage_third`（`src/views/manage/third/`）：列表 `url="/system/third/search"`，列 `type`（`typeVal`，后端已给 To 加 `@DictField`）/ `name` / `config`（JSON）/ `state`（`cell: 'enabled'`）/ `remark` / `createTime`。**后端没有 detail 接口**，编辑直接用列表行数据（To 已含 `config` / `state`）。配置**不再是文本框**：按所选 `type` 渲染对应表单（字段对照后端 prop 类——`MAIL` → `MailProp`：host / port / username / password / alias；`WX_CP` → `WxCpProp`：corpId / agentId / secret / token / aesKey；`WX_MP`（微信公众号）→ `WxMpProp`：appId / secret / token / aesKey（token / aesKey 仅在接收消息时需要，留空即可推送）；`WX_WEBHOOK` → `WxWebhookProp`：corpId / agentId / webhookKey），提交时拼成 `config` JSON，编辑时反向解析；**字典里新增的未知类型**才回退到 JSON 文本域（带「格式化」）。文案里不再出现「渠道」，统一叫「第三方系统 / 类型 / 名称 / 配置」。字段定义在 `src/constants/third-config.ts`，列表的配置列用 `formatConfigPreview()`（`src/utils/common.ts`）按同一份定义渲染成「标签: 值」，`sensitive: true` 的字段（密码/secret/token/aesKey/webhookKey）显示 `******`，tooltip 里也是脱敏后的文本。`SystemThirdFo` 原来没有 `state`，已补上；启用/禁用走 `/system/third/enable` / `/disable`（行按钮），表单里没有状态字段。
- **第三方模版** `manage_third-template`（`src/views/manage/third-template/`）：列表 `url="/system/thirdTemplate/search"`，列 消息模版（`templateId` → 模版编码 + 标题）/ 第三方系统（`thirdId` → 名称 + 类型）/ `name` / `config` / `state`（`cell: 'enabled'`，后端 To 返回裸 ON/OFF）/ `remark` / `createTime`。**后端没有 detail 接口**，编辑直接用行数据。`SystemThirdMsgTemplateFo` / `To` 原先都没有 `thirdId`（实体与联表查询里都用它），已补上。模版配置按**所选系统的类型**渲染：`MAIL` 显示 `subject` + `ftl`（对应 `SystemThirdMsgTemplate.MailMapping`），企业微信两类没有模版配置（提示「该类型不需要模版配置」），**微信公众号 `WX_MP`** 也不走这里（它的模版消息 ID 由后端字典 `wx_mp_template_mapping` 按「AppID + 模版编码」维护，提示文案单独说明这一点），未知类型回退 JSON；切换系统会清掉上一系统的配置。列表的配置列同样用 `formatConfigPreview()` 显示成「邮件标题: …，模版文件名 (ftl): …」。启用/禁用走 `/system/thirdTemplate/enable` / `/disable`（行按钮）。模版 / 系统下拉分别取 `/system/msgTemplate/search` 与 `/system/third/search`（各 200~500 条）。
- **用户字典** `manage_user-dict`：左用户 + 右「拥有字典」列表。右侧数据**直接来自** `/system/dict/userDictDetail` 返回的 `dictList`（后端 `SystemUserDictVo` 的字段就叫 `dictList`，前端类型曾被误写成 `dictIds`），不需要拉全量字典。右侧工具栏的 4 个按钮由后端菜单下发，`click` 分别是 `addUserDict`（弹窗里**搜索**字典——用 `fast` 同时搜 code/name——并多选，不做全量加载）/ `removeUserDict`（作用于表格勾选行）/ `bindUserAllDict` / `removeUserAllDict`。
- **权限树**（角色管理右侧）：数据源用 `/system/menu/wholeTree`；已绑定项取自 `/system/role/menuAndButtonIds`（含菜单 + 按钮 id），保存走 `/system/role/bind`，按 `menuIds` / `buttonIds` 分别提交并自动补全被勾选节点的上级菜单；树按 `meta.i18nKey` 优先、回退 `name` 显示，并用 `getMenuNodeType`（`src/utils/menu.ts`）区分 root/目录/菜单/按钮。
- **文件管理** `manage_file`（`src/views/manage/file/`）：列表用 `ManageList`，`url="/system/file/search"`；标签列直接用后端 `@DictField` 返回的 `fileTagVal`，标签筛选走 `RemoteSelect`（字典 `system_file_tag`）。上传在共用的 `src/components/advanced/file-upload-modal.vue`（特殊用途文件也用它）：≤5M 走 `POST /system/file/upload`，更大的自动分片——`getFileMd5()`（`src/utils/file.ts`，crypto-js 增量计算，作 `identifier` 以支持秒传/断点续传）→ `checkChunk` → `uploadChunk`（单片 ≤ 后端 `chunkSize`，返回的 `uploadedChunks` 用于跳过续传）→ `mergeChunk`；成功后 `emit('uploaded', file)` 把落库文件带回调用方。下载走 `POST /system/file/download`（body 为 id 数组，多文件后端自动打 zip），blob 保存复用 `src/utils/file.ts` 的 `getDownloadFileName` / `saveBlob`（`TableExportButton` 也用它）。工具栏按钮全部由后端菜单 `top` 下发（`click` 为 `upload` / `download`，`i18nKey` 为 `system.file.upload` / `system.file.download`），页面无本地兜底按钮。**预览**：文件名列可点击，弹出 `src/components/advanced/file-preview-modal.vue`——用 `fetchFileDownload([id])` 取 blob，图片 / pdf / 视频 / 音频走 `URL.createObjectURL`（关闭或卸载时 revoke），文本类（txt / json / xml / yml / md / csv / log / sql / html / ftl 等）读成文本放在 `<pre>` 里（>1MB 不读，提示文件过大），其它类型（docx / xlsx / zip…）提示「暂不支持预览」并提供「下载文件」按钮；类型按文件名后缀判断，取不到再回退 `fileType`。
- **回调记录** `manage_callback`（`src/views/manage/callback/`）：列表 `url="/system/callback/search"`，展示 `type`（字典 `system_callback_type`，用后端 `@DictField` 的 `typeVal` 译文）、`name`、`success`、`subject`、`primaryKey`、`traceId`、`creator`、`requestTime`，以及请求/响应内容。请求/响应内容在副表，仅当 Qo 顶层 `showRequestContent` / `showResponseContent` 为 true 时才 join 出来；查询栏里的「显示请求参数 / 显示响应结果」两个字段直接标 `param: true`（见上），不进 `items`、作为顶层参数下发。两列内容不再直接平铺（列宽固定 100、居中），而是渲染「查看」按钮，点击用 `modules/callback-content-modal.vue` 弹出 JSON 框：`JsonViewer` 可折叠 + 语法高亮（`JSON.parse` 失败时回退 `<pre>` 原样显示），带复制按钮，`mask-closable=false`。时间条件用 `requestTime`（需后端 `SystemCallbackTo` 含 `requestTime` / `subject` / `primaryKey` / `traceId` 才会返回）。重调走 `POST /system/callback/reExecute`（body 为 id 数组），按钮完全由后端菜单下发：`top` / `row` 的 `click` 用 `reExecute`，`i18nKey` 用 `system.callback.reExecute`（`top` 作用于勾选行）。
- **客户端管理** `manage_client`（`src/views/manage/client/`）：列表 `url="/system/client/search"`，列 `clientId` / `grantType`（逗号分隔）/ `deviceType` / `activeTimeout`（`-1` 显示为不限制）/ `timeout` / `state`（`cell: 'enabled'` 读 `stateEnum`）/ `remark` / `createTime`。新增、编辑走 `POST /system/client` / `/system/client/update`（`SystemClientFo` **没有 state 字段**）；启用/禁用走 `POST /system/client/enable` / `/system/client/disable`（`IdFo`，`switchAbleState`）；update 会清理旧/新 clientId 的鉴权缓存。表单里 grantType 用多选 tag（password / sms），提交时逗号拼接。按钮全部由后端菜单下发：`top` 的 `click=create`，`row` 的 `click=update` / `enable` / `disable`；`enable`/`disable` 按 `stateEnum` 置灰。
- **消息模版** `manage_msg-template`（`src/views/manage/msg-template/`）：列表 `url="/system/msgTemplate/search"`，列 `code` / `type`（tag，`typeVal` 优先）/ `title` / `titleDesc` / `sn` / `whetherConfirm`（`cell: 'boolean'`）/ `hidden`（`cell: 'boolean'`）/ `state`（`cell: 'enabled'`）/ `remark` / `createTime`。新增、编辑走 `POST /system/msgTemplate` / `/update`（`SystemMsgTemplateFo`，含 `entryList`）；编辑时用 `/system/msgTemplate/detail` 拉详情（列表 To 不含 `subTitle` / `entryList`）；启用/禁用走 `/system/msgTemplate/enable` / `/disable`。消息类型、参数类型是字典下拉，用 `RemoteSelect`（`source="dict"`，关键字分页，只能选字典里的项、不接受手填），因此字典必须先在「字典管理」里配好明细，否则下拉为空、无法选择。模版参数用 `NDynamicInput` 编辑（sn / type / label / prop / val / labelDesc / color），提交时过滤掉 `label` 与 `prop` 都为空的行。弹窗是两列网格，字段按语义成对排：编码 / 消息类型 → 排序号（后接一个空占位 `<div />`，避免与标题错位）→ 模版标题 / 标题说明 → 二级标题 / 二级说明 → 模版描述 / 描述说明 → 需要确认 / 配置中隐藏 → 模版参数（`col-span-2`）。按钮：`top` 的 `click=create`，`row` 的 `click=update` / `enable` / `disable`。

### 通过界面创建菜单 / 按钮（快速步骤）

菜单和按钮**不写在代码里**，全部在「系统管理 → 菜单管理」里配：

1. 登录后进入「系统管理 → 菜单管理」，点「全部展开」。
2. **新增菜单**：找到父节点（如 `目录 manage` / 系统管理），该行「操作 → 新增子菜单」，填：
   - 路由名称 = 路由名，如 `manage_client`（对应 `src/views/manage/client/index.vue` 生成的 `manage_client`）
   - 菜单标题 = 中文名
   - 国际化键 = `route.<路由名>`（先在 `src/locales/langs/{zh-cn,en-us}.ts` 和 `src/typings/app.d.ts` 的 `Schema` 里加好）
   - 图标 = Iconify 名，如 `mdi:account-key`
   - 排序号 = 同级递增
   - 路由地址 = 如 `/manage/client`
   - 组件路径 = `view.<路由名>`（该下拉带 `tag`，直接输入后回车；对应 `src/views/**` 的页面。找不到会跳过并打印 `[route] skip menu ...`）
   - 权限码可留空；页面缓存 / 隐藏菜单 / 多标签按需
3. **新增按钮**：在刚建的菜单行「操作 → 新增按钮」，每个按钮填：
   - 按钮名称、国际化键（`common.create` / `common.update` / `common.enable` / `common.disable` 等）
   - 排序号、权限码（可选，如 `system:client:create`）
   - **触发动作** = 页面 `handleToolbarAction` / `handleRowAction` 分发的 `click`（`create` / `update` / `enable` / `disable` / `reExecute` …）
   - **按钮位置** = `top`（工具栏）/ `row`（行操作）；并排多列表用 `left-top` / `left-row`，并在页面上配 `top-button-position` / `row-button-position`
4. 保存后刷新/重新登录（应用启动时从 `/system/menu/tree` 拉菜单与 `meta.buttons`）。页面代码只按 `click` 分发，**不要写本地兜底按钮**。
5. 删除按钮/菜单：对应行「操作 → 删除」。
6. 启用/禁用等按钮需要后端控制器有对应接口（如 `/enable`、`/disable`），否则点击会 404。

> 新增子菜单时「上级菜单」和 `pid` 会自动带入，无需手填；只有新增顶级菜单才需要选根。

## 数据约定（重要）

- 后端 **Long 一律以字符串返回**；`@sa/axios` 已全局用自定义 JSON 解析**保留大整数为字符串**（`packages/axios/src/{options,shared}.ts`），避免精度丢失。
- 枚举字段经全局 `BaseEnum2KeyWriter` 输出 **两个字段**：`state`（文案，如「启用」）与 `stateEnum`（枚举名，如 `ON`）。判断状态请用 `stateEnum`。
- 列表查询字段用动态 `items`（`prop` 为实体属性名，如 `pid`、`roleCode`、`state`）。
- **multipart 上传的坑**：axios 的默认 `transformRequest` 在 data 为 FormData **且** content-type 含 `application/json` 时，会把它 `JSON.stringify(formDataToJSON(data))`，于是「multipart 上传」实际发成了 JSON（`{"file":{},"fileTag":"..."}`）。因此 `packages/axios/src/options.ts` 的 `createAxiosConfig` **不再写死 `Content-Type: application/json`**：对象体由 axios 自动加 JSON 头，FormData 保持原样、由浏览器补 `boundary`。给上传请求单独设 JSON content-type 会重新踩坑。

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

  提交按钮统一 `:loading="submitting" :disabled="submitting"`；弹窗的 `Esc` / 关闭图标等其它入口也应在 `submitting` 时拦截。处理函数里的拦截不能省——naive-ui 的 `NButton` 在 `loading` 时会忽略点击，但 `@keyup.enter` 这类不经按钮的入口不会。
  - 表单弹窗**不要手写底部按钮**：用 `FormDialog` 的内置「取消 / 确认」，把提交逻辑通过 `:submit="handleSubmit"` 传入即可——`validate()`、防重复点击（loading + disabled）、提交中拦截关闭都由它负责；只有要换掉底部按钮时才传 `#footer` 插槽。非 `FormDialog` 的表单（如 `pwd-login`）按上面的范式自行加 `submitting`。
  - `FormDialog` 统一 `:mask-closable="false"`：点击遮罩不会关闭弹窗，只有「取消 / 确认 / 关闭图标 / Esc」能关。自定义 `NModal` 也照此处理。
  - 弹窗宽度默认**占屏幕一半**（`50vw`，见 `src/styles/scss/form-dialog.scss`，`min-width: 360px`、`max-width: calc(100vw - 32px)`；全屏按钮走 `form-dialog--fullscreen`）。页面不要再给 `FormDialog` 传 `class="w-xxx"`——`inheritAttrs: false` 会把 class 落到内层 `NForm` 上。
  - **标签过长用「短标签 + ?」**：弹窗的 label 列只有约 98px（4 个中文字左右，再加 `?` 图标就更窄），文案超过这个宽度就会被省略。与菜单管理一致，这类字段一律改成短标签，把完整说明/字段全名放进 `FormLabel` 的 `:tip`（渲染成 label 左边的 `?` 图标，hover 显示）。例：`活跃超时(秒)` → 标签「活跃超时」+ tip「单位：秒；-1 表示不限制」；`企业ID (corpId)` → 标签「企业ID」+ tip「corpId，企业微信后台…」。新增/修改弹窗字段时按同一规则处理，不要靠加宽 label 列或让文字换行。`src/constants/third-config.ts` 的 `ConfigField` 就是这种写法（`label` 短标签 + 可选 `tip`）。

- **优先使用官方文档的现成能力，不要自己造轮子。** 组件库能通过属性/配置直接实现的效果，先用官方写法；只有当官方能力确实覆盖不了时才写自定义 `render`/`h()`。动手前先查官方文档（NaiveUI: https://www.naiveui.com/zh-CN/os-theme/components ）。
  - 典型例子：表格文字列的「单行 + 溢出省略号 + hover 提示」**不要**手写 `renderEllipsis` / `NEllipsis`，DataTable 列上直接写 `ellipsis: { tooltip: true }` 即可（naive-ui 会自动把单元格内容包进 `NEllipsis`，`render` 的返回值同样会被包）。只有要改变渲染形态（枚举转 tag、拼接多个字段）时才补 `render`，且空值返回空字符串而不是 `-`。
