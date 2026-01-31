<template>
  <div class="lights-out">
    <section class="hero">
      <div class="hero-content">
        <h2>熄灯游戏</h2>
<!--        <p class="subtitle">2024.11.16 海珊瑚研发基地出品</p>-->
<!--        <p class="subtitle">2025.11.12 加入ourNote页面</p>-->
        <p class="rule">
          规则：以 <span class="highlight">0</span> 为点亮，<span class="highlight">1</span> 为熄灭。在 1~9 号格子中选取一个，
          改变它及其上下左右格子的状态，最终让所有格子变为 <span class="highlight">1</span> 即可获胜。
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="small" @click="resetBoard">重新生成局面</el-button>
          <span class="moves">操作次数：{{ steps }}</span>
        </div>
      </div>
    </section>

    <section class="board-container">
      <div class="board">
        <button
          v-for="(cell, idx) in flatBoard"
          :key="idx"
          class="cell"
          :class="{'lit': cell === 0}"
          @click="handleClick(idx)"
        >
          {{ displayValue(cell) }}
          <span class="index">{{ idx + 1 }}</span>
        </button>
      </div>
      <transition name="fade">
        <div v-if="finished" class="success-card">
          <h3>恭喜成功！</h3>
          <p>你用了 {{ steps }} 次操作熄灭了所有灯。</p>
          <div v-if="!scoreSaved" class="nickname-input">
            <el-input v-model="nickname" placeholder="请输入昵称加入排行榜" maxlength="10" style="margin-bottom: 12px;"></el-input>
            <el-button type="primary" size="small" @click="saveScoreWithNickname">保存到排行榜</el-button>
          </div>
          <el-button v-else type="success" size="small" @click="resetBoard">再来一局</el-button>
        </div>
      </transition>
    </section>

    <section class="tips">
      <h3>玩法提示</h3>
      <ul>
        <li>每次点击会翻转当前格与其上下左右相邻的格子（若存在）。</li>
        <li>随机初始局面保证至少有一盏灯亮着。</li>
        <li>可以尝试从“亮灯”较多的行列入手，逐步归零。</li>
      </ul>
    </section>

    <section class="leaderboard">
      <h3>熄灯游戏排行榜（步数越少越厉害）</h3>
      <div v-if="leaderboard && leaderboard.length">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>昵称</th>
              <th>步数</th>
              <th>日期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in leaderboard" :key="index">
              <td>#{{ index + 1 }}</td>
              <td>{{ item.nickname || '匿名' }}</td>
              <td>{{ item.steps }}</td>
              <td>{{ item.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="leaderboard-empty">
        暂无上榜记录，快来成为第一个通关并留下成绩吧！
      </p>
    </section>
  </div>
</template>

<script>
const SIZE = 3

export default {
  name: 'LightsOutView',
  data() {
    return {
      board: this.generateBoard(),
      steps: 0,
      finished: false,
      leaderboard: [],
      nickname: '',
      scoreSaved: false
    }
  },
  created() {
    this.loadLeaderboard()
  },
  computed: {
    flatBoard() {
      return this.board.flat()
    }
  },
  methods: {
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
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
    },
    toggle(board, index, reactive = false) {
      const x = Math.floor(index / SIZE)
      const y = index % SIZE
      const positions = [
        [x, y],
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1]
      ]
      positions.forEach(([row, col]) => {
        if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
          const nextVal = board[row][col] === 1 ? 0 : 1
          if (reactive) {
            this.$set(board[row], col, nextVal)
          } else {
            board[row][col] = nextVal
          }
        }
      })
    },
    handleClick(index) {
      if (this.finished) return
      this.toggle(this.board, index, true)
      this.steps += 1
      if (this.isAllOff(this.board)) {
        this.finished = true
        this.scoreSaved = false
        this.nickname = ''
        ;(this.$message && this.$message.success && this.$message.success('恭喜成功！')) || alert('恭喜成功！')
      }
    },
    isAllOff(board) {
      return board.every(row => row.every(cell => cell === 1))
    },
    displayValue(cell) {
      return cell
    },
    // 加载排行榜
    loadLeaderboard() {
      try {
        const saved = localStorage.getItem('lightsOutLeaderboard')
        this.leaderboard = saved ? JSON.parse(saved) : []
      } catch (e) {
        this.leaderboard = []
      }
    },
    // 保存成绩到排行榜（按步数升序，只保留前10名）
    saveScoreWithNickname() {
      const entry = {
        nickname: this.nickname.trim() || '匿名',
        steps: this.steps,
        date: new Date().toISOString().split('T')[0]
      }
      const list = Array.isArray(this.leaderboard) ? [...this.leaderboard, entry] : [entry]
      list.sort((a, b) => a.steps - b.steps)
      this.leaderboard = list.slice(0, 10)
      localStorage.setItem('lightsOutLeaderboard', JSON.stringify(this.leaderboard))
      this.scoreSaved = true
      ;(this.$message && this.$message.success && this.$message.success('成绩已保存到排行榜！')) || alert('成绩已保存到排行榜！')
    },
    
    // 重置游戏
    resetBoard() {
      this.board = this.generateBoard()
      this.steps = 0
      this.finished = false
      this.scoreSaved = false
      this.nickname = ''
    }
  }
}
</script>

<style scoped>
.lights-out {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
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

.rule {
  line-height: 1.6;
  margin-bottom: 16px;
}

.highlight {
  color: #facc15;
  font-weight: 600;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.moves {
  font-size: 0.95rem;
  color: #cbd5f5;
}

.board-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(3, 100px);
  gap: 12px;
}

.cell {
  position: relative;
  border: none;
  border-radius: 12px;
  font-size: 2rem;
  font-weight: 600;
  cursor: pointer;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.85);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.3);
}

.cell.lit {
  background: #38bdf8;
  color: #f8fafc;
}

.cell .index {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 0.75rem;
  opacity: 0.7;
}

.success-card {
  min-width: 220px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #0f172a;
  box-shadow: 0 16px 30px rgba(34, 197, 94, 0.2);
}

.success-card h3 {
  margin-bottom: 8px;
}

.tips {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 20px 24px;
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
  backdrop-filter: blur(8px);
}

.tips h3 {
  margin-bottom: 12px;
}

.tips ul {
  padding-left: 18px;
  line-height: 1.8;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .board {
    grid-template-columns: repeat(3, 80px);
    grid-template-rows: repeat(3, 80px);
  }

  .board-container {
    justify-content: center;
  }
}
</style>

