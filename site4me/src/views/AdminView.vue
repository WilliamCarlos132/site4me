<template>
  <div class="admin-view">
    <!-- 密码验证界面 -->
    <div v-if="!isAuthenticated" class="login-container">
      <div class="login-form">
        <h2>后台管理登录</h2>
        <div class="form-group">
          <label for="password">emmm，你是我嘛？</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            @keyup.enter="validatePassword"
            placeholder="只有我才可以进入噢，请输入密码"
            class="password-input"
          >
        </div>
        <button @click="validatePassword" class="login-btn">验证</button>
        <div v-if="loginError" class="error-message">
          密码错误，你不是我！
        </div>
      </div>
    </div>

    <!-- 后台管理界面 -->
    <div v-else class="admin-dashboard">
      <div class="admin-header">
        <h1>后台管理中心</h1>
        <h2>WELCOME! 我！</h2>
        <div class="header-right">
          <div class="sync-status" :class="syncStatus">
            {{ syncStatus === 'synced' ? '数据已同步' : 
               syncStatus === 'syncing' ? '正在同步数据...' : 
               syncStatus === 'error' ? '同步失败，请重试' : '准备同步' }}
          </div>
          <button @click="logout" class="logout-btn">退出登录</button>
        </div>
      </div>

      <!-- 功能导航 -->
      <div class="admin-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="nav-btn"
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- 博客管理 -->
      <div v-if="activeTab === 'blog'" class="admin-section">
        <h2>博客文章管理</h2>
        <div class="admin-actions">
          <button @click="showAddArticleForm" class="add-btn">添加文章</button>
        </div>
        
        <div class="articles-list">
          <div 
            v-for="article in blogArticles" 
            :key="article.id"
            class="article-item"
          >
            <div class="article-info">
              <h3>{{ article.title }}</h3>
              <p>{{ article.excerpt }}</p>
              <div class="article-meta">
                <span>{{ article.date }}</span>
                <span>{{ article.category }}</span>
                <span>{{ article.views }} 阅读</span>
              </div>
            </div>
            <div class="article-actions">
              <button @click="editArticle(article)" class="edit-btn">编辑</button>
              <button @click="deleteArticle(article.id)" class="delete-btn">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 网站更新管理 -->
      <div v-if="activeTab === 'updates'" class="admin-section">
        <h2>网站更新管理</h2>
        <div class="admin-actions">
          <button @click="showAddUpdateForm" class="add-btn">添加更新</button>
        </div>
        
        <div class="updates-list">
          <div 
            v-for="update in siteUpdates" 
            :key="update.id"
            class="update-item"
          >
            <div class="update-info">
              <h3>{{ update.title }}</h3>
              <p>{{ update.content }}</p>
              <div class="update-meta">
                <span>{{ update.date }}</span>
              </div>
            </div>
            <div class="update-actions">
              <button @click="editUpdate(update)" class="edit-btn">编辑</button>
              <button @click="deleteUpdate(update.id)" class="delete-btn">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加/编辑文章模态框 -->
      <div v-if="showArticleModal" class="modal-overlay" @click="closeArticleModal">
        <div class="modal-content" @click.stop>
          <h3>{{ isEditingArticle ? '编辑文章' : '添加文章' }}</h3>
          <div class="form-group">
            <label for="article-title">标题：</label>
            <input type="text" id="article-title" v-model="articleForm.title" class="form-input">
          </div>
          <div class="form-group">
            <label for="article-content">内容：</label>
            <textarea id="article-content" v-model="articleForm.content" class="form-textarea" rows="10"></textarea>
          </div>
          <div class="form-group">
            <label for="article-excerpt">摘要：</label>
            <textarea id="article-excerpt" v-model="articleForm.excerpt" class="form-textarea" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="article-category">分类：</label>
            <select id="article-category" v-model="articleForm.category" class="form-select">
              <option value="tech">技术</option>
              <option value="life">生活</option>
            </select>
          </div>
          <div class="form-group">
            <label for="article-date">日期：</label>
            <input type="date" id="article-date" v-model="articleForm.date" class="form-input">
          </div>
          <div class="modal-actions">
            <button @click="saveArticle" class="save-btn">保存</button>
            <button @click="closeArticleModal" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 添加/编辑更新模态框 -->
      <div v-if="showUpdateModal" class="modal-overlay" @click="closeUpdateModal">
        <div class="modal-content" @click.stop>
          <h3>{{ isEditingUpdate ? '编辑更新' : '添加更新' }}</h3>
          <div class="form-group">
            <label for="update-title">标题：</label>
            <input type="text" id="update-title" v-model="updateForm.title" class="form-input">
          </div>
          <div class="form-group">
            <label for="update-content">内容：</label>
            <textarea id="update-content" v-model="updateForm.content" class="form-textarea" rows="5"></textarea>
          </div>
          <div class="form-group">
            <label for="update-date">日期：</label>
            <input type="date" id="update-date" v-model="updateForm.date" class="form-input">
          </div>
          <div class="form-group">
            <label>影响页面：</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="home">
                首页
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="blog">
                博客
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="music">
                音乐站台
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="quotes">
                幸运曲奇
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="vote">
                投票广场
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="havefun">
                游戏中心
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="news">
                网站资讯
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="updates">
                更新动态
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" value="guestbook">
                留言板
              </label>
            </div>
          </div>
          <div class="form-group">
            <label for="update-tags">标签：</label>
            <input type="text" id="update-tags" v-model="updateForm.tagsInput" placeholder="输入标签，用逗号分隔" class="form-input">
            <p class="form-hint">例如：功能更新, 优化, 数据同步</p>
          </div>
          <div class="modal-actions">
            <button @click="saveUpdate" class="save-btn">保存</button>
            <button @click="closeUpdateModal" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 操作成功提示 -->
      <div v-if="showSuccessMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import { db, ref, set, onValue, get, remove } from '@/firebase'

