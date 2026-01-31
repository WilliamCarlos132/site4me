<template>
  <div class="vote-view">
    <!-- 投票页面标题 -->
    <div class="vote-header">
      <h1>投票广场</h1>
      <p>参与投票，查看实时结果</p>
    </div>

    <!-- 问题切换控制 -->
    <div class="poll-navigation">
      <button 
        class="nav-btn prev-btn"
        @click="prevPoll"
        :disabled="currentPollIndex === 0"
      >
        ← 上一题
      </button>
      <div class="poll-info">
        <span class="poll-number">{{ currentPollIndex + 1 }} / {{ polls.length }}</span>
      </div>
      <button 
        class="nav-btn next-btn"
        @click="nextPoll"
        :disabled="currentPollIndex === polls.length - 1"
      >
        下一题 →
      </button>
    </div>

    <!-- 投票问题 -->
    <div class="vote-question">
      <h2>{{ currentPoll.question }}</h2>
    </div>

    <!-- 投票选项 -->
    <div class="vote-options">
      <div 
        v-for="(option, index) in currentPoll.options" 
        :key="index"
        class="vote-option"
        @click="submitVote(index)"
        :class="{ disabled: hasVotedForCurrentPoll }"
      >
        <div class="option-content">
          <div class="option-text">{{ option.text }}</div>
          <div v-if="hasVotedForCurrentPoll" class="option-votes">{{ option.votes }} 票</div>
        </div>
        <div v-if="hasVotedForCurrentPoll" class="option-progress">
          <div 
            class="option-bar"
            :style="{ width: getOptionPercentage(index) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 投票状态提示 -->
    <div class="vote-status" v-if="hasVotedForCurrentPoll">
      <p>您已经参与过此问题的投票，感谢您的参与！</p>
      <p class="status-hint">投票结果将实时更新</p>
    </div>
  </div>
</template>

<script>
import { db, ref, set, onValue, get } from '@/firebase'

