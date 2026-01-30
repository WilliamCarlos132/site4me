# 人际关系模块开发笔记

## 1. 功能概述

人际关系模块包含两个主要页面：

- 表格视图 `NetworkTableView.vue`：展示、增删改人际关系数据。
- 关系图 `NetworkGraphView.vue`：使用 vis-network 可视化连接。

后端接口统一遵循 `/nets` REST 标准，返回结构：`{ code, msg, data }`。

## 2. API 封装

文件 `src/api/network.js`：

```js
import axios from 'axios'

const http = axios.create({ baseURL: '', timeout: 10000 })

export default {
  list() { return http.get('/nets') },
  create(data) { return http.post('/nets', data) },
  update(id, data) { return http.put(`/nets/${id}`, data) },
  delete(id) { return http.delete(`/nets/${id}`) }
}
```

- `baseURL` 为空，开发时交由代理 `/nets -> http://localhost:3307`。
- 所有返回结果在视图层判断 `res.data.code === 200` 后处理。

## 3. 表格视图编写过程（NetworkTableView.vue）

1. **基础表格**
   - 使用原生 `<table>` 搭配 `el-tag` 展示 `related` 数组。
   - 数据来源：`networkApi.list()`，在 `created()` 中初次加载。
   - 时间格式化：使用 `toLocaleString('zh-CN')` 并替换 `/`。

2. **新增/编辑弹窗**
   - 增加 `dialogVisible`, `dialogTitle`, `editingId`, `form` 等数据属性。
   - 表单利用 `el-dialog + el-form`，`relatedInput` 通过逗号分隔转换数组。
   - `handleSubmit()` 中根据 `editingId` 判断调用 `create` 或 `update`。
   - 使用 Element UI 的 `$message` 提示成功/失败，并在失败时提供 `alert` 兜底。

3. **删除操作**
   - `confirmDelete(item)` 使用 `$confirm` 二次确认，兜底 `window.confirm`。
   - 成功后重新调用 `fetchNetworks()` 刷新列表。

4. **响应式细节**
   - 表单校验规则仅要求 `name` 非空，可按需扩展。
   - 所有接口交互包裹在 `try/catch`，出现异常时提示“请求失败，请稍后重试”。

## 4. 关系图视图编写过程（NetworkGraphView.vue）

1. **基础设置**
   - 引入 `vis-network/standalone` 提供的 `DataSet` 与 `Network`。
   - `nodes`、`edges` 使用 `DataSet` 实例存储。
   - 在 `created()` 中调用 `fetchData()` 获取数据。

2. **构建节点和边**
   - 收集 `name` 与 `related` 去重后，使用 `nodes.add()` 创建节点。
   - 遍历 `related` 创建边，label 显示 `meetWay`，默认“认识”。

3. **网络图初始化**
   - `mounted()` 中若已有节点，调用 `initNetwork()`。
   - `Network` 构造传入配置项（物理参数、交互设定等）。
   - 监听 `hoverNode`/`blurNode` 改变鼠标样式。

4. **销毁**
   - `beforeDestroy()` 中调用 `this.network.destroy()`，避免内存泄漏。

## 5. 注意事项

- **后端路径统一**：列表与 CRUD 均使用 `/nets`；后端实现要配套提供 `GET/POST/PUT/DELETE`。
- **数据一致性**：新增/编辑成功后统一刷新列表，保证表格显示最新数据；关系图可在需要时添加同样的刷新。
- **时间字段**：后端返回 ISO-8601 字符串，前端通过 `new Date()` 格式化。
- **消息组件**：项目全局注册 Element UI，因此直接使用 `$message`/`$confirm`，并保留 `alert` 兜底，防止依赖缺失时无法提示。

## 6. 后续扩展

- 表格分页/搜索：在 `fetchNetworks` 中增加查询参数，结合分页组件。
- 数据导入导出：可对接后端导出接口或在前端生成 CSV。
- 关系图交互增强：支持节点点击显示详情、拖拽新增边等。

