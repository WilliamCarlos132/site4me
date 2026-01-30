<template>
  <div class="minesweeper">
    <section class="hero">
      <div class="hero-content">
        <h2>扫雷 1.3版</h2>
        <p class="subtitle">2025.1.14 海珊瑚第二基地出品</p>
        <p>
          规则：点击格子查看周围地雷数量，自动展开相邻空白区域。避免踩到地雷，尽可能获得更高分数。
          坐标系统：左上角为 (1,1)，右下角为 (n,n)。
        </p>
      </div>
    </section>

    <section class="game-panel card">
      <!-- 游戏设置 -->
      <div v-if="gameState === 'setup'" class="setup-section">
        <h3>游戏设置</h3>
        <div class="setup-options">
          <div class="option-group">
            <label>模式选择：</label>
            <el-radio-group v-model="gameMode" size="medium">
              <el-radio-button :label="1">经典模式（10×10）</el-radio-button>
              <el-radio-button :label="2">自定义模式</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="gameMode === 2" class="option-group">
            <label>雷区大小（n×n）：</label>
            <el-input-number v-model="customSize" :min="5" :max="20" />
            <label style="margin-left: 16px;">地雷数量：</label>
            <el-input-number v-model="customMines" :min="1" :max="customSize * customSize - 1" />
          </div>
          <div class="option-group">
            <label>游戏类型：</label>
            <el-radio-group v-model="playerMode" size="medium">
              <el-radio-button :label="1">单人模式</el-radio-button>
              <el-radio-button :label="2">双人模式</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="playerMode === 2" class="option-group">
            <el-input v-model="player1Name" placeholder="第一位玩家名称" style="width: 200px; margin-right: 12px;" />
            <el-input v-model="player2Name" placeholder="第二位玩家名称" style="width: 200px;" />
          </div>
          <div class="action-buttons">
            <el-button type="primary" size="medium" @click="startGame">开始游戏</el-button>
          </div>
        </div>
      </div>

      <!-- 游戏进行中 -->
      <div v-else-if="gameState === 'playing' || gameState === 'gameover' || gameState === 'win'" class="game-section">
        <div class="game-header">
          <div class="score-board">
            <div v-if="playerMode === 1" class="score-item">
              <span class="score-label">当前积分：</span>
              <span class="score-value">{{ score1 }}</span>
            </div>
            <div v-else class="score-item">
              <div class="player-score" :class="{ active: currentPlayer === 1 }">
                <span class="player-name">{{ player1Name || '玩家1' }}</span>
                <span class="score-value">{{ score1 }}</span>
              </div>
              <div class="player-score" :class="{ active: currentPlayer === 2 }">
                <span class="player-name">{{ player2Name || '玩家2' }}</span>
                <span class="score-value">{{ score2 }}</span>
              </div>
            </div>
          </div>
          <div class="game-info">
            <span>剩余地雷：{{ remainingMines }}</span>
            <span>已翻开：{{ revealedCount }} / {{ totalCells - mineCount }}</span>
          </div>
        </div>

        <div class="board-container">
          <div class="board" :style="{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }">
            <button
              v-for="(cell, index) in cells"
              :key="index"
              class="cell"
              :class="getCellClass(cell, index)"
              :disabled="gameState !== 'playing'"
              @click="handleCellClick(index)"
              @contextmenu.prevent="handleRightClick(index)"
            >
              {{ getCellDisplay(cell, index) }}
            </button>
          </div>
        </div>

        <div v-if="gameState === 'gameover'" class="game-result fail">
          <h3>游戏结束</h3>
          <p v-if="playerMode === 1">您触发了地雷！最终积分：{{ score1 }}</p>
          <p v-else>
            <span v-if="currentPlayer === 1">{{ player1Name || '玩家1' }} 触发了地雷，积分清零</span>
            <span v-else>{{ player2Name || '玩家2' }} 触发了地雷，积分清零</span>
            <br />
            <span>获胜者：{{ currentPlayer === 1 ? (player2Name || '玩家2') : (player1Name || '玩家1') }}</span>
          </p>
          <el-button type="primary" @click="resetGame">再来一局</el-button>
        </div>

        <div v-if="gameState === 'win'" class="game-result success">
          <h3>恭喜！扫雷完成</h3>
          <p v-if="playerMode === 1">您的最终积分：{{ score1 }}</p>
          <p v-else>
            {{ player1Name || '玩家1' }}: {{ score1 }} 分<br />
            {{ player2Name || '玩家2' }}: {{ score2 }} 分
          </p>
          <div v-if="playerMode === 1 && !scoreSaved" class="nickname-input">
            <el-input v-model="nickname" placeholder="请输入昵称加入排行榜" maxlength="10" style="margin-bottom: 12px;"></el-input>
            <el-button type="primary" @click="saveScoreWithNickname">保存到排行榜</el-button>
          </div>
          <el-button v-else type="primary" @click="resetGame">再来一局</el-button>
        </div>

        <div class="game-actions">
          <el-button size="small" @click="resetGame">重新开始</el-button>
          <el-button size="small" @click="backToSetup">返回设置</el-button>
        </div>
      </div>
    </section>

    <section class="tips card">
      <h3>游戏提示</h3>
      <ul>
        <li>左键点击：翻开格子，显示周围地雷数量或自动展开空白区域</li>
        <li>右键点击：标记/取消标记地雷（标记后无法点击）</li>
        <li>数字表示周围8格中地雷的数量</li>
        <li>点击到地雷会立即结束游戏</li>
        <li>双人模式：轮流操作，踩到地雷的一方积分清零，另一方获胜</li>
      </ul>
    </section>

    <section class="leaderboard card">
      <h3>扫雷排行榜（单人模式）</h3>
      <div v-if="leaderboard && leaderboard.length">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>昵称</th>
              <th>得分</th>
              <th>日期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in leaderboard" :key="index">
              <td>#{{ index + 1 }}</td>
              <td>{{ item.nickname || '匿名' }}</td>
              <td>{{ item.score }}</td>
              <td>{{ item.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="leaderboard-empty">
        还没有任何扫雷成绩被记录，尝试完成一局单人扫雷来上榜吧！
      </p>
    </section>
  </div>
</template>

<script>
export default {
  name: 'MinesweeperView',
  data() {
    return {
      gameState: 'setup', // setup, playing, gameover, win
      gameMode: 1, // 1: 经典, 2: 自定义
      playerMode: 1, // 1: 单人, 2: 双人
      customSize: 10,
      customMines: 10,
      player1Name: '',
      player2Name: '',
      currentPlayer: 1, // 1 或 2
      
      boardSize: 10,
      mineCount: 10,
      cells: [],
      mines: [],
      revealed: [],
      flagged: [],
      score1: 0,
      score2: 0,
      remainingMines: 10,
      leaderboard: [],
      nickname: '',
      scoreSaved: false
    }
  },
  computed: {
    totalCells() {
      return this.boardSize * this.boardSize
    },
    revealedCount() {
      return this.revealed.filter(r => r).length
    }
  },
  methods: {
    // 记录单人模式成绩到排行榜（按得分从高到低）
    saveScoreWithNickname() {
      if (this.playerMode !== 1) return
      const entry = {
        nickname: this.nickname.trim() || '匿名',
        score: this.score1,
        date: new Date().toISOString().split('T')[0]
      }
      let list = []
      try {
        const saved = localStorage.getItem('minesweeperLeaderboard')
        list = saved ? JSON.parse(saved) : []
      } catch (e) {
        list = []
      }
      list.push(entry)
      list.sort((a, b) => b.score - a.score)
      this.leaderboard = list.slice(0, 10)
      localStorage.setItem('minesweeperLeaderboard', JSON.stringify(this.leaderboard))
      this.scoreSaved = true
      ;(this.$message && this.$message.success && this.$message.success('成绩已保存到排行榜！')) || alert('成绩已保存到排行榜！')
    },
    
    // 检查是否胜利
    checkWin() {
      // 检查是否所有非地雷格子都已翻开
      for (let i = 0; i < this.totalCells; i++) {
        if (!this.mines[i] && !this.revealed[i]) {
          return false
        }
      }
      return true
    },
    loadLeaderboard() {
      try {
        const saved = localStorage.getItem('minesweeperLeaderboard')
        this.leaderboard = saved ? JSON.parse(saved) : []
      } catch (e) {
        this.leaderboard = []
      }
    },
    startGame() {
      // 验证设置
      if (this.playerMode === 2 && (!this.player1Name.trim() || !this.player2Name.trim())) {
        (this.$message && this.$message.warning && this.$message.warning('请输入两位玩家的名称')) || alert('请输入两位玩家的名称')
        return
      }
      
      if (this.gameMode === 2) {
        if (this.customMines >= this.customSize * this.customSize) {
          (this.$message && this.$message.warning && this.$message.warning('地雷数量不能大于等于格子总数')) || alert('地雷数量不能大于等于格子总数')
          return
        }
        this.boardSize = this.customSize
        this.mineCount = this.customMines
      } else {
        this.boardSize = 10
        this.mineCount = 10
      }
      
      this.remainingMines = this.mineCount
      this.initializeBoard()
      this.gameState = 'playing'
      this.currentPlayer = 1
      this.score1 = 0
      this.score2 = 0
    },
    initializeBoard() {
      // 初始化格子
      this.cells = Array(this.totalCells).fill(0)
      this.revealed = Array(this.totalCells).fill(false)
      this.flagged = Array(this.totalCells).fill(false)
      
      // 随机放置地雷
      this.mines = Array(this.totalCells).fill(false)
      const positions = []
      for (let i = 0; i < this.totalCells; i++) {
        positions.push(i)
      }
      // 随机打乱
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]]
      }
      // 放置地雷
      for (let i = 0; i < this.mineCount; i++) {
        this.mines[positions[i]] = true
      }
      
      // 计算每个格子的数字
      for (let i = 0; i < this.totalCells; i++) {
        if (!this.mines[i]) {
          this.cells[i] = this.countNearbyMines(i)
        } else {
          this.cells[i] = -1 // -1 表示地雷
        }
      }
    },
    countNearbyMines(index) {
      const row = Math.floor(index / this.boardSize)
      const col = index % this.boardSize
      let count = 0
      
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = row + dr
          const nc = col + dc
          if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
            const ni = nr * this.boardSize + nc
            if (this.mines[ni]) count++
          }
        }
      }
      return count
    },
    handleCellClick(index) {
      if (this.gameState !== 'playing') return
      if (this.revealed[index] || this.flagged[index]) return
      if (this.mines[index]) {
        // 踩到地雷：显示所有地雷位置
        for (let i = 0; i < this.totalCells; i++) {
          if (this.mines[i]) {
            this.revealed[i] = true
          }
        }
        this.gameState = 'gameover'
        if (this.playerMode === 2) {
          // 双人模式：当前玩家积分清零，对方获胜
          if (this.currentPlayer === 1) {
            this.score1 = 0
          } else {
            this.score2 = 0
          }
        }
        return
      }
      
      // 展开格子
      this.revealCell(index)
      
      // 检查是否胜利
      if (this.checkWin()) {
        this.gameState = 'win'
        // 仅单人模式重置排行榜保存状态
        if (this.playerMode === 1) {
          this.scoreSaved = false
          this.nickname = ''
        }
        return
      }
      
      // 双人模式切换玩家
      if (this.playerMode === 2) {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1
      }
    },
    revealCell(index) {
      if (this.revealed[index] || this.flagged[index]) return
      
      this.revealed[index] = true
      const cellValue = this.cells[index]
      
      // 如果是数字格子，计算分数
      if (cellValue > 0) {
        if (this.playerMode === 1) {
          this.score1 += cellValue
        } else {
          if (this.currentPlayer === 1) {
            this.score1 += cellValue
          } else {
            this.score2 += cellValue
          }
        }
      }
      
      // 如果是空白格子（值为0），自动展开相邻格子
      if (cellValue === 0) {
        const row = Math.floor(index / this.boardSize)
        const col = index % this.boardSize
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue
            const nr = row + dr
            const nc = col + dc
            if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
              const ni = nr * this.boardSize + nc
              if (!this.revealed[ni] && !this.flagged[ni] && !this.mines[ni]) {
                this.revealCell(ni)
              }
            }
          }
        }
      }
    },
    handleRightClick(index) {
      if (this.gameState !== 'playing') return
      if (this.revealed[index]) return
      
      // 切换标记状态
      this.$set(this.flagged, index, !this.flagged[index])
      if (this.flagged[index]) {
        this.remainingMines--
      } else {
        this.remainingMines++
      }
    },
    getCellClass(cell, index) {
      return {
        revealed: this.revealed[index],
        flagged: this.flagged[index],
        mine: this.mines[index] && this.revealed[index],
        'cell-1': cell === 1,
        'cell-2': cell === 2,
        'cell-3': cell === 3,
        'cell-4': cell === 4,
        'cell-5': cell === 5,
        'cell-6': cell === 6,
        'cell-7': cell === 7,
        'cell-8': cell === 8
      }
    },
    getCellDisplay(cell, index) {
      if (this.flagged[index]) {
        return '🚩'
      }
      if (!this.revealed[index]) {
        return ''
      }
      if (this.mines[index]) {
        return '💣'
      }
      if (cell === 0) {
        return ''
      }
      return cell
    },
    resetGame() {
      this.initializeBoard()
      this.gameState = 'playing'
      this.currentPlayer = 1
      this.score1 = 0
      this.score2 = 0
      this.remainingMines = this.mineCount
      this.scoreSaved = false
      this.nickname = ''
    },
    backToSetup() {
      this.gameState = 'setup'
    }
  },
  created() {
    this.loadLeaderboard()
  }
}
</script>

