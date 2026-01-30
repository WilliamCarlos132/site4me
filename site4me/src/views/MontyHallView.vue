<template>
  <div class="monty-hall">
    <section class="hero">
      <div class="hero-content">
        <h2>三门问题</h2>
        <p class="subtitle">2024.11.14 海珊瑚研发中心出品</p>
        <p>
          节目规则：三扇门中隐藏一辆豪车，其余两扇门是山羊。你先选择一扇门，主持人会从剩余两扇门中打开一扇“山羊门”，然后询问你是否要改变选择。
          本页面支持互动体验与概率验证，帮助理解“换门胜率更高”的经典结论。
        </p>
      </div>
    </section>

    <section class="interactive card">
      <header class="section-header">
        <h3>模式一：亲自尝试</h3>
        <el-button size="small" type="primary" @click="startTryGame">开始新一局</el-button>
      </header>
      <div class="door-area">
        <button
          v-for="door in doors"
          :key="door"
          class="door"
          :class="doorClasses(door)"
          :disabled="isDoorDisabled(door)"
          @click="handleDoorClick(door)"
        >
          <span class="door-number">{{ door + 1 }}</span>
          <span class="door-label">
            {{ doorLabel(door) }}
          </span>
        </button>
      </div>
      <transition name="fade">
        <div v-if="tryState.stage === 'decision'" class="decision-area">
          <p>主持人打开了 <strong>{{ tryState.hostReveal + 1 }} 号门</strong>，里面是一只山羊。是否要更改选择？</p>
          <div class="decision-actions">
            <el-button type="success" @click="decideSwitch">我要改变选择</el-button>
            <el-button type="warning" @click="decideStay">坚持原选择</el-button>
          </div>
        </div>
      </transition>
      <transition name="fade">
        <div v-if="tryState.stage === 'result'" class="result-area">
          <p class="result-title" :class="{ success: tryState.result === 'win', fail: tryState.result === 'lose' }">
            {{ tryState.message }}
          </p>
          <ul class="result-detail">
            <li>豪车在：{{ tryState.carDoor + 1 }} 号门</li>
            <li>初始选择：{{ tryState.userChoice + 1 }} 号门</li>
            <li>主持人打开：{{ tryState.hostReveal + 1 }} 号门</li>
            <li>最终选择：{{ tryState.finalChoice + 1 }} 号门</li>
          </ul>
          <el-button size="small" @click="startTryGame">再来一局</el-button>
        </div>
      </transition>
    </section>

    <section class="simulation card">
      <header class="section-header">
        <h3>模式二：概率验证</h3>
      </header>
      <div class="simulation-form">
        <el-form :inline="true" :model="simulationForm">
          <el-form-item label="模拟次数">
            <el-input-number v-model="simulationForm.trials" :min="1" :max="100000" />
          </el-form-item>
          <el-form-item label="策略">
            <el-select v-model="simulationForm.strategy" placeholder="选择策略" style="width: 150px;">
              <el-option label="坚持原门" value="stay" />
              <el-option label="切换另一扇门" value="switch" />
              <el-option label="同时统计两种策略" value="both" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="simulationRunning" @click="runSimulation">
              开始模拟
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <transition name="fade">
        <div v-if="simulationResult" class="simulation-result">
          <p>共运行 {{ simulationResult.trials }} 次模拟。</p>
          <div class="result-grid">
            <div class="result-card">
              <h4>坚持原门</h4>
              <p class="value">{{ simulationResult.stayWins }}</p>
              <p class="desc">获胜次数（胜率 {{ simulationResult.stayRate }}%）</p>
            </div>
            <div class="result-card">
              <h4>切换另一扇门</h4>
              <p class="value">{{ simulationResult.switchWins }}</p>
              <p class="desc">获胜次数（胜率 {{ simulationResult.switchRate }}%）</p>
            </div>
          </div>
          <p class="conclusion">
            {{ simulationConclusion }}
          </p>
        </div>
      </transition>
    </section>

    <section class="tips card">
      <h3>玩法提示</h3>
      <ul>
        <li>主持人永远会打开一扇“确保是山羊”的门，因此信息被更新。</li>
        <li>坚持原门相当于押初始概率 1/3；切换相当于押“其他两门”的概率 2/3。</li>
        <li>模拟越多次，统计结果越接近理论值：切换的胜率约 66%，坚持的胜率约 33%。</li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {
  name: 'MontyHallView',
  data() {
    return {
      doors: [0, 1, 2],
      tryState: {
        stage: 'idle',
        carDoor: null,
        userChoice: null,
        hostReveal: null,
        finalChoice: null,
        result: null,
        message: ''
      },
      simulationForm: {
        trials: 100,
        strategy: 'both'
      },
      simulationResult: null,
      simulationRunning: false
    }
  },
  computed: {
    simulationConclusion() {
      if (!this.simulationResult) return ''
      const { stayRate, switchRate } = this.simulationResult
      if (switchRate > stayRate) {
        return '数据表明：切换选择更容易获得豪车！'
      }
      if (switchRate === stayRate) {
        return '两种策略的胜率完全相同，这通常只会在样本量极小或偶然情况下出现。'
      }
      return '数据表明：坚持原选择更容易获胜（较罕见的统计情形）。'
    }
  },
  methods: {
    initialTryState() {
      return {
        stage: 'idle', // idle -> select -> decision -> result
        carDoor: null,
        userChoice: null,
        hostReveal: null,
        finalChoice: null,
        result: null,
        message: ''
      }
    },
    randomDoor() {
      return Math.floor(Math.random() * 3)
    },
    startTryGame() {
      console.log('开始新游戏')
      // 重置所有状态
      this.tryState.stage = 'select'
      this.tryState.carDoor = this.randomDoor()
      this.tryState.userChoice = null
      this.tryState.hostReveal = null
      this.tryState.finalChoice = null
      this.tryState.result = null
      this.tryState.message = ''
      console.log('游戏状态:', this.tryState)
      // 强制更新视图
      this.$forceUpdate()
    },
    handleDoorClick(door) {
      console.log('点击门:', door, '当前阶段:', this.tryState.stage)
      if (this.tryState.stage !== 'select') {
        console.log('阶段不对，无法点击')
        return
      }
      this.tryState.userChoice = door
      this.tryState.hostReveal = this.revealGoatDoor(door, this.tryState.carDoor)
      this.tryState.stage = 'decision'
      this.$forceUpdate()
      console.log('状态已更新:', this.tryState)
    },
    isDoorDisabled(door) {
      const stage = this.tryState.stage
      if (stage === 'idle') return true
      if (stage === 'select') return false
      if (stage === 'decision') {
        // 在决策阶段，只有用户选择的门和主持人打开的门可以点击（用于显示）
        return door !== this.tryState.userChoice && door !== this.tryState.hostReveal
      }
      // result 阶段所有门都禁用
      return true
    },
    doorClasses(door) {
      return {
        selected: this.tryState.userChoice === door && this.tryState.stage !== 'idle',
        host: this.tryState.hostReveal === door,
        car: this.tryState.stage === 'result' && this.tryState.carDoor === door,
        final: this.tryState.stage === 'result' && this.tryState.finalChoice === door
      }
    },
    doorLabel(door) {
      if (this.tryState.stage === 'idle') return '等待开始'
      if (this.tryState.stage === 'select') {
        return this.tryState.userChoice === door ? '我的选择' : '点击选择'
      }
      if (this.tryState.stage === 'decision') {
        if (this.tryState.userChoice === door) return '我的选择'
        if (this.tryState.hostReveal === door) return '主持人打开'
        return '未开之门'
      }
      if (this.tryState.stage === 'result') {
        if (this.tryState.carDoor === door) return '豪车在这里'
        return '山羊门'
      }
      return ''
    },
    revealGoatDoor(userChoice, carDoor) {
      const options = this.doors.filter(
        door => door !== userChoice && door !== carDoor
      )
      if (options.length === 1) return options[0]
      // 如果用户选的是豪车，主持人会随机开剩下两扇中的任意一扇山羊门
      return options[Math.floor(Math.random() * options.length)]
    },
    decideStay() {
      if (this.tryState.stage !== 'decision') return
      this.finishTryRound(this.tryState.userChoice, false)
    },
    decideSwitch() {
      if (this.tryState.stage !== 'decision') return
      const finalDoor = this.doors.find(
        door => door !== this.tryState.userChoice && door !== this.tryState.hostReveal
      )
      this.finishTryRound(finalDoor, true)
    },
    finishTryRound(finalDoor, switched) {
      this.$set(this.tryState, 'finalChoice', finalDoor)
      this.$set(this.tryState, 'stage', 'result')
      if (finalDoor === this.tryState.carDoor) {
        this.$set(this.tryState, 'result', 'win')
        this.$set(this.tryState, 'message', switched
          ? '改变选择成功赢得豪车！'
          : '坚持选择成功赢得豪车！')
      } else {
        this.$set(this.tryState, 'result', 'lose')
        this.$set(this.tryState, 'message', switched
          ? '很遗憾，这次改变选择换到了山羊。'
          : '很遗憾，这次坚持原选择拿到的是山羊。')
      }
    },
    async runSimulation() {
      const { trials, strategy } = this.simulationForm
      if (!strategy) {
        (this.$message && this.$message.warning && this.$message.warning('请选择策略')) || alert('请选择策略')
        return
      }
      if (!Number.isInteger(trials) || trials <= 0) {
        (this.$message && this.$message.warning && this.$message.warning('请输入大于 0 的模拟次数')) || alert('请输入大于 0 的模拟次数')
        return
      }
      if (trials > 100000) {
        (this.$message && this.$message.warning && this.$message.warning('模拟次数请勿超过 100000 次')) || alert('模拟次数请勿超过 100000 次')
        return
      }

      this.simulationRunning = true
      await this.$nextTick()

      let stayWins = 0
      let switchWins = 0

      for (let i = 0; i < trials; i++) {
        const carDoor = this.randomDoor()
        const userChoice = this.randomDoor()
        const hostReveal = this.revealGoatDoor(userChoice, carDoor)
        const switchedDoor = this.doors.find(
          door => door !== userChoice && door !== hostReveal
        )

        if (strategy === 'stay' || strategy === 'both') {
          if (userChoice === carDoor) stayWins += 1
        }
        if (strategy === 'switch' || strategy === 'both') {
          if (switchedDoor === carDoor) switchWins += 1
        }
      }

      const stayRate =
        strategy === 'switch'
          ? 0
          : ((stayWins / trials) * 100).toFixed(2)
      const switchRate =
        strategy === 'stay'
          ? 0
          : ((switchWins / trials) * 100).toFixed(2)

      this.simulationResult = {
        trials,
        stayWins,
        switchWins,
        stayRate,
        switchRate
      }
      this.simulationRunning = false
    }
  }
}
</script>

