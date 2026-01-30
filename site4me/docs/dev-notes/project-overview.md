# 项目概览与基础配置

## 1. 目标

ourNote 前端以 Vue 2 + Element UI 为基础，提供问卷投票、人际关系管理及小游戏等功能。该文档记录从 0 搭建到当前状态的关键步骤，方便复刻。

## 2. 初始化

1. 使用 Vue CLI 创建项目（Vue 2 模式）：
   ```bash
   vue create ournote   # 选择 Vue 2 + Babel + Router + ESLint
   ```
2. 安装核心依赖：
   ```bash
   npm install element-ui axios @icon-park/vue vis-network lodash
   ```
3. 全局入口 `src/main.js` 中：
   - 引入 `ElementUI` 与样式包并 `Vue.use(ElementUI)`。
   - 注册路由并挂载根组件。

## 3. 目录结构（关键部分）

```
src/
  api/                 # Axios 接口封装
  assets/              # 自定义样式（如 global.css）
  components/          # 布局等复用组件
  router/              # 路由配置
  views/               # 各业务页面
public/
  theme/hero.jpg       # 背景图
docs/                  # 文档
```

## 4. 全局样式与背景

- `src/App.vue` 负责全局 reset 样式，添加固定背景层 `div.app-bg`。
- 背景图片路径通过 `process.env.BASE_URL` 计算，保证开发/生产一致：
  ```js
  bgStyle() {
    const url = this.backgroundUrl || `${(process.env.BASE_URL || '/') }theme/hero.jpg`
    return { backgroundImage: `linear-gradient(...), url(${url})` }
  }
  ```
- 在 `mounted` 中预加载图片，加载成功/失败会输出 `[bg] loaded/failed` 日志，便于调试。

## 5. 开发服务器配置

- `vue.config.js` 增加代理：
  ```js
  devServer: {
    proxy: {
      '^/nets': { target: 'http://localhost:3307', changeOrigin: true }
    }
  }
  ```
- 这样运行 `npm run serve` 时，前端调用 `/nets` 会转发到本地后端端口。

## 6. 生产构建

```bash
npm run build
```

输出目录为 `dist/`，可部署到任何静态托管（需调整后端 API 地址）。若上线需 HTTPS，推荐在部署端配置反向代理。

## 7. 常见问题

| 问题                     | 解决 |
|--------------------------|------|
| 背景图不显示             | 确认 `public/theme/hero.jpg` 存在；清缓存；查看控制台日志 |
| Element UI 组件找不到   | 确保在 `main.js` 调用了 `Vue.use(ElementUI)` |
| 接口 404                 | 检查后端路径是否与 API 模块一致（如 `/nets`） |
| 子数组修改视图不更新     | 使用 `this.$set`（在熄灯游戏中已示例）           |

准备复刻时，可按本章节流程搭建环境，再根据后续文档实现具体模块。