<style scoped>
.minesweeper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
}

.hero-content h2 {
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: #f8fafc;
}

.subtitle {
  margin-bottom: 12px;
  font-weight: 500;
  color: #cbd5f5;
}

.card {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
}

.setup-section h3 {
  margin-bottom: 20px;
  color: #f8fafc;
}

.setup-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.option-group label {
  font-weight: 500;
  color: #e2e8f0;
  min-width: 100px;
}

.action-buttons {
  margin-top: 12px;
}

.game-header {
  margin-bottom: 20px;
}

.score-board {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-score {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s;
}

.player-score.active {
  background: rgba(0, 140, 140, 0.3);
  border-color: #008C8C;
  box-shadow: 0 0 12px rgba(0, 140, 140, 0.4);
}

.player-name {
  font-weight: 600;
  margin-right: 8px;
}

.score-label {
  font-weight: 500;
  color: #e2e8f0;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #facc15;
}

.game-info {
  display: flex;
  gap: 24px;
  color: #cbd5f5;
  font-size: 0.95rem;
}

.board-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  overflow-x: auto;
}

.board {
  display: grid;
  gap: 2px;
  background: rgba(148, 163, 184, 0.3);
  padding: 2px;
  border-radius: 8px;
}

.cell {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 4px;
  background: rgba(248, 250, 252, 0.2);
  color: #f8fafc;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell:hover:not(:disabled):not(.revealed):not(.flagged) {
  background: rgba(248, 250, 252, 0.35);
  transform: scale(1.05);
}

