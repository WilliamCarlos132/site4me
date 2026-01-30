<template>
  <div class="poll-card card">
    <div class="card-header">
      <h3>{{ poll.question }}</h3>
    </div>

    <!-- 投票 -->
    <div v-if="!poll.voted" class="vote-form">
      <div v-for="opt in poll.options" :key="opt.id" class="option-item">
        <label>
          <input type="radio" :value="opt.id" v-model="selected" />
          <span>{{ opt.text }}</span>
        </label>
      </div>
      <button @click="vote" :disabled="!selected" class="btn btn-primary">
        提交投票
      </button>
    </div>

    <!-- 结果 -->
    <div v-else class="results">
      <div v-for="opt in poll.options" :key="opt.id" class="result-bar">
        <div class="label">{{ opt.text }}</div>
        <div class="bar-bg">
          <div class="bar-fill" :style="{ width: opt.percent + '%', background: getColor(opt.percent) }"></div>
        </div>
        <div class="percent">{{ opt.percent.toFixed(1) }}% ({{ opt.votes }}票)</div>
      </div>
      <div class="total">共 {{ poll.totalVotes }} 人参与</div>
    </div>
  </div>
</template>

<script>
import api from '@/api/poll'

export default {
  props: ['poll'],
  data() { return { selected: null } },
  methods: {
    async vote() {
      await api.vote(this.poll.id, this.selected)
      localStorage.setItem(`poll_${this.poll.id}_voted`, 'true')
      this.$emit('refresh')
    },
    getColor(percent) {
      if (percent > 70) return '#10b981'
      if (percent > 40) return '#3b82f6'
      return '#f59e0b'
    }
  }
}
</script>

<style scoped>
.poll-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}
.card-header {
  padding: 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}
.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}
.vote-form, .results {
  padding: 20px;
}
.option-item {
  margin-bottom: 12px;
}
.option-item label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 500;
}
.result-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 0.95rem;
}
.label {
  width: 120px;
  font-weight: 500;
}
.bar-bg {
  flex: 1;
  height: 32px;
  background: #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 12px;
}
.bar-fill {
  height: 100%;
  border-radius: 16px;
  transition: width 0.6s ease;
}
.percent {
  width: 90px;
  text-align: right;
  font-weight: 600;
  color: #475569;
}
.total {
  text-align: center;
  margin-top: 16px;
  color: #94a3b8;
  font-style: italic;
}
</style>