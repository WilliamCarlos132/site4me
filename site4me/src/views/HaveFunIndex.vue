<template>
  <div class="havefun-page">
    <section class="welcome-card">
      <h2>HaveFun</h2>
      <ul>
        <li>好吧，我知道有点无聊</li>
        <li>just have fun</li>
      </ul>
      <div class="quick-links">
        <el-button type="primary" size="small" @click="$router.push({ name: 'lights-out' })">
          💡 熄灯游戏
        </el-button>
        <el-button type="primary" size="small" @click="$router.push({ name: 'cipher-game' })">
          🔒 密文游戏
        </el-button>
        <el-button type="primary" size="small" @click="$router.push({ name: 'minesweeper' })">
          💣 扫雷
        </el-button>
        <el-button type="primary" size="small" @click="$router.push({ name: 'monty-hall' })">
          🚪 三门问题
        </el-button>
        <el-button type="primary" size="small" @click="$router.push({ name: 'boring-string' })">
          🧵无聊字符串
        </el-button>
      </div>
    </section>

    <section class="games-grid">
      <h3>小游戏一览</h3>
      <div class="grid">
        <div class="game-card" @click="$router.push({ name: 'lights-out' })">
          <div class="icon">💡</div>
          <h4>熄灯游戏</h4>
          <p>点击格子切换 0 / 1，目标是让全部变成 1，支持记录最少步数排行榜。</p>
        </div>
        <div class="game-card" @click="$router.push({ name: 'cipher-game' })">
          <div class="icon">🔒</div>
          <h4>密文游戏</h4>
          <p>输入英文句子和四位数字密码，加密 / 解密你的专属密文。</p>
        </div>
        <div class="game-card" @click="$router.push({ name: 'minesweeper' })">
          <div class="icon">💣</div>
          <h4>扫雷</h4>
          <p>经典扫雷，支持自定义难度和双人模式，单人模式成绩会进入排行榜。</p>
        </div>
        <div class="game-card" @click="$router.push({ name: 'monty-hall' })">
          <div class="icon">🚪</div>
          <h4>三门问题</h4>
          <p>亲自体验“换门更优”的概率悖论，并用模拟验证直觉。</p>
        </div>
        <div class="game-card" @click="$router.push({ name: 'boring-string' })">
          <div class="icon">🧵</div>
          <h4>无聊字符串</h4>
          <p>一些和字符串有关的小玩具，用来打发时间和练手。</p>
        </div>
      </div>
    </section>

    <section class="placeholder">
      <h3>未来规划</h3>
      <ol>
        <li>反馈区：考虑做一个专门的小游戏反馈与分享区。</li>
        <li>更多排行榜：目前已支持熄灯和扫雷排行榜，未来会给更多游戏加上记录。</li>
      </ol>
      <p class="tip">欢迎有兴趣的天才也参与到这种小游戏的制作，感激不尽。</p>
    </section>
  </div>
</template>

<script>
export default {
  name: 'HaveFunIndex'
}
</script>

<style scoped>
.havefun-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-card,
.placeholder {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
  line-height: 1.7;
}

.quick-links {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.welcome-card h2 {
  font-size: 1.8rem;
  margin-bottom: 12px;
}

.welcome-card ul {
  margin: 16px 0;
  padding-left: 20px;
}

.games-grid {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
}

.games-grid h3 {
  margin-bottom: 16px;
}

.games-grid .grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.game-card {
  background: rgba(15, 23, 42, 0.55);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.game-card:hover {
  border-color: #38bdf8;
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.45);
}

.game-card .icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.game-card h4 {
  margin-bottom: 6px;
}

.placeholder h3 {
  margin-bottom: 12px;
}

.placeholder ol {
  padding-left: 20px;
  margin-bottom: 12px;
}

.tip {
  color: #cbd5f5;
  font-size: 0.95rem;
}
</style>

