<template>
  <div class="guestbook-view">
    <!-- 留言板标题 -->
    <div class="guestbook-header">
      <h1>留言板</h1>
      <p>留下你的足迹，分享你的想法</p>
    </div>

    <!-- 留言表单 -->
    <div class="guestbook-form">
      <h2>写下你的留言</h2>
      <form @submit.prevent="submitMessage">
        <div class="form-group">
          <label for="name">昵称</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            required 
            placeholder="请输入你的昵称"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            placeholder="请输入你的邮箱（选填）"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="message">留言内容</label>
          <textarea 
            id="message" 
            v-model="form.message" 
            required 
            placeholder="请输入你的留言内容"
            rows="5"
            class="form-textarea"
          ></textarea>
        </div>
        
        <button type="submit" class="btn btn-primary submit-btn">
          提交留言
        </button>
      </form>
    </div>

    <!-- 留言列表 -->
    <div class="guestbook-messages">
      <h2>留言列表</h2>
      <div class="messages-list">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          class="message-item"
        >
          <div class="message-header">
            <div class="message-author">
              <div class="author-avatar">
                {{ getAvatarText(message.name) }}
              </div>
              <div class="author-info">
                <div class="author-name">{{ message.name }}</div>
                <div class="message-time">{{ message.time }}</div>
              </div>
            </div>
          </div>
          <div class="message-content">
            {{ message.message }}
          </div>
        </div>
        <div v-if="messages.length === 0" class="empty-state">
          暂无留言，快来写下第一条留言吧！
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db, ref, set, onValue, get } from '@/firebase'

export default {
  data() {
    return {
      form: {
        name: '',
        email: '',
        message: ''
      },
      messages: [],
      isInitialLoad: true, // 首次加载标志
      forceSync: false // 强制同步标志
    }
  },
  created() {
    // 初始化Firebase数据监听
    this.initFirebaseListeners()
    // 初始化默认留言数据
    this.initDefaultMessages()
  },
  methods: {
    // 初始化Firebase数据监听
    initFirebaseListeners() {
      try {
        // 监听留言数据变化
        onValue(ref(db, 'guestbookMessages'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 无论是否是首次加载，都更新本地数据
            // 但要确保数据结构正确，避免覆盖正在编辑的内容
            this.messages = data
            // 首次加载后设置标志
            if (this.isInitialLoad) {
              this.isInitialLoad = false
            }
          }
        })
      } catch (e) {
        console.error('Firebase listener error:', e)
        // 失败时从localStorage加载作为备份
        this.loadMessagesFromLocalStorage()
        this.isInitialLoad = false
      }
    },
    
    // 初始化默认留言数据
    async initDefaultMessages() {
      try {
        // 检查Firebase中是否已有留言数据
        const snapshot = await get(ref(db, 'guestbookMessages'))
        if (!snapshot.exists()) {
          // 如果没有数据，初始化一个空数组
          await set(ref(db, 'guestbookMessages'), [])
          console.log('初始化默认留言数据')
        }
      } catch (e) {
        console.error('Init default messages failed:', e)
      }
    },
    // 从localStorage加载留言数据
    loadMessagesFromLocalStorage() {
      const savedMessages = localStorage.getItem('guestbookMessages')
      if (savedMessages) {
        this.messages = JSON.parse(savedMessages)
      }
    },
    // 保存留言数据到Firebase
    saveMessages() {
      try {
        set(ref(db, 'guestbookMessages'), this.messages)
        // 同时保存到localStorage作为备份
        localStorage.setItem('guestbookMessages', JSON.stringify(this.messages))
      } catch (e) {
        console.error('Save messages failed:', e)
        // 失败时至少保存到localStorage
        localStorage.setItem('guestbookMessages', JSON.stringify(this.messages))
      }
    },
    submitMessage() {
      // 创建新留言
      const newMessage = {
        name: this.form.name,
        email: this.form.email,
        message: this.form.message,
        time: new Date().toLocaleString()
      }
      
      // 添加到留言列表
      this.messages.unshift(newMessage)
      
      // 保存到Firebase
      this.saveMessages()
      
      // 清空表单
      this.form = {
        name: '',
        email: '',
        message: ''
      }
      
      // 移除alert弹窗
    },
    getAvatarText(name) {
      // 获取昵称的第一个字符作为头像文本
      return name.charAt(0).toUpperCase()
    },
    // 强制同步本地数据到Firebase
    forceSyncData() {
      try {
        this.forceSync = true
        // 保存本地数据到Firebase
        set(ref(db, 'guestbookMessages'), this.messages)
        console.log('本地留言数据已强制同步到Firebase')
        // 移除alert弹窗
      } catch (e) {
        console.error('Force sync data failed:', e)
        // 移除alert弹窗
      }
    }
  }
}
</script>

<style scoped>
.guestbook-view {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.16);
  padding: 32px;
  backdrop-filter: saturate(140%) blur(6px);
}

/* 留言板标题 */
.guestbook-header {
  text-align: center;
  margin-bottom: 48px;
}

.guestbook-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.guestbook-header p {
  font-size: 1.125rem;
  color: #64748b;
}

/* 留言表单 */
.guestbook-form {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 48px;
}

.guestbook-form h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #81D8CF;
  box-shadow: 0 0 0 3px rgba(129, 216, 207, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.submit-btn {
  width: 100%;
  padding: 14px 24px;
  font-size: 1rem;
  background: #008C8C;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background: #006B6B;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 140, 140, 0.3);
}

/* 留言列表 */
.guestbook-messages {
  margin-bottom: 32px;
}

.guestbook-messages h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.message-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.message-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  background: #81D8CF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(129, 216, 207, 0.3);
}

.author-info {
  flex: 1;
}

.author-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.message-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.message-content {
  color: #334155;
  line-height: 1.6;
}

.empty-state {
  background: white;
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  color: #94a3b8;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guestbook-view {
    padding: 24px 16px;
  }
  
  .guestbook-header h1 {
    font-size: 2rem;
  }
  
  .guestbook-form {
    padding: 16px;
  }
  
  .message-item {
    padding: 16px;
  }
  
  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .author-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
  
  .empty-state {
    padding: 32px 16px;
  }
}
</style>