export default {
  data() {
    return {
      // 登录状态
      isAuthenticated: false,
      password: '',
      loginError: false,
      
      // 后台状态
      activeTab: 'blog',
      tabs: [
        { id: 'blog', name: '博客管理' },
        { id: 'updates', name: '网站更新' }
      ],
      
      // 数据
      blogArticles: [],
      siteUpdates: [],
      
      // 模态框状态
      showArticleModal: false,
      showUpdateModal: false,
      isEditingArticle: false,
      isEditingUpdate: false,
      currentArticleId: null,
      currentUpdateId: null,
      
      // 表单数据
      articleForm: {
        title: '',
        content: '',
        excerpt: '',
        category: 'tech',
        date: new Date().toISOString().split('T')[0],
        author: 'Eryan Mei',
        views: 0,
        tags: []
      },
      
      updateForm: {
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        impactPages: [],
        tags: [],
        tagsInput: ''
      },
      
      // 提示信息
      showSuccessMessage: false,
      successMessage: '',
      
      // 同步状态
      syncStatus: 'idle', // idle, syncing, synced, error
    }
  },
  created() {
    // 每次进入后台都需要重新登录，不检查本地存储
    this.isAuthenticated = false
  },
  methods: {
    // 密码验证
    validatePassword() {
      const correctPassword = '20260219'
      if (this.password === correctPassword) {
        this.isAuthenticated = true
        this.loginError = false
        // 移除本地存储，确保每次进入都需要重新登录
        localStorage.removeItem('adminLoggedIn')
        this.loadData()
      } else {
        this.loginError = true
      }
    },
    
    // 退出登录
    logout() {
      this.isAuthenticated = false
      this.password = ''
      localStorage.removeItem('adminLoggedIn')
    },
    
    // 切换标签
    switchTab(tabId) {
      this.activeTab = tabId
    },
    
    // 加载数据
    loadData() {
      this.loadBlogArticles()
      this.loadSiteUpdates()
    },
    
    // 加载博客文章
    loadBlogArticles() {
      try {
        const articlesRef = ref(db, 'blogArticles')
        onValue(articlesRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 将对象转换为数组并按照日期降序排序（最新的日期排在最前面）
            this.blogArticles = Object.values(data).sort((a, b) => {
              return new Date(b.date) - new Date(a.date)
            })
          } else {
            this.blogArticles = []
          }
        })
      } catch (error) {
        console.error('加载博客文章失败:', error)
      }
    },
    
    // 加载网站更新
    loadSiteUpdates() {
      try {
        const updatesRef = ref(db, 'updates')
        onValue(updatesRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            if (Array.isArray(data)) {
              // 如果是数组，直接使用
              this.siteUpdates = data
            } else if (typeof data === 'object') {
              // 如果是对象，转换为数组并过滤有效数据
              this.siteUpdates = Object.values(data).filter(item => item && item.title)
            }
          } else {
            this.siteUpdates = []
          }
        })
      } catch (error) {
        console.error('加载网站更新失败:', error)
      }
    },
    
    // 显示添加文章表单
    showAddArticleForm() {
      this.isEditingArticle = false
      this.currentArticleId = null
      this.articleForm = {
        title: '',
        content: '',
        excerpt: '',
        category: 'tech',
        date: new Date().toISOString().split('T')[0],
        author: 'Eryan Mei',
        views: 0,
        tags: []
      }
      this.showArticleModal = true
    },
    
    // 编辑文章
    editArticle(article) {
      this.isEditingArticle = true
      this.currentArticleId = article.id
      this.articleForm = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        category: article.category,
        date: article.date,
        author: article.author,
        views: article.views,
        tags: article.tags || []
      }
      this.showArticleModal = true
    },
    
    // 保存文章
    async saveArticle() {
      try {
        this.syncStatus = 'syncing'
        const articlesRef = ref(db, 'blogArticles')
        
        // 先从数据库获取最新数据，避免覆盖
        const snapshot = await get(articlesRef)
        const existingData = snapshot.val() || {}
        
        if (this.isEditingArticle && this.currentArticleId) {
          // 编辑现有文章
          const updatedData = { ...existingData }
          updatedData[this.currentArticleId] = {
            ...this.articleForm,
            id: this.currentArticleId
          }
          
          await set(articlesRef, updatedData)
          this.syncStatus = 'synced'
          this.showSuccess('文章更新成功！')
        } else {
          // 添加新文章
          const newArticleId = 'article-' + Date.now()
          const newArticle = {
            ...this.articleForm,
            id: newArticleId
          }
          
          const updatedData = { ...existingData }
          updatedData[newArticleId] = newArticle
          
          await set(articlesRef, updatedData)
          this.syncStatus = 'synced'
          this.showSuccess('文章添加成功！')
        }
        
        // 重新加载数据，确保前端显示最新数据
        this.loadData()
        this.closeArticleModal()
      } catch (error) {
        console.error('保存文章失败:', error)
        this.syncStatus = 'error'
        this.showSuccess(`保存失败: ${error.message || '请重试'}`)
      }
    },
    
    // 删除文章
    async deleteArticle(articleId) {
      if (confirm('确定要删除这篇文章吗？')) {
        try {
          this.syncStatus = 'syncing'
          const articlesRef = ref(db, 'blogArticles')
          
          // 先从数据库获取最新数据，避免覆盖
          const snapshot = await get(articlesRef)
          const existingData = snapshot.val() || {}
          
          // 构建更新对象，排除要删除的文章
          const updatedData = { ...existingData }
          delete updatedData[articleId]
          
          await set(articlesRef, updatedData)
          this.syncStatus = 'synced'
          this.showSuccess('文章删除成功！')
          
          // 重新加载数据，确保前端显示最新数据
          this.loadData()
        } catch (error) {
          console.error('删除文章失败:', error)
          this.syncStatus = 'error'
          this.showSuccess(`删除失败: ${error.message || '请重试'}`)
        }
      }
    },
    
    // 显示添加更新表单
    showAddUpdateForm() {
      this.isEditingUpdate = false
      this.currentUpdateId = null
      this.updateForm = {
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        impactPages: [],
        tags: [],
        tagsInput: ''
      }
      this.showUpdateModal = true
    },
    
    // 编辑更新
    editUpdate(update) {
      this.isEditingUpdate = true
      this.currentUpdateId = update.id
      this.updateForm = {
        title: update.title,
        content: update.content || update.description || '',
        date: update.date,
        impactPages: update.impactPages || update.affectedPages || [],
        tags: update.tags || [],
        tagsInput: (update.tags || []).join(', ')
      }
      this.showUpdateModal = true
    },
    
    // 保存更新
    async saveUpdate() {
      try {
        this.syncStatus = 'syncing'
        const updatesRef = ref(db, 'updates')
        
        // 先从数据库获取最新数据，避免覆盖
        const snapshot = await get(updatesRef)
        let existingUpdates = []
        
        // 处理不同的数据结构
        const existingData = snapshot.val()
        if (existingData) {
          if (Array.isArray(existingData)) {
            // 如果是数组，直接使用
            existingUpdates = existingData
          } else if (typeof existingData === 'object') {
            // 如果是对象，转换为数组并过滤有效数据
            existingUpdates = Object.values(existingData).filter(item => item && item.title)
          }
        }
        
        if (this.isEditingUpdate && this.currentUpdateId) {
          // 处理标签输入，转换为数组
          let tagsArray = []
          if (this.updateForm.tagsInput) {
            tagsArray = this.updateForm.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
          }
          
          // 编辑现有更新
          const updatedUpdates = existingUpdates.map(update => {
            if (update.id === this.currentUpdateId) {
              return {
                title: this.updateForm.title,
                description: this.updateForm.content, // 使用description字段而不是content
                date: this.updateForm.date,
                affectedPages: this.updateForm.impactPages, // 使用affectedPages字段而不是impactPages
                tags: tagsArray, // 使用转换后的标签数组
                id: this.currentUpdateId
              }
            }
            return update
          })
          
          await set(updatesRef, updatedUpdates)
          this.syncStatus = 'synced'
          this.showSuccess('更新内容更新成功！')
        } else {
          // 处理标签输入，转换为数组
          let tagsArray = []
          if (this.updateForm.tagsInput) {
            tagsArray = this.updateForm.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
          }
          
          // 添加新更新
          const newUpdateId = 'update-' + Date.now()
          const newUpdate = {
            title: this.updateForm.title,
            description: this.updateForm.content, // 使用description字段而不是content
            date: this.updateForm.date,
            affectedPages: this.updateForm.impactPages, // 使用affectedPages字段而不是impactPages
            tags: tagsArray, // 使用转换后的标签数组
            id: newUpdateId
          }
          
          // 将新更新添加到数组开头，索引为0
          // 其它更新索引依次加一
          const updatedUpdates = [newUpdate, ...existingUpdates]
          
          await set(updatesRef, updatedUpdates)
          this.syncStatus = 'synced'
          this.showSuccess('更新内容添加成功！')
        }
        
        // 重新加载数据，确保前端显示最新数据
        this.loadData()
        this.closeUpdateModal()
      } catch (error) {
        console.error('保存更新失败:', error)
        this.syncStatus = 'error'
        this.showSuccess(`保存失败: ${error.message || '请重试'}`)
      }
    },
    
    // 删除更新
    async deleteUpdate(updateId) {
      if (confirm('确定要删除这条更新吗？')) {
        try {
          this.syncStatus = 'syncing'
          const updatesRef = ref(db, 'updates')
          
          // 先从数据库获取最新数据，避免覆盖
          const snapshot = await get(updatesRef)
          let existingUpdates = []
          
          // 处理不同的数据结构
          const existingData = snapshot.val()
          if (existingData) {
            if (Array.isArray(existingData)) {
              // 如果是数组，直接使用
              existingUpdates = existingData
            } else if (typeof existingData === 'object') {
              // 如果是对象，转换为数组并过滤有效数据
              existingUpdates = Object.values(existingData).filter(item => item && item.title)
            }
          }
          
          // 构建更新数组，排除要删除的更新
          const updatedUpdates = existingUpdates.filter(update => update.id !== updateId)
          
          await set(updatesRef, updatedUpdates)
          this.syncStatus = 'synced'
          this.showSuccess('更新内容删除成功！')
          
          // 重新加载数据，确保前端显示最新数据
          this.loadData()
        } catch (error) {
          console.error('删除更新失败:', error)
          this.syncStatus = 'error'
          this.showSuccess(`删除失败: ${error.message || '请重试'}`)
        }
      }
    },
    
    // 关闭文章模态框
    closeArticleModal() {
      this.showArticleModal = false
    },
    
    // 关闭更新模态框
    closeUpdateModal() {
      this.showUpdateModal = false
    },
    
    // 显示成功提示
    showSuccess(message) {
      this.successMessage = message
      this.showSuccessMessage = true
      setTimeout(() => {
        this.showSuccessMessage = false
      }, 3000)
    }
  }
}
</script>

