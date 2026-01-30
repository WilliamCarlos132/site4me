# AppLayout 布局组件开发笔记

## 1. 组件定位

`src/components/AppLayout.vue` 是整个应用的基础框架，包含侧边栏导航、顶部标题栏与内容区域。所有业务页面都在其 `<router-view />` 中渲染。

## 2. 编写步骤

1. **结构搭建**
   - 使用 `<aside>` 作为侧边栏，`<main>` 作为主区域。
   - 侧边导航使用 `<router-link>`，利用 `active-class="active"` 控制选中状态。
   - 顶部 `<header>` 显示当前路由 `meta.title`，并配置二级导航。

2. **引入图标**
   - 通过 `@icon-park/vue` 引入常用图标（Add、ChartPie、Message、Connection、MindMapping）。
   - Later：加入 HaveFun 分组后添加 `Game`、`Down` 图标，实现折叠箭头。

3. **HaveFun 折叠逻辑（后期新增）**
   - 数据属性 `haveFunOpen` 控制展开/折叠。
   - 计算属性 `isHaveFunRoute` 根据 `$route.path.startsWith('/havefun')` 判断当前是否在 HaveFun 区域。
   - 通过 `watch $route.path` 相应展开相关菜单。
   - `goHaveFun()` 点击父项直接跳转到 HaveFun 首页，并保持子菜单显示。

4. **样式要点**
   - 侧栏使用深色背景（#1e293b），导航 hover 与 active 状态统一在 CSS 中处理。
   - 主内容区半透明卡片效果：
     ```css
     .content > * {
       background: rgba(255, 255, 255, 0.85);
       backdrop-filter: saturate(140%) blur(6px);
       box-shadow: 0 20px 40px rgba(2, 6, 23, 0.16);
     }
     ```
   - Header 与背景图配合，使用 `rgba(255,255,255,0.7)` + `backdrop-filter` 保持可读性。
   - HaveFun 子菜单使用 `transition` 定义 `collapse` 动画，实现展开/收起动效。

## 3. 关键代码片段

```vue
<div class="nav-group">
  <div class="nav-item nav-parent" :class="{ active: isHaveFunRoute }" @click="goHaveFun">
    <icon-game /> HaveFun
    <icon-down class="nav-arrow" :class="{ open: haveFunOpen }" />
  </div>
  <transition name="collapse">
    <div v-show="haveFunOpen" class="nav-sub">
      <router-link to="/havefun" class="nav-sub-item" active-class="active">
        <icon-game /> 玩乐首页
      </router-link>
      <router-link to="/havefun/lights" class="nav-sub-item" active-class="active">
        <icon-light /> 熄灯游戏
      </router-link>
    </div>
  </transition>
</div>
```

配合 JavaScript：

```js
data() {
  return { haveFunOpen: false }
},
computed: {
  isHaveFunRoute() { return this.$route.path.startsWith('/havefun') }
},
watch: {
  '$route.path': {
    immediate: true,
    handler() { this.haveFunOpen = this.isHaveFunRoute }
  }
}
```

## 4. 注意事项

- 侧栏背景层与全局背景图同时存在时，确保 `.layout` 设置 `z-index: 1`，并在 `App.vue` 中给背景层 `pointer-events: none`，防止遮挡导航。
- 添加新路由后，不要忘记在侧栏维护导航结构；如需多级折叠，可复用 `nav-group` 样式与逻辑。
- Header 中的二级导航目前针对 `network` 与 `havefun` 两个模块，新增模块时可比照实现。