export default {
  data() {
    return {
      polls: [
        {
          id: 'poll-1',
          question: '你更喜欢小猫还是小狗？',
          options: [
            { text: '小猫', votes: 0 },
            { text: '小狗', votes: 0 }
          ]
        },
        {
          id: 'poll-2',
          question: '你喜欢哪种季节？',
          options: [
            { text: '春天', votes: 0 },
            { text: '夏天', votes: 0 },
            { text: '秋天', votes: 0 },
            { text: '冬天', votes: 0 }
          ]
        },
        {
          id: 'poll-3',
          question: '你认为哪一品质最重要？',
          options: [
            { text: '共情心', votes: 0 },
            { text: '勇气', votes: 0 },
            { text: '毅力', votes: 0 },
            { text: '诚信', votes: 0 }
          ]
        }
      ],
      currentPollIndex: 0,
      userVotes: {}, // 存储用户已投的票，格式: { 'poll-id': true }
      visitorIP: '', // 访客IP地址
      isInitialLoad: true, // 首次加载标志
      forceSync: false // 强制同步标志
    }
  },
  created() {
    // 获取访客IP地址
    this.getVisitorIP()
    // 先初始化默认投票数据，再初始化Firebase监听器
    // 这样可以确保本地数据先同步到Firebase，然后再监听Firebase的变化
    this.initDefaultPolls().then(() => {
      // 初始化Firebase数据监听
      this.initFirebaseListeners()
      // 加载用户投票状态
      this.loadUserVoteStatus()
    })
  },
  mounted() {
    // 组件挂载后，检查是否需要强制同步数据
    // 可以根据需要设置forceSync为true
    // this.forceSyncData()
  },
  computed: {
    currentPoll() {
      return this.polls[this.currentPollIndex]
    },
    hasVotedForCurrentPoll() {
      return this.userVotes[this.currentPoll.id]
    },
    totalVotes() {
      return this.currentPoll.options.reduce((sum, option) => sum + option.votes, 0)
    }
  },
  methods: {
    // 获取访客IP地址
    async getVisitorIP() {
      try {
        // 尝试使用第三方API获取IP地址
        try {
          const response = await fetch('https://api.ipify.org?format=json')
          const data = await response.json()
          this.visitorIP = data.ip
        } catch {
          // 尝试使用其他IP地址API
          try {
            const response = await fetch('https://api.ip.sb/jsonip')
            const data = await response.json()
            this.visitorIP = data.ip
          } catch {
            // 尝试使用浏览器信息作为备选
            const userAgent = navigator.userAgent
            this.visitorIP = `browser_${btoa(userAgent.substring(0, 50))}`
          }
        }
      } catch {
        this.visitorIP = `unknown_${Date.now()}`
      }
    },
    
    // 初始化Firebase数据监听
    initFirebaseListeners() {
      try {
        // 监听投票数据变化
        onValue(ref(db, 'polls'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 无论是否是首次加载，都从Firebase更新数据
            // 这样可以确保所有访客的投票都能实时同步
            this.polls = data
            // 确保currentPollIndex不会超出范围
            if (this.currentPollIndex >= this.polls.length) {
              this.currentPollIndex = this.polls.length - 1
            }
            // 首次加载后设置标志
            if (this.isInitialLoad) {
              this.isInitialLoad = false
            }
          }
        })
      } catch (e) {
        console.error('Firebase listener error:', e)
      }
    },
    
    // 初始化默认投票数据
    async initDefaultPolls() {
      try {
        console.log('开始同步本地投票数据到Firebase...')
        console.log('投票问题数量:', this.polls.length)
        // 无论Firebase中是否已有投票数据，都将本地代码中的默认投票同步到Firebase
        // 这样确保本地代码的修改能够覆盖Firebase中的数据
        await set(ref(db, 'polls'), this.polls)
        console.log('本地投票数据已成功同步到Firebase')
      } catch (e) {
        console.error('Init default polls failed:', e)
        console.error('Firebase同步错误详情:', e.message)
      }
    },
    
    // 强制同步本地数据到Firebase
    async forceSyncData() {
      try {
        console.log('开始强制同步本地投票数据到Firebase...')
        console.log('投票问题数量:', this.polls.length)
        this.forceSync = true
        // 保存本地数据到Firebase
        await set(ref(db, 'polls'), this.polls)
        console.log('本地投票数据已成功强制同步到Firebase')
      } catch (e) {
        console.error('Force sync data failed:', e)
        console.error('Firebase同步错误详情:', e.message)
      }
    },
    
    // 加载用户投票状态
    loadUserVoteStatus() {
      try {
        // 从localStorage加载用户投票状态
        const savedVotes = localStorage.getItem(`votes_${this.visitorIP}`)
        if (savedVotes) {
          this.userVotes = JSON.parse(savedVotes)
        }
      } catch (e) {
        console.error('Load user vote status failed:', e)
      }
    },
    
    // 保存用户投票状态
    saveUserVoteStatus() {
      try {
        localStorage.setItem(`votes_${this.visitorIP}`, JSON.stringify(this.userVotes))
      } catch (e) {
        console.error('Save user vote status failed:', e)
      }
    },
    
    // 切换投票问题
    switchPoll(index) {
      this.currentPollIndex = index
    },
    
    // 上一题
    prevPoll() {
      if (this.currentPollIndex > 0) {
        this.currentPollIndex--
      }
    },
    
    // 下一题
    nextPoll() {
      if (this.currentPollIndex < this.polls.length - 1) {
        this.currentPollIndex++
      }
    },
    
    // 提交投票
    async submitVote(optionIndex) {
      if (this.hasVotedForCurrentPoll) {
        return
      }
      
      try {
        // 首先更新本地数据，确保响应式更新
        this.$set(this.polls[this.currentPollIndex].options[optionIndex], 'votes', this.polls[this.currentPollIndex].options[optionIndex].votes + 1)
        
        // 标记用户已投票，确保响应式更新
        this.$set(this.userVotes, this.currentPoll.id, true)
        this.saveUserVoteStatus()
        
        // 尝试同步到Firebase
        try {
          const pollsRef = ref(db, 'polls')
          set(pollsRef, this.polls)
          console.log('投票已同步到Firebase')
        } catch (firebaseError) {
          console.error('Firebase同步失败:', firebaseError)
          // 即使Firebase同步失败，本地投票仍然成功
        }
      } catch (e) {
        console.error('提交投票失败:', e)
      }
    },
    
    // 获取选项占比
    getOptionPercentage(optionIndex) {
      if (this.totalVotes === 0) {
        return 0
      }
      return (this.currentPoll.options[optionIndex].votes / this.totalVotes) * 100
    }
  }
}
</script>