<style scoped>
.monty-hall {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
}

.hero {
  @extend .card;
}

.hero-content h2 {
  font-size: 1.9rem;
  margin-bottom: 10px;
  color: #f8fafc;
}

.subtitle {
  margin-bottom: 12px;
  font-weight: 500;
  color: #cbd5f5;
}

.rule {
  line-height: 1.6;
  color: #e2e8f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.door-area {
  display: flex;
  justify-content: space-around;
  gap: 24px;
  margin-bottom: 16px;
}

.door {
  position: relative;
  width: 160px;
  height: 220px;
  border-radius: 18px;
  border: 3px solid rgba(248, 250, 252, 0.3);
  background: linear-gradient(145deg, rgba(248, 250, 252, 0.15), rgba(15, 23, 42, 0.5));
  color: #f8fafc;
  font-size: 1.6rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.door:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 16px 24px rgba(15, 23, 42, 0.35);
}

.door:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.door.selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
}

.door.host {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.3);
}

.door.final {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.35);
}

.door.car {
  background: linear-gradient(145deg, rgba(250, 204, 21, 0.4), rgba(251, 191, 36, 0.7));
  color: #0f172a;
}

.door-number {
  font-size: 2.4rem;
  font-weight: 700;
}

.door-label {
  font-size: 1rem;
  opacity: 0.9;
}

