# ourNote 前端开发文档

本文档面向参与 ourNote 项目前端开发的工程师，梳理项目结构、关键页面、主要依赖与常见开发流程，便于快速上手与维护。

## 1. 项目概览

- **技术栈**：Vue 2.x、Vue Router、Axios、Element UI、vis-network、@icon-park/vue。
- **项目结构**（部分）：
  - `src/main.js`：全局入口，注册 Element UI。
  - `src/router/index.js`：路由配置，统一在 AppLayout 下挂载各业务视图。
  - `src/components/AppLayout.vue`：主布局组件，包含侧边导航与顶部标题。
  - `src/api/`：封装后端接口调用。
  - `src/views/`：业务页面（投票、分享、人际关系、熄灯游戏等）。
  - `public/theme/hero.jpg`：界面背景图资源，可替换。

## 2. 启动与构建

```bash
npm install
npm run serve     # 启动开发服务器 http://localhost:8080
npm run build     # 生产环境构建
```

开发阶段已在 `vue.config.js` 配置代理：将 `/nets` 转发到 `http://localhost:3307`，后端需监听该端口。

## 3. 路由与布局

- `AppLayout.vue` 负责整体布局，侧边栏使用 @icon-park/vue 图标组件；导航激活状态通过 `active-class="active"` 控制。
- 路由集中定义于 `src/router/index.js`，新增页面步骤：
  1. 在 `src/views/` 中创建新组件。
  2. 在 `router/index.js` 引入并添加 `children` 路由项（设置 `meta.title` 以显示在顶部标题）。
  3. 在 `AppLayout.vue` 侧边栏追加对应导航入口。

## 4. 常用组件与标签

- `el-button`、`el-form`、`el-dialog`、`el-input`、`el-tag` 等 Element UI 组件，用于表单、弹窗与操作控件。
- 自定义布局标签：`<section>`、`<div>`、`<main>`、`<aside>` 结合 scoped CSS，形成卡片式布局。
- 图标组件来源于 `@icon-park/vue`，使用时应在 `<script>` 中按需导入并注册。
- 背景层 `div.app-bg` 放置于 `App.vue`，通过内联样式加载 `hero.jpg` 并叠加渐变。

## 5. API 接口封装

- 所有接口封装在 `src/api` 下：
  - `network.js` 提供 `list/create/update/delete` 方法，对应后端 `/nets` 系列 REST 接口。
  - 调用统一返回 `axios` Promise，业务视图负责处理 `code/msg/data`。
- 调用示例（以人际关系列表为例）：
  ```js
  const res = await networkApi.list()
  if (res.data && res.data.code === 200) {
    this.networks = res.data.data || []
  } else {
    this.$message.error(res.data?.msg || '查询失败')
  }
  ```

## 6. 关键页面说明

### 6.1 人际关系表格 `NetworkTableView.vue`

- 功能：展示人际关系列表，支持新增、编辑、删除。
- 关键标签/组件：
  - `el-dialog` + `el-form`：处理 CRUD 弹窗。
  - `el-tag`：展示“认识的人”列表。
- 注意事项：表单保存时将 `relatedInput` 拆分成数组，调用 API 并在成功后 `fetchNetworks()` 重新加载。

### 6.2 人际关系图谱 `NetworkGraphView.vue`

- 功能：使用 vis-network 绘制关系图。
- 关键逻辑：
  - `networkApi.list()` 获取原始数据。
  - DataSet 构建节点/边，名称作为 `id`。
  - 保持 `beforeDestroy` 中销毁 network 避免内存泄露。

### 6.3 熄灯游戏 `LightsOutView.vue`

- 功能：纯前端逻辑还原 C++ “熄灯游戏”。
- 关键方法：
  - `generateBoard`：生成随机局面，保证至少一盏灯亮。
  - `toggle`：翻转当前格及其上下左右，使用 `this.$set` 保证 Vue2 响应式。
  - `handleClick`：计步与胜利判定。
- UI 采用半透明卡片 + 渐变背景，增强观感。

## 7. 样式系统

- 全局重置在 `App.vue` 中定义。
- 每个视图采用 `scoped` 样式避免污染，配合 CSS 变量或固定色值。
- 布局与卡片普遍使用 `border-radius`、`box-shadow`、`backdrop-filter` 形成玻璃拟态风格。
- 背景图遮罩透明度可在 `App.vue` 的 `bgStyle` 中调整。

## 8. 开发流程建议

1. 新增页面/功能前，先在 `router/index.js` 中规划路由与导航入口。
2. 在 `src/api/` 编写或扩展接口方法，遵循接口文档（统一 Result 格式）。
3. 完成视图开发后，可使用 `npm run lint` 检查代码格式。
4. 若需引入新 UI 组件，请先确认 Element UI 是否已有实现；没有时再考虑自定义或引入第三方库。
5. 静态资源放入 `public/`，访问路径通过 `process.env.BASE_URL` 兼容生产环境。

## 9. 常见问题排查

- **接口报错**：检查代理是否指向正确端口，确认后端路径与前端一致（如 CRUD 均使用 `/nets`）。
- **视图不刷新**：Vue2 对嵌套数组/对象的下标赋值需使用 `this.$set`；或替换为新对象。
- **背景图不显示**：确认图片存在于 `public/theme/hero.jpg`，刷新缓存并检查控制台 `[bg] loaded` 日志。
- **导航消失/遮挡**：保证内容层拥有高于背景层的 z-index，并为背景层设置 `pointer-events: none`。

## 10. 后续规划建议

- 抽离主题设置：支持多背景图或夜间模式切换。
- 人际关系模块引入分页、搜索筛选。
- 熄灯游戏扩展更大棋盘、撤销功能与排行榜。
- 编写端到端测试确保核心流程稳定。

如有新增页面或重大变更，建议同步更新本文件以保持知识库一致。欢迎在团队内提交合并请求前补充开发说明。祝开发愉快！