<style scoped>
.vote-view {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.16);
  padding: 32px;
  backdrop-filter: saturate(140%) blur(6px);
}

/* 投票页面标题 */
.vote-header {
  text-align: center;
  margin-bottom: 48px;
}

.vote-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.vote-header p {
  font-size: 1.125rem;
  color: #64748b;
}

/* 投票问题 */
.vote-question {
  text-align: center;
  margin-bottom: 40px;
}

.vote-question h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
}

/* 问题导航 */
.poll-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  gap: 20px;
}

.nav-btn {
  padding: 12px 24px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn:hover:not(:disabled) {
  border-color: #81D8CF;
  color: #81D8CF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(129, 216, 207, 0.2);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #e2e8f0;
  color: #94a3b8;
}

.prev-btn {
  flex-shrink: 0;
}

.next-btn {
  flex-shrink: 0;
}

.poll-info {
  flex: 1;
  text-align: center;
}

.poll-number {
  font-size: 1rem;
  font-weight: 600;
  color: #81D8CF;
  background: rgba(129, 216, 207, 0.1);
  padding: 8px 20px;
  border-radius: 20px;
  display: inline-block;
  min-width: 120px;
}

/* 问题选择器（保留但隐藏，作为备用） */
.poll-selector {
  display: none;
  gap: 12px;
  margin-bottom: 40px;
  overflow-x: auto;
  padding-bottom: 12px;
  flex-wrap: wrap;
}

.poll-btn {
  padding: 12px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.poll-btn:hover {
  border-color: #81D8CF;
  color: #81D8CF;
  transform: translateY(-1px);
}

.poll-btn.active {
  background: #81D8CF;
  color: white;
  border-color: #81D8CF;
  box-shadow: 0 4px 12px rgba(129, 216, 207, 0.3);
}

/* 投票选项 */
.vote-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
}

.vote-option {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.vote-option:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.vote-option.disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.option-text {
  font-size: 1.25rem;
  font-weight: 500;
  color: #1e293b;
}

.option-votes {
  font-size: 1rem;
  color: #64748b;
  font-weight: 600;
}

.option-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  z-index: 1;
}

.option-bar {
  height: 100%;
  background: #81D8CF;
  transition: width 0.5s ease;
  border-radius: 0 0 12px 12px;
}

/* 投票状态提示 */
.vote-status {
  text-align: center;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  margin-top: 40px;
}

.vote-status p {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 8px;
}

.status-hint {
  font-size: 0.875rem !important;
  color: #94a3b8 !important;
  margin-bottom: 0 !important;
}

/* 按钮样式 */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #81D8CF;
  color: white;
}

.btn-primary:hover {
  background: #64c4b8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(129, 216, 207, 0.3);
}

.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #1e293b;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .vote-view {
    padding: 24px 16px;
  }
  
  .vote-header h1 {
    font-size: 2rem;
  }
  
  .vote-question h2 {
    font-size: 1.5rem;
  }
  
  .vote-option {
    padding: 16px;
  }
  
  .option-text {
    font-size: 1.125rem;
  }
  
  .poll-navigation {
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }
  
  .nav-btn {
    padding: 10px 16px;
    font-size: 0.8125rem;
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .poll-info {
    order: -1;
    width: 100%;
  }
  
  .poll-number {
    min-width: 100px;
    padding: 6px 16px;
  }
}

/* 小屏幕设备 */
@media (max-width: 480px) {
  .poll-navigation {
    gap: 12px;
  }
  
  .nav-btn {
    font-size: 0.75rem;
    padding: 8px 16px;
  }
  
  .vote-question h2 {
    font-size: 1.25rem;
  }
}
</style>