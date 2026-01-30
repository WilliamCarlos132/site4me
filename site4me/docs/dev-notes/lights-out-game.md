# 熄灯游戏开发笔记

## 1. 背景

原始 C++ 程序通过控制台实现 3×3 “熄灯游戏”：
- 初始随机点亮部分格子。
- 用户输入 1~9 翻转指定格及其四邻格。
- 当全部为 1（熄灭）时获胜。

本节记录将该逻辑迁移到 Vue 2 前端页面的过程。

## 2. 组件结构

文件：`src/views/LightsOutView.vue`

组成部分：
- `hero` 区：标题、简介、操作按钮。
- `board` 区：九宫格按钮展示灯状态。
- `success-card`：胜利提示卡片（淡入淡出）。
- `tips`：玩法提示。

## 3. 核心数据设计

```js
const SIZE = 3

data() {
  return {
    board: this.generateBoard(),  // 二维数组 3x3
    steps: 0,                     // 操作次数
    finished: false               // 是否完成
  }
},
computed: {
  flatBoard() { return this.board.flat() } // 渲染方便
}
```

`board` 中：0 表示“亮灯”（蓝色高亮），1 表示“熄灭”。

## 4. 随机局面生成

```js
generateBoard() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(1))
  const indices = Array.from({ length: SIZE * SIZE }, (_, i) => i)
  this.shuffle(indices)
  const toggles = Math.floor(Math.random() * (SIZE * SIZE - 1)) + 1
  for (let i = 0; i < toggles; i++) {
    this.toggle(board, indices[i])
  }
  if (this.isAllOff(board)) {
    const randomIndex = Math.floor(Math.random() * SIZE * SIZE)
    this.toggle(board, randomIndex)
  }
  return board
}
```

- 先将所有格子设为 1（熄灭）。
- 随机选若干位置调用 `toggle`，生成起始局面。
- 若结果全为 1，则再翻一次保证至少一盏灯亮。

## 5. 状态翻转与响应式修复

原始 `toggle` 逻辑：

```js
toggle(board, index) {
  const x = Math.floor(index / SIZE)
  const y = index % SIZE
  const positions = [[x, y], [x-1,y], [x+1,y], [x,y-1], [x,y+1]]
  positions.forEach(([row, col]) => {
    if (...) {
      board[row][col] = board[row][col] === 1 ? 0 : 1
    }
  })
}
```

在 Vue 2 中，直接使用数组下标赋值不会触发视图更新。因此在响应式场景下，使用 `this.$set`：

```js
toggle(board, index, reactive = false) {
  ...
  const nextVal = board[row][col] === 1 ? 0 : 1
  if (reactive) {
    this.$set(board[row], col, nextVal)
  } else {
    board[row][col] = nextVal
  }
}
```

- 初始化局面时 `reactive = false`，直接修改即可。
- 用户点击时传入 `true`，保证按钮颜色与数字同步变化。

## 6. 用户交互流程

```js
handleClick(index) {
  if (this.finished) return
  this.toggle(this.board, index, true)
  this.steps += 1
  if (this.isAllOff(this.board)) {
    this.finished = true
    this.$message.success?.('恭喜成功！') || alert('恭喜成功！')
  }
}
```

- `isAllOff` 判断是否全部为 1。
- 成功后 `finished = true`，阻止继续点击。

`resetBoard()` 重置局面与步骤：

```js
resetBoard() {
  this.board = this.generateBoard()
  this.steps = 0
  this.finished = false
}
```

## 7. 样式要点

- 按钮使用 `grid` 定位为 3×3：
  ```css
  .board {
    display: grid;
    grid-template-columns: repeat(3, 100px);
    gap: 12px;
  }
  ```
- `.cell.lit`（值为 0）加蓝色背景，区分“亮灯”状态。
- 添加 `transition` 让点击时阴影变化，增强反馈。
- 使用 `transition name="fade"` 包裹 `success-card` 提示。

## 8. 复刻注意点

1. **响应式更新**：在 Vue 2 中操作多维数组务必使用 `this.$set`。
2. **随机性**：`generateBoard` 保证至少一盏灯亮，避免刚开始就通关。
3. **消息提示**：项目全局注册了 Element UI，可直接使用 `$message`；为了兼容未加载 Element UI 的情况，用 `|| alert` 兜底。
4. **扩展**：若要支持不同棋盘大小，可抽离 `SIZE` 和 `positions` 计算逻辑，配合设置面板实现自定义。

通过以上步骤，即可将控制台版游戏完整迁移到前端可视化界面。

