<template>
  <div class="vote-view">
    <!-- 投票页面标题 -->
    <div class="vote-header">
      <h1>投票广场</h1>
      <p>参与投票，查看实时结果</p>
      <div class="sync-status" :class="syncStatus">
        {{ syncStatus === 'synced' ? '数据已同步' : 
           syncStatus === 'syncing' ? '正在同步数据...' : 
           syncStatus === 'error' ? '同步失败，使用本地数据' : '准备同步' }}
      </div>
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
import { db, ref, set, onValue, get, runTransaction } from '@/firebase'

export default {
  data() {
    return {
      polls: [], // 初始为空数组，由 safeInitPolls 方法初始化
      currentPollIndex: 0,
      userVotes: {}, // 存储用户已投的票，格式: { 'poll-id': true }
      visitorIP: '', // 访客IP地址
      isInitialLoad: true, // 首次加载标志
      forceSync: false, // 强制同步标志
      syncStatus: 'idle', // idle, syncing, synced, error
      pollsListener: null // Firebase监听器引用
    }
  },
  created() {
    this.getVisitorIP()
    // 先加载远端数据，如无数据再进行一次性初始化，避免覆盖
    this.safeInitPolls().then(() => {
      this.initFirebaseListeners()
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
      this.syncStatus = 'syncing';
      try {
        // 先清理可能存在的旧监听器
        if (this.pollsListener) {
          this.pollsListener();
          console.log('旧的Firebase监听器已清理');
        }
        
        // 监听投票数据变化
        const pollsRef = ref(db, 'polls');
        console.log('开始监听Firebase路径:', 'polls');
        this.pollsListener = onValue(pollsRef, (snapshot) => {
          const data = snapshot.val()
          console.log('收到Firebase数据更新:', data);
          if (data) {
            // 使用Vue的响应式更新方法，确保视图能正确更新
            this.$set(this, 'polls', data);
            // 确保currentPollIndex不会超出范围
            if (this.currentPollIndex >= this.polls.length) {
              this.currentPollIndex = this.polls.length - 1
            }
            // 首次加载后设置标志
            if (this.isInitialLoad) {
              this.isInitialLoad = false
            }
            this.syncStatus = 'synced';
            console.log('Firebase polls data synced successfully');
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
          this.syncStatus = 'error';
        })
      } catch (e) {
        console.error('Firebase listener setup failed:', e);
        this.syncStatus = 'error';
      }
    },
    
    // 安全初始化投票数据：仅在远端为空时进行一次性写入
    async safeInitPolls() {
      try {
        const snapshot = await get(ref(db, 'polls'))
        if (!snapshot.exists()) {
          // 定义默认投票数据
          const defaultPolls = [
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
          ]
          await set(ref(db, 'polls'), defaultPolls)
          this.polls = defaultPolls
          console.log('远端为空，已初始化默认投票数据')
        } else {
          this.polls = snapshot.val()
          console.log('已加载远端投票数据')
        }
      } catch (e) {
        console.error('Init polls failed:', e)
        // 失败时使用默认投票数据
        const defaultPolls = [
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
        ]
        this.polls = defaultPolls
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
        const votePath = `polls/${this.currentPollIndex}/options/${optionIndex}/votes`
        await runTransaction(ref(db, votePath), (current) => {
          if (typeof current !== 'number') return 1
          return current + 1
        })
        // 本地标记已投票
        this.$set(this.userVotes, this.currentPoll.id, true)
        this.saveUserVoteStatus()
        // 本地同步显示（避免等待远端回传）
        this.$set(this.polls[this.currentPollIndex].options[optionIndex], 'votes', (this.polls[this.currentPollIndex].options[optionIndex].votes || 0) + 1)
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
  },
  beforeDestroy() {
    // 清理Firebase监听器
    if (this.pollsListener) {
      this.pollsListener();
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

/* 同步状态指示器 */
.sync-status {
  font-size: 0.8rem;
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

.sync-status.synced {
  background: rgba(16, 185, 129, 0.2);
  color: #059669;
}

.sync-status.syncing {
  background: rgba(59, 130, 246, 0.2);
  color: #2563eb;
}

.sync-status.error {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.sync-status.idle {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
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