.decision-area {
  margin-top: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.decision-actions {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.result-area {
  margin-top: 16px;
  padding: 20px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 16px;
  color: #0f172a;
}

.result-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.result-title.success {
  color: #15803d;
}

.result-title.fail {
  color: #b91c1c;
}

.result-detail {
  margin-bottom: 12px;
  padding-left: 18px;
  line-height: 1.6;
}

.simulation-form {
  margin-bottom: 16px;
}

.simulation-result {
  margin-top: 12px;
}

.result-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 16px 0;
}

.result-card {
  flex: 1;
  min-width: 200px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.55);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  text-align: center;
}

.result-card h4 {
  margin-bottom: 10px;
  font-size: 1.1rem;
  color: #cbd5f5;
}

.result-card .value {
  font-size: 2rem;
  font-weight: 700;
  color: #facc15;
}

.result-card .desc {
  margin-top: 8px;
  color: #e2e8f0;
}

.conclusion {
  margin-top: 8px;
  font-weight: 600;
  color: #f8fafc;
}

.tips ul {
  padding-left: 20px;
  line-height: 1.8;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .door-area {
    flex-direction: column;
    align-items: center;
  }
  .door {
    width: 200px;
  }
  .decision-actions {
    flex-direction: column;
  }
  .result-grid {
    flex-direction: column;
  }
}
</style>