<style scoped>
/* 登录界面 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: rgba(240, 240, 240, 0.9);
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-form h2 {
  margin-bottom: 30px;
  color: #1e293b;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-weight: 500;
}

.password-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.password-input:focus {
  outline: none;
  border-color: #81D8CF;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #81D8CF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-btn:hover {
  background: #6dd3c9;
}

.error-message {
  margin-top: 15px;
  color: #ef4444;
  font-size: 14px;
}

/* 后台管理界面 */
.admin-dashboard {
  background: rgba(255, 255, 255, 0.9);
  min-height: 100vh;
  padding: 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.admin-header h1 {
  color: #1e293b;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 同步状态指示器 */
.sync-status {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
}

.sync-status.idle {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.sync-status.syncing {
  background: rgba(59, 130, 246, 0.2);
  color: #2563eb;
}

.sync-status.synced {
  background: rgba(16, 185, 129, 0.2);
  color: #059669;
}

.sync-status.error {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.logout-btn {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-btn:hover {
  background: #dc2626;
}

/* 导航 */
.admin-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.nav-btn {
  padding: 12px 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #64748b;
}

.nav-btn:hover {
  border-color: #81D8CF;
  color: #81D8CF;
}

.nav-btn.active {
  background: #81D8CF;
  color: white;
  border-color: #81D8CF;
}

/* 管理区域 */
.admin-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 30px;
}

.admin-section h2 {
  color: #1e293b;
  margin-bottom: 20px;
}

.admin-actions {
  margin-bottom: 30px;
}

.add-btn {
  padding: 10px 20px;
  background: #81D8CF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-btn:hover {
  background: #6dd3c9;
}

/* 文章列表 */
.articles-list,
.updates-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-item,
.update-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: box-shadow 0.3s ease;
}

.article-item:hover,
.update-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.article-info,
.update-info {
  flex: 1;
  margin-right: 20px;
}

.article-info h3,
.update-info h3 {
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 10px;
}

.article-info p,
.update-info p {
  color: #64748b;
  margin-bottom: 15px;
  line-height: 1.6;
}

.article-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #94a3b8;
}

.article-actions,
.update-actions {
  display: flex;
  gap: 10px;
}

.edit-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.edit-btn:hover {
  background: #2563eb;
}

.delete-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background: #dc2626;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 20px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #81D8CF;
}

.form-textarea {
  resize: vertical;
}

.form-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 5px;
  margin-bottom: 0;
}

/* 复选框组样式 */
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.checkbox-item:hover {
  background-color: rgba(129, 216, 207, 0.1);
}

.checkbox-item input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.save-btn {
  padding: 10px 20px;
  background: #81D8CF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.save-btn:hover {
  background: #6dd3c9;
}

.cancel-btn {
  padding: 10px 20px;
  background: #94a3b8;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background: #64748b;
}

/* 成功提示 */
.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 10px;
  }
  
  .admin-section {
    padding: 20px;
  }
  
  .article-item,
  .update-item {
    flex-direction: column;
  }
  
  .article-actions,
  .update-actions {
    margin-top: 15px;
    justify-content: flex-end;
    width: 100%;
  }
  
  .modal-content {
    margin: 10px;
    padding: 20px;
  }
}
</style>