.cell:disabled {
  cursor: not-allowed;
}

.cell.revealed {
  background: rgba(255, 255, 255, 0.15);
  cursor: default;
}

.cell.flagged {
  background: rgba(239, 68, 68, 0.3);
}

.cell.mine {
  background: rgba(239, 68, 68, 0.5);
}

.cell.cell-1 { color: #3b82f6; }
.cell.cell-2 { color: #22c55e; }
.cell.cell-3 { color: #ef4444; }
.cell.cell-4 { color: #008C8C; }
.cell.cell-5 { color: #f59e0b; }
.cell.cell-6 { color: #06b6d4; }
.cell.cell-7 { color: #000000; }
.cell.cell-8 { color: #64748b; }

.game-result {
  margin-top: 24px;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.game-result.success {
  background: rgba(34, 197, 94, 0.2);
  border: 2px solid rgba(34, 197, 94, 0.5);
}

.game-result.fail {
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid rgba(239, 68, 68, 0.5);
}

.game-result h3 {
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.game-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.tips h3 {
  margin-bottom: 12px;
  color: #f8fafc;
}

.tips ul {
  padding-left: 20px;
  line-height: 1.8;
}

.tips li {
  margin-bottom: 8px;
}

.leaderboard {
  margin-top: 16px;
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 20px 24px;
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
  backdrop-filter: blur(8px);
}

.leaderboard h3 {
  margin-bottom: 12px;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 8px 6px;
  text-align: left;
}

.leaderboard-table thead {
  border-bottom: 1px solid rgba(148, 163, 184, 0.6);
}

.leaderboard-table tbody tr:nth-child(odd) {
  background: rgba(15, 23, 42, 0.35);
}

.leaderboard-table tbody tr:nth-child(even) {
  background: rgba(15, 23, 42, 0.2);
}

.leaderboard-empty {
  font-size: 0.9rem;
  color: #cbd5f5;
}

/* Element UI 样式覆盖 */
::v-deep .el-radio-button__inner {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.3);
}

::v-deep .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background: #008C8C;
  color: #fff;
  border-color: #008C8C;
}

::v-deep .el-input__inner {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(148, 163, 184, 0.3);
  color: #f8fafc;
}

::v-deep .el-input__inner::placeholder {
  color: #94a3b8;
}

@media (max-width: 768px) {
  .cell {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }
  
  .board-container {
    overflow-x: auto;
  }
}
</style>

