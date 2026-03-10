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

      <!-- 背景管理 -->
      <div v-if="activeTab === 'background'" class="admin-section">
        <h2>网站背景管理</h2>
        <div class="background-manage">
          <div class="background-preview">
            <h3>当前背景：</h3>
            <div class="bg-preview-container">
              <img :src="currentBackgroundDisplay" :alt="currentBackgroundName" class="preview-img" @error="handleImageError">
              <p class="bg-name">{{ currentBackgroundName }}</p>
            </div>
          </div>

          <div class="background-selection">
            <h3>可用背景列表：</h3>
            <div class="bg-list">
              <div
                  v-for="bg in availableBackgrounds"
                  :key="bg.path"
                  class="bg-item"
                  :class="{ selected: currentBackgroundPath === bg.path }"
                  @click="selectBackground(bg)"
              >
                <img :src="bg.path" :alt="bg.name" class="bg-thumbnail" @error="handleImageError">
                <p class="bg-item-name">{{ bg.name }}</p>
                <div v-if="currentBackgroundPath === bg.path" class="selected-badge">已选中</div>
              </div>
            </div>
          </div>

          <div class="bg-actions">
            <button @click="saveBackgroundSetting" class="save-btn" :disabled="!backgroundChanged">
              {{ backgroundChanged ? '保存背景设置' : '无改动' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 传送舱管理 -->
      <div v-if="activeTab === 'teleport'" class="admin-section">
        <h2>传送舱管理</h2>
        <div class="admin-actions">
          <button @click="showAddTeleportForm" class="add-btn">添加链接</button>
          <button @click="initTeleportData" class="add-btn">初始化默认链接</button>
        </div>

        <div class="teleport-list">
          <div
              v-for="link in teleportLinks"
              :key="link.id"
              class="article-item"
          >
            <div class="article-info">
              <h3>{{ link.icon }} {{ link.name }}</h3>
              <p>{{ link.url }}</p>
              <div class="article-meta">
                <span>{{ link.category }}</span>
                <span>{{ link.description }}</span>
              </div>
            </div>
            <div class="article-actions">
              <button @click="editTeleport(link)" class="edit-btn">编辑</button>
              <button @click="deleteTeleport(link.id)" class="delete-btn">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据库管理 -->
      <div v-if="activeTab === 'database'" class="admin-section">
        <h2>数据库管理</h2>
        <button @click="syncLocalJson" class="add-btn">从数据库同步到JSON</button>
        <hr>
        <!-- 站点统计 -->
        <div class="database-card">
          <h3>站点统计</h3>
          <div class="stats-display">
            <div class="stat-item">
              <span class="stat-label">总访问数:</span>
              <span class="stat-value">{{ siteStats.pageViews || 0 }}</span>
              <button @click="editSiteStat('pageViews')" class="edit-btn">编辑</button>
            </div>
            <div class="stat-item">
              <span class="stat-label">独立访客 (IP):</span>
              <span class="stat-value">{{ knownIPs.length || 0 }}</span>
              <button @click="recalculateUV" class="edit-btn">重新计算</button>
            </div>
            <div class="stat-item">
              <span class="stat-label">设备指纹 (UV):</span>
              <span class="stat-value">{{ knownVisitors.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均停留时长:</span>
              <span class="stat-value">{{ siteStats.averageTime || '--:--' }}</span>
              <button @click="editSiteStat('averageTime')" class="edit-btn">编辑</button>
            </div>
            <div class="stat-item">
              <span class="stat-label">今日访问:</span>
              <span class="stat-value">{{ todayStats.views || 0 }}</span>
              <button @click="editTodayViews" class="edit-btn">编辑</button>
            </div>
          </div>
        </div>

        <!-- 最近访问记录 -->
        <div class="database-card">
          <h3>最近访问记录（最多30条）</h3>
          <div class="admin-actions">
            <button @click="clearAllVisits" class="delete-btn">清空所有记录</button>
            <button @click="reloadData" class="add-btn">刷新数据</button>

          </div>
          <div class="visits-table">
            <div class="table-header">
              <div class="col col-index">编号</div>
              <div class="col col-time">访问时间</div>
              <div class="col col-page">页面</div>
              <div class="col col-duration">停留</div>
              <div class="col col-location">IP地址</div>
              <div class="col col-actions">操作</div>
            </div>
            <div class="table-body">
              <div
                  v-for="(visit, index) in recentVisits"
                  :key="index"
                  class="table-row"
              >
                <div class="col col-index">{{ index }}</div>
                <div class="col col-time">{{ visit.time }}</div>
                <div class="col col-page">{{ formatPageName(visit.page) }}</div>
                <div class="col col-duration">{{ visit.duration }}</div>
                <div class="col col-location">{{ visit.location }}</div>
                <div class="col col-actions">
                  <button @click="editVisit(index, visit)" class="edit-btn">编辑</button>
                  <button @click="deleteVisit(index)" class="delete-btn">删除</button>
                </div>
              </div>
              <div v-if="recentVisits.length === 0" class="table-empty">
                暂无访问记录
              </div>
            </div>
          </div>
        </div>

        <!-- 页面统计 -->
        <div class="database-card">
          <h3>页面访问统计</h3>
          <div class="pages-table">
            <div class="table-header">
              <div class="col col-page">页面</div>
              <div class="col col-views">访问数</div>
              <div class="col col-actions">操作</div>
            </div>
            <div class="table-body">
              <div
                  v-for="(stats, pagePath) in pageStats"
                  :key="pagePath"
                  class="table-row"
              >
                <div class="col col-page">{{ formatPageName(stats.path || stats.name || pagePath) }}</div>
                <div class="col col-views">{{ stats.views || 0 }}</div>
                <div class="col col-actions">
                  <button @click="editPageStat(pagePath, stats)" class="edit-btn">编辑</button>
                  <button @click="deletePageStat(pagePath)" class="delete-btn">删除</button>
                </div>
              </div>
              <div v-if="Object.keys(pageStats).length === 0" class="table-empty">
                暂无页面统计
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑统计数据模态框 -->
      <div v-if="showStatsModal" class="modal-overlay" @click="closeStatsModal">
        <div class="modal-content" @click.stop>
          <h3>编辑统计数据</h3>
          <div class="form-group">
            <label>{{ editingStats?.fieldName || '' }}:</label>
            <input
                :type="editingStats?.field === 'averageTime' ? 'text' : 'number'"
                v-model="editingStats.value"
                class="form-input"
            >
          </div>
          <div class="modal-actions">
            <button @click="saveSiteStat" class="save-btn">保存</button>
            <button @click="closeStatsModal" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

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
            <div class="input-with-action">
              <select id="article-category" v-model="articleForm.category" class="form-select">
                <option v-for="cat in blogCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
              <button @click="showAddCategoryForm" class="small-add-btn" title="新增分类">+</button>
            </div>
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
              <label v-for="page in impactPages" :key="page.id" class="checkbox-item">
                <input type="checkbox" v-model="updateForm.impactPages" :value="page.id">
                {{ page.name }}
              </label>
              <button @click="showAddImpactPageForm" class="small-add-btn" title="新增页面">+</button>
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

      <!-- 添加/编辑传送舱链接模态框 -->
      <div v-if="showTeleportModal" class="modal-overlay" @click="closeTeleportModal">
        <div class="modal-content" @click.stop>
          <h3>{{ isEditingTeleport ? '编辑链接' : '添加链接' }}</h3>
          <div class="form-group">
            <label for="teleport-name">名称：</label>
            <input type="text" id="teleport-name" v-model="teleportForm.name" class="form-input">
          </div>
          <div class="form-group">
            <label for="teleport-url">URL：</label>
            <input type="text" id="teleport-url" v-model="teleportForm.url" class="form-input">
          </div>
          <div class="form-group">
            <label for="teleport-category">分类：</label>
            <select id="teleport-category" v-model="teleportForm.category" class="form-select">
              <option value="工具导航">工具导航</option>
              <option value="软件下载">软件下载</option>
              <option value="有意思的网站">有意思的网站</option>
              <option value="学习资源">学习资源</option>
              <option value="其它">其它</option>
            </select>
          </div>
          <div class="form-group">
            <label for="teleport-icon">图标 (Emoji)：</label>
            <input type="text" id="teleport-icon" v-model="teleportForm.icon" class="form-input">
          </div>
          <div class="form-group">
            <label for="teleport-description">描述：</label>
            <textarea id="teleport-description" v-model="teleportForm.description" class="form-textarea" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button @click="saveTeleport" class="save-btn">保存</button>
            <button @click="closeTeleportModal" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 新增博客分类模态框 -->
      <div v-if="showCategoryModal" class="modal-overlay" @click="closeCategoryModal">
        <div class="modal-content small-modal" @click.stop>
          <h3>新增博客分类</h3>
          <div class="form-group">
            <label for="cat-id">标识符 (英文):</label>
            <input type="text" id="cat-id" v-model="categoryForm.id" class="form-input" placeholder="例如: life">
          </div>
          <div class="form-group">
            <label for="cat-name">显示名称 (中文):</label>
            <input type="text" id="cat-name" v-model="categoryForm.name" class="form-input" placeholder="例如: 生活">
          </div>
          <div class="modal-actions">
            <button @click="saveCategory" class="save-btn">添加</button>
            <button @click="closeCategoryModal" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 新增影响页面模态框 -->
      <div v-if="showImpactPageModal" class="modal-overlay" @click="closeImpactPageModal">
        <div class="modal-content small-modal" @click.stop>
          <h3>新增影响页面</h3>
          <div class="form-group">
            <label for="page-id">页面 ID (英文):</label>
            <input type="text" id="page-id" v-model="impactPageForm.id" class="form-input" placeholder="例如: blog">
          </div>
          <div class="form-group">
            <label for="page-name">页面名称 (中文):</label>
            <input type="text" id="page-name" v-model="impactPageForm.name" class="form-input" placeholder="例如: 博客">
          </div>
          <div class="modal-actions">
            <button @click="saveImpactPage" class="save-btn">添加</button>
            <button @click="closeImpactPageModal" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 编辑访问记录模态框 -->
      <div v-if="showVisitModal" class="modal-overlay" @click="closeVisitModal">
        <div class="modal-content" @click.stop>
          <h3>编辑访问记录</h3>
          <div class="form-group">
            <label>访问时间：</label>
            <input type="text" v-model="visitForm.time" class="form-input">
          </div>
          <div class="form-group">
            <label>页面路径：</label>
            <input type="text" v-model="visitForm.page" class="form-input">
          </div>
          <div class="form-group">
            <label>停留时长：</label>
            <input type="text" v-model="visitForm.duration" class="form-input">
          </div>
          <div class="form-group">
            <label>IP地址/位置：</label>
            <input type="text" v-model="visitForm.location" class="form-input">
          </div>
          <div class="modal-actions">
            <button @click="saveVisit" class="save-btn">保存</button>
            <button @click="closeVisitModal" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 编辑页面统计模态框 -->
      <div v-if="showPageStatModal" class="modal-overlay" @click="closePageStatModal">
        <div class="modal-content" @click.stop>
          <h3>编辑页面访问统计</h3>
          <div class="form-group">
            <label>页面路径：</label>
            <input type="text" v-model="pageStatForm.path" class="form-input" readonly>
          </div>
          <div class="form-group">
            <label>访问次数：</label>
            <input type="number" v-model.number="pageStatForm.views" class="form-input">
          </div>
          <div class="modal-actions">
            <button @click="savePageStat" class="save-btn">保存</button>
            <button @click="closePageStatModal" class="cancel-btn">取消</button>
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
import { db, ref, set, onValue, get, remove, update } from '@/firebase'

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
        { id: 'updates', name: '网站更新' },
        { id: 'background', name: '背景管理' },
        { id: 'teleport', name: '传送舱管理' },
        { id: 'database', name: '数据库管理' }
      ],

      // 数据
      blogArticles: [],
      siteUpdates: [],
      teleportLinks: [],
      blogCategories: [],
      impactPages: [],

      // 数据库管理数据
      siteStats: {},
      recentVisits: [],
      pageStats: {},
      knownVisitors: [],
      knownIPs: [],
      durationStats: {},
      todayStats: {},
      selectedVisitIndex: null,
      editingVisit: null,
      editingStats: null,

      // 背景管理数据
      availableBackgrounds: [],
      currentBackgroundPath: '/theme/IMG_20250206_221559.jpg',
      currentBackgroundName: '默认背景',
      backgroundChanged: false,
      // 模态框状态
      showStatsModal: false,
      showVisitModal: false,
      showPageStatModal: false,
      showArticleModal: false,
      showUpdateModal: false,
      showTeleportModal: false,
      showCategoryModal: false,
      showImpactPageModal: false,
      isEditingArticle: false,
      isEditingUpdate: false,
      isEditingTeleport: false,
      currentArticleId: null,
      currentUpdateId: null,
      currentTeleportId: null,

      // 表单数据
      categoryForm: {
        id: '',
        name: ''
      },
      impactPageForm: {
        id: '',
        name: ''
      },
      visitForm: {
        index: null,
        time: '',
        page: '',
        duration: '',
        location: ''
      },
      pageStatForm: {
        path: '',
        views: 0
      },
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

      teleportForm: {
        name: '',
        url: '',
        category: '有意思的网站',
        description: '',
        icon: '🌐'
      },

      // 提示信息
      showSuccessMessage: false,
      successMessage: '',

      // 同步状态
      syncStatus: 'idle', // idle, syncing, synced, error
    }
  },
  computed: {
    currentBackgroundDisplay() {
      // 直接返回当前背景路径
      return this.currentBackgroundPath
    }
  },
  created() {
    // 每次进入后台都需要重新登录，不检查本地存储
    this.isAuthenticated = false
    // 初始化背景列表
    this.loadBackgroundList()
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
      this.loadTeleportLinks()
      this.loadBackgroundSetting()
      this.loadDatabaseStats()
      this.loadDynamicOptions()
    },

    // 加载动态选项 (分类和页面)
    loadDynamicOptions() {
      const catRef = ref(db, 'blogCategories')
      onValue(catRef, (snapshot) => {
        if (snapshot.exists()) {
          this.blogCategories = snapshot.val()
        } else {
          // 默认分类
          this.blogCategories = [
            { id: 'tech', name: '技术' },
            { id: 'life', name: '生活' }
          ]
        }
      })

      const pageRef = ref(db, 'impactPages')
      onValue(pageRef, (snapshot) => {
        if (snapshot.exists()) {
          this.impactPages = snapshot.val()
        } else {
          // 默认页面
          this.impactPages = [
            { id: 'home', name: '首页' },
            { id: 'blog', name: '博客' },
            { id: 'music', name: '音乐站台' },
            { id: 'quotes', name: '幸运曲奇' },
            { id: 'vote', name: '投票广场' },
            { id: 'havefun', name: '游戏中心' },
            { id: 'news', name: '网站资讯' },
            { id: 'updates', name: '更新动态' },
            { id: 'guestbook', name: '留言板' },
            { id: 'teleport', name: '传送舱' }
          ]
        }
      })
    },

    // 显示新增分类表单
    showAddCategoryForm() {
      this.categoryForm = { id: '', name: '' }
      this.showCategoryModal = true
    },

    // 保存新分类
    async saveCategory() {
      if (!this.categoryForm.id || !this.categoryForm.name) {
        alert('请填写完整分类信息')
        return
      }
      try {
        const newCat = { ...this.categoryForm }
        const updatedCats = [...this.blogCategories, newCat]
        await set(ref(db, 'blogCategories'), updatedCats)
        this.showSuccess('分类添加成功')
        this.closeCategoryModal()
      } catch (error) {
        console.error('添加分类失败:', error)
      }
    },

    closeCategoryModal() {
      this.showCategoryModal = false
    },

    // 显示新增影响页面表单
    showAddImpactPageForm() {
      this.impactPageForm = { id: '', name: '' }
      this.showImpactPageModal = true
    },

    // 保存新影响页面
    async saveImpactPage() {
      if (!this.impactPageForm.id || !this.impactPageForm.name) {
        alert('请填写完整页面信息')
        return
      }
      try {
        const newPage = { ...this.impactPageForm }
        const updatedPages = [...this.impactPages, newPage]
        await set(ref(db, 'impactPages'), updatedPages)
        this.showSuccess('页面添加成功')
        this.closeImpactPageModal()
      } catch (error) {
        console.error('添加页面失败:', error)
      }
    },

    closeImpactPageModal() {
      this.showImpactPageModal = false
    },

    // 加载传送舱链接
    loadTeleportLinks() {
      try {
        const linksRef = ref(db, 'teleportLinks')
        onValue(linksRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            if (Array.isArray(data)) {
              this.teleportLinks = data.filter(item => item && item.name)
            } else if (typeof data === 'object') {
              this.teleportLinks = Object.values(data).filter(item => item && item.name)
            }
          } else {
            this.teleportLinks = []
          }
        })
      } catch (error) {
        console.error('加载传送舱链接失败:', error)
      }
    },

    // 显示添加传送舱链接表单
    showAddTeleportForm() {
      this.isEditingTeleport = false
      this.currentTeleportId = null
      this.teleportForm = {
        name: '',
        url: '',
        category: '有意思的网站',
        description: '',
        icon: '🌐'
      }
      this.showTeleportModal = true
    },

    // 编辑传送舱链接
    editTeleport(link) {
      this.isEditingTeleport = true
      this.currentTeleportId = link.id
      this.teleportForm = {
        name: link.name,
        url: link.url,
        category: link.category,
        description: link.description || '',
        icon: link.icon || '🌐'
      }
      this.showTeleportModal = true
    },

    // 保存传送舱链接
    async saveTeleport() {
      try {
        this.syncStatus = 'syncing'
        const linksRef = ref(db, 'teleportLinks')

        // 获取当前数据
        const snapshot = await get(linksRef)
        let existingLinks = []
        const data = snapshot.val()
        if (data) {
          existingLinks = Array.isArray(data) ? data : Object.values(data)
        }

        if (this.isEditingTeleport && this.currentTeleportId) {
          // 编辑
          const updatedLinks = existingLinks.map(link => {
            if (link.id === this.currentTeleportId) {
              return { ...this.teleportForm, id: this.currentTeleportId }
            }
            return link
          })
          await set(linksRef, updatedLinks)
          this.showSuccess('链接更新成功！')
        } else {
          // 添加
          const newId = 'link-' + Date.now()
          const newLink = { ...this.teleportForm, id: newId }
          await set(linksRef, [...existingLinks, newLink])
          this.showSuccess('链接添加成功！')
        }
        this.syncStatus = 'synced'
        this.closeTeleportModal()
      } catch (error) {
        console.error('保存传送舱链接失败:', error)
        this.syncStatus = 'error'
      }
    },

    // 删除传送舱链接
    async deleteTeleport(id) {
      if (confirm('确定要删除这个链接吗？')) {
        try {
          this.syncStatus = 'syncing'
          const linksRef = ref(db, 'teleportLinks')
          const snapshot = await get(linksRef)
          const data = snapshot.val()
          if (data) {
            const links = Array.isArray(data) ? data : Object.values(data)
            const filteredLinks = links.filter(link => link.id !== id)
            await set(linksRef, filteredLinks)
            this.syncStatus = 'synced'
            this.showSuccess('链接已删除')
          }
        } catch (error) {
          console.error('删除传送舱链接失败:', error)
          this.syncStatus = 'error'
        }
      }
    },

    // 关闭传送舱模态框
    closeTeleportModal() {
      this.showTeleportModal = false
    },

    // 初始化默认传送舱数据
    async initTeleportData() {
      if (!confirm('这将覆盖现有的传送舱数据，确定吗？')) return

      const defaultLinks = [
        { id: 'l1', name: '工具导航网站', url: 'https://www.1920m.com/', category: '工具导航', icon: '🛠️', description: '综合性的工具导航站' },
        { id: 'l2', name: '软仓', url: 'https://www.ruancang.net/', category: '软件下载', icon: '📦', description: '绿色软件下载网站' },
        { id: 'l3', name: 'geospy', url: 'https://geospy.ai/', category: '有意思的网站', icon: '🌍', description: 'AI地理位置识别' },
        { id: 'l4', name: '找台词', url: 'https://zhaotaici.cn/', category: '有意思的网站', icon: '🎬', description: '电影台词搜索' },
        { id: 'l5', name: '摄像头直播', url: 'https://www.skylinewebcams.com/', category: '有意思的网站', icon: '📹', description: '全球各地摄像头实时直播' },
        { id: 'l6', name: '世界名画艺术博物馆', url: 'https://gallerix.asia/', category: '有意思的网站', icon: '🎨', description: '在线艺术博物馆' },
        { id: 'l7', name: '纪妖', url: 'https://cbaigui.com/', category: '有意思的网站', icon: '👻', description: '中国妖怪百鬼录' },
        { id: 'l8', name: '反向词典', url: 'https://wantwords.net/', category: '有意思的网站', icon: '📖', description: '万词王，根据描述找词语' },
        { id: 'l9', name: '眼睛连麦', url: 'https://neal.fun/eyechat/', category: '有意思的网站', icon: '👀', description: '有趣的眼睛互动' },
        { id: 'l10', name: '手绘电影', url: 'https://thefreemovie.buzz/', category: '有意思的网站', icon: '✏️', description: '手绘风格的电影' },
        { id: 'l11', name: '去火星', url: 'https://absurd.website/trip-to-mars/', category: '有意思的网站', icon: '🚀', description: '荒诞网站：火星之旅' },
        { id: 'l12', name: '光标舞会', url: 'https://cursordanceparty.com/', category: '有意思的网站', icon: '🖱️', description: '大家的光标一起跳舞' },
        { id: 'l13', name: 'justtypestuff', url: 'https://justtypestuff.com/', category: '有意思的网站', icon: '⌨️', description: '纯粹的打字空间' },
        { id: 'l14', name: '摸鱼游戏', url: 'https://rando.gg/', category: '有意思的网站', icon: '🐟', description: '随机小游戏集合' },
        { id: 'l15', name: '游戏地图', url: 'https://noclip.website/', category: '有意思的网站', icon: '🗺️', description: '游戏场景浏览器' },
        { id: 'l16', name: '全球电台', url: 'https://radiocast.co/', category: '有意思的网站', icon: '📻', description: '收听世界各地的电台' },
        { id: 'l17', name: '海战游戏', url: 'https://mk48.io/', category: '有意思的网站', icon: '🚢', description: '多人在线海战小游戏' },
        { id: 'l18', name: '中国色', url: 'https://zhongguose.com/', category: '有意思的网站', icon: '🧧', description: '中国传统色彩名录' },
        { id: 'l19', name: '光污染地图', url: 'https://www.lightpollutionmap.info', category: '有意思的网站', icon: '🌃', description: '全球光污染分布图' },
        { id: 'l20', name: '2050未来地球', url: 'https://2050.earth', category: '有意思的网站', icon: '🔮', description: '探索未来的地球' },
        { id: 'l21', name: '各地地图', url: 'https://d-maps.com/', category: '有意思的网站', icon: '📍', description: '丰富的地图资源' },
        { id: 'l22', name: '全景故宫', url: 'https://pano.dpm.org.cn/#/', category: '有意思的网站', icon: '⛩️', description: '故宫博物院全景虚拟游览' },
        { id: 'l23', name: '打字练习', url: 'https://www.ghtxx.cn/ztype/', category: '有意思的网站', icon: '🎯', description: '打字射击游戏' },
        { id: 'l24', name: '网页MC', url: 'https://www.mc.js.cool/', category: '有意思的网站', icon: '⛏️', description: '浏览器里的我的世界' },
        { id: 'l25', name: '电影色彩', url: 'https://screenmusings.org/', category: '有意思的网站', icon: '🌈', description: '提取电影中的色彩美学' },
        { id: 'l26', name: 'MC种子查找器', url: 'https://www.chunkbase.com/', category: '有意思的网站', icon: '🔍', description: 'Minecraft地图种子搜索' },
        { id: 'l27', name: '中国minecraftWIKI', url: 'https://zh.minecraft.wiki/', category: '有意思的网站', icon: '📚', description: 'MC中文百科' },
        { id: 'l28', name: '免费资源集合FMHY', url: 'https://fmhy.hezidh.com/', category: '有意思的网站', icon: '💎', description: '海量免费资源索引' },
        { id: 'l29', name: '你会按下这个按钮吗', url: 'https://willyoupressthebutton.com/?lang=zh', category: '有意思的网站', icon: '🔘', description: '两难抉择的有趣测试' },
        { id: 'l30', name: '人体解剖网站', url: 'https://human.biodigital.com/', category: '有意思的网站', icon: '🧬', description: '3D人体解剖交互' },
        { id: 'l31', name: '透明素材网站', url: 'https://pngimg.com/', category: '有意思的网站', icon: '🖼️', description: '海量免抠透明PNG素材' },
        { id: 'l32', name: '网页时光机', url: 'https://archive.org/', category: '有意思的网站', icon: '⏳', description: 'Wayback Machine 互联网档案' },
        { id: 'l33', name: '学习网站', url: 'https://learn-anything.xyz/', category: '学习资源', icon: '🎓', description: '万物皆可学的知识图谱' },
        { id: 'l34', name: '文档改手写体', url: 'https://www.autohanding.com/', category: '工具导航', icon: '✍️', description: 'AI文档转手写体（付费）' },
        { id: 'l35', name: '全球历史', url: 'http://TimeMap.org', category: '学习资源', icon: '🕰️', description: '世界历史的时间轴地图' },
        { id: 'l36', name: '各国纸币', url: 'https://www.realbanknotes.com/', category: '有意思的网站', icon: '💵', description: '全球各国纸币展示' }
      ]

      try {
        this.syncStatus = 'syncing'
        await set(ref(db, 'teleportLinks'), defaultLinks)
        this.syncStatus = 'synced'
        this.showSuccess('默认链接已初始化！')
      } catch (error) {
        console.error('初始化默认链接失败:', error)
        this.syncStatus = 'error'
      }
    },

    // 格式化页面名称，将路径转换为中文
    formatPageName(page) {
      if (!page) return '未知页面'
      const pathTitleMap = {
        '/': '首页',
        '/home': '首页',
        '/blog': '博客',
        '/music': '音乐站台',
        '/news': '网站资讯',
        '/updates': '更新动态',
        '/guestbook': '留言板',
        '/quotes': '幸运曲奇',
        '/vote': '投票广场',
        '/admin': '后台管理',
        '/teleport': '传送舱',
        '/havefun': 'havefun',
        '/havefun/lights': '熄灯游戏',
        '/havefun/cipher': '文字加密与解密器',
        '/havefun/monty': '三门问题',
        '/havefun/boring': '无聊字符串',
        '/havefun/minesweeper': '扫雷'
      }
      return pathTitleMap[page] || page
    },

    // 重新计算并保存 UV 数
    async recalculateUV() {
      try {
        const uvCount = this.knownIPs.length
        const updates = {
          'siteStats/uniqueVisitors': uvCount
        }
        await update(ref(db), updates)
        this.siteStats.uniqueVisitors = uvCount
        alert(`已根据已知 IP 列表重新计算访问人数为: ${uvCount}`)
      } catch (error) {
        console.error('重新计算 UV 失败:', error)
        alert('重新计算失败')
      }
    },

    // 加载数据库统计信息
    loadDatabaseStats() {
      try {
        console.log('AdminView: 开始加载数据库统计信息');

        // 加载站点统计
        const siteStatsRef = ref(db, 'siteStats')
        get(siteStatsRef).then(snapshot => {
          if (snapshot.exists()) {
            this.siteStats = snapshot.val()
            console.log('AdminView: 站点统计数据加载成功:', this.siteStats);
          } else {
            console.log('AdminView: 站点统计数据不存在');
          }
        }).catch(error => {
          console.error('AdminView: 加载站点统计失败:', error);
        })

        // 加载最近访问记录
        const recentVisitsRef = ref(db, 'recentVisits')
        get(recentVisitsRef).then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            console.log('AdminView: 最近访问记录原始数据:', data);
            if (typeof data === 'object' && !Array.isArray(data)) {
              // 将对象转换为数组，按索引排序
              this.recentVisits = Object.entries(data)
                  .map(([index, visit]) => ({
                    ...visit,
                    _index: parseInt(index)
                  }))
                  .sort((a, b) => a._index - b._index)
                  .slice(0, 30)
            } else if (Array.isArray(data)) {
              this.recentVisits = data.slice(0, 30)
            }
            console.log('AdminView: 最近访问记录处理后:', this.recentVisits.length, '条记录');
          } else {
            console.log('AdminView: 最近访问记录不存在');
          }
        }).catch(error => {
          console.error('AdminView: 加载最近访问记录失败:', error);
        })

        // 加载页面统计
        const pageStatsRef = ref(db, 'pageStats')
        get(pageStatsRef).then(snapshot => {
          if (snapshot.exists()) {
            this.pageStats = snapshot.val()
            console.log('AdminView: 页面统计数据加载成功:', Object.keys(this.pageStats).length, '个页面');
          } else {
            console.log('AdminView: 页面统计数据不存在');
          }
        }).catch(error => {
          console.error('AdminView: 加载页面统计失败:', error);
        })

        // 加载今日统计
        const todayStatsRef = ref(db, 'todayStats')
        get(todayStatsRef).then(snapshot => {
          if (snapshot.exists()) {
            this.todayStats = snapshot.val()
            console.log('AdminView: 今日统计数据加载成功:', this.todayStats);
          } else {
            console.log('AdminView: 今日统计数据不存在');
          }
        }).catch(error => {
          console.error('AdminView: 加载今日统计失败:', error);
        })

        // 加载已知访客
        const knownVisitorsRef = ref(db, 'knownVisitors')
        get(knownVisitorsRef).then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            console.log('AdminView: 已知访客原始数据:', data);
            if (typeof data === 'object') {
              this.knownVisitors = Object.keys(data)
            }
            console.log('AdminView: 已知访客处理后:', this.knownVisitors.length, '个访客');
          } else {
            console.log('AdminView: 已知访客数据不存在');
          }
        }).catch(error => {
          console.error('AdminView: 加载已知访客失败:', error);
        })

        // 加载已知 IP
        const knownIPsRef = ref(db, 'knownIPs')
        get(knownIPsRef).then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            console.log('AdminView: 已知 IP 原始数据:', data);
            if (Array.isArray(data)) {
              this.knownIPs = data
            }
            console.log('AdminView: 已知 IP 处理后:', this.knownIPs.length, '个 IP');
          } else {
            console.log('AdminView: 已知 IP 数据不存在');
          }
        }).catch(error => {
          console.error('AdminView: 加载已知 IP 失败:', error);
        })

        // 加载停留时长统计
        const durationStatsRef = ref(db, 'durationStats')
        get(durationStatsRef).then(snapshot => {
          if (snapshot.exists()) {
            this.durationStats = snapshot.val()
            console.log('AdminView: 停留时长统计数据加载成功:', Object.keys(this.durationStats).length, '个时长记录');
          } else {
            console.log('AdminView: 停留时长统计数据不存在');
          }
        }).catch(error => {
          console.error('AdminView: 加载停留时长统计失败:', error);
        })

        console.log('AdminView: 数据库统计信息加载请求已发送');
      } catch (error) {
        console.error('AdminView: 加载数据库数据失败:', error)
      }
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
          const updatedData = {...existingData}
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

          const updatedData = {...existingData}
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
          const updatedData = {...existingData}
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

    // 加载背景列表 - 修复核心问题
    loadBackgroundList() {
      try {
        // 背景文件列表（assets/背景 文件夹中的图片）
        // 注意：路径要根据你的实际项目结构调整
        this.availableBackgrounds = [
          {name: 'AKIRA-WALLPAPER.jpg', path: require('@/assets/背景/AKIRA-WALLPAPER.jpg')},
          {name: 'IMG_20250206_221559.jpg', path: require('@/assets/背景/IMG_20250206_221559.jpg')},
          {name: 'ims1.webp', path: require('@/assets/背景/ims1.webp')},
          {name: 'R.jpg', path: require('@/assets/背景/R.jpg')},
          {name: '屏幕截图 2025-12-05 212259.png', path: require('@/assets/背景/屏幕截图 2025-12-05 212259.png')}
        ];

        console.log('背景列表加载成功:', this.availableBackgrounds);
      } catch (error) {
        console.error('加载背景列表失败:', error);
        // 降级处理：使用默认路径
        this.availableBackgrounds = [
          {name: 'AKIRA-WALLPAPER.jpg', path: '/theme/AKIRA-WALLPAPER.jpg'},
          {name: 'IMG_20250206_221559.jpg', path: '/theme/IMG_20250206_221559.jpg'},
          {name: 'ims1.webp', path: '/theme/ims1.webp'},
          {name: 'R.jpg', path: '/theme/R.jpg'},
          {name: '屏幕截图 2025-12-05 212259.png', path: '/theme/屏幕截图 2025-12-05 212259.png'}
        ];
      }
    },

    // 加载当前背景设置
    loadBackgroundSetting() {
      try {
        const backgroundRef = ref(db, 'backgroundSettings')
        get(backgroundRef).then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            if (data && data.path) {
              this.currentBackgroundPath = data.path
              // 从背景列表中查找对应的名称
              const bg = this.availableBackgrounds.find(b => b.path === data.path)
              if (bg) {
                this.currentBackgroundName = bg.name
              } else {
                this.currentBackgroundName = data.name || '自定义背景'
              }
              this.backgroundChanged = false
            }
          }
        })
      } catch (error) {
        console.error('加载背景设置失败:', error)
      }
    },

    // 选择背景 - 修复核心问题
    selectBackground(bg) {
      try {
        console.log('选择背景:', bg);
        if (!bg || !bg.path) {
          console.error('无效的背景对象:', bg);
          return;
        }

        // 避免重复点击相同背景导致的状态更新
        if (this.currentBackgroundPath === bg.path) {
          this.backgroundChanged = false;
          return;
        }

        // 更新选中状态
        this.currentBackgroundPath = bg.path;
        this.currentBackgroundName = bg.name;
        this.backgroundChanged = true;

        console.log('背景选择成功，状态已更新');
      } catch (error) {
        console.error('选择背景时出错:', error);
        this.showSuccess(`选择背景失败: ${error.message}`);
      }
    },

    // 保存背景设置 - 优化异常处理
    async saveBackgroundSetting() {
      if (!this.backgroundChanged) {
        this.showSuccess('没有需要保存的更改');
        return;
      }

      try {
        this.syncStatus = 'syncing';
        const backgroundRef = ref(db, 'backgroundSettings');

        // 找到选中背景的名称
        const selectedBg = this.availableBackgrounds.find(b => b.path === this.currentBackgroundPath);
        const backgroundName = selectedBg ? selectedBg.name : '未知背景';

        // 保存到 Firebase
        await set(backgroundRef, {
          path: this.currentBackgroundPath,
          name: backgroundName,
          lastUpdated: new Date().toISOString()
        });

        this.syncStatus = 'synced';
        this.backgroundChanged = false;
        this.showSuccess(`背景已更新为：${backgroundName}`);

        console.log('背景设置保存成功');
      } catch (error) {
        console.error('保存背景设置失败:', error);
        this.syncStatus = 'error';
        this.showSuccess(`保存失败: ${error.message || '请重试'}`);
      }
    },

    // 处理图片加载错误
    handleImageError(e) {
      console.warn('图片加载失败:', e.target.src);
      // 设置默认图片
      e.target.src = '/theme/IMG_20250206_221559.jpg';
      e.target.alt = '默认背景';
    },

    // 显示成功提示
    showSuccess(message) {
      this.successMessage = message;
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    },

    // 新增：刷新数据
    reloadData() {
      this.loadDatabaseStats();
      this.showSuccess('数据已刷新');
    },

    // 新增：将 Firebase 数据强制写入本地 JSON 文件
    async syncLocalJson() {
      try {
        console.log('AdminView: 开始同步本地JSON文件');
        this.syncStatus = 'syncing';
        const url = process.env.NODE_ENV === 'production' ? '/api/sync-local' : 'http://localhost:3001/api/sync-local';
        console.log('AdminView: 同步请求URL:', url);

        const resp = await fetch(url, { method: 'POST' });
        console.log('AdminView: 同步请求响应状态:', resp.status, resp.statusText);

        if (resp.ok) {
          this.syncStatus = 'synced';
          this.showSuccess('本地 JSON 文件已从数据库同步');
          console.log('AdminView: 本地JSON同步成功');
        } else {
          const err = await resp.json().catch(() => ({}));
          console.error('AdminView: 同步请求失败', err);
          this.syncStatus = 'error';
          this.showSuccess('同步失败，请检查控制台');
        }
      } catch (e) {
        console.error('AdminView: 同步本地JSON失败:', e);
        this.syncStatus = 'error';
        this.showSuccess('同步失败，请稍后重试');
      }
    },

    // 新增：清空访问记录
    clearAllVisits() {
      if (confirm('确定要清空所有访问记录吗？此操作不可恢复！')) {
        try {
          this.syncStatus = 'syncing';
          const recentVisitsRef = ref(db, 'recentVisits');
          set(recentVisitsRef, []).then(() => {
            this.recentVisits = [];
            this.syncStatus = 'synced';
            this.showSuccess('所有访问记录已清空');
          }).catch(error => {
            console.error('清空访问记录失败:', error);
            this.syncStatus = 'error';
            this.showSuccess(`清空失败: ${error.message}`);
          });
        } catch (error) {
          console.error('清空访问记录失败:', error);
          this.showSuccess(`清空失败: ${error.message}`);
        }
      }
    },

    // 编辑站点统计
    editSiteStat(field) {
      const fieldNames = {
        pageViews: '总访问数',
        uniqueVisitors: '独立访客 (IP)',
        averageTime: '平均停留时长'
      };

      this.editingStats = {
        field: field,
        fieldName: fieldNames[field] || field,
        value: this.siteStats[field] || 0
      };

      this.showStatsModal = true;
    },

    // 编辑今日统计
    editTodayViews() {
      this.editingStats = {
        field: 'todayViews',
        fieldName: '今日访问数',
        value: this.todayStats.views || 0,
        isToday: true
      };
      this.showStatsModal = true;
    },

    // 保存统计数据
    saveSiteStat() {
      if (!this.editingStats) return;

      try {
        this.syncStatus = 'syncing';
        
        if (this.editingStats.isToday) {
          // 保存今日统计
          const todayStatsRef = ref(db, 'todayStats');
          const updatedToday = {
            ...this.todayStats,
            views: this.editingStats.value
          };
          set(todayStatsRef, updatedToday).then(() => {
            this.todayStats = updatedToday;
            this.syncStatus = 'synced';
            this.showSuccess('今日访问数已更新');
            this.closeStatsModal();
          });
          return;
        }

        // 保存全局站点统计
        const siteStatsRef = ref(db, 'siteStats');
        const updatedStats = {
          ...this.siteStats,
          [this.editingStats.field]: this.editingStats.value
        };

        set(siteStatsRef, updatedStats).then(() => {
          this.siteStats = updatedStats;
          this.syncStatus = 'synced';
          this.showSuccess(`${this.editingStats.fieldName}已更新`);
          this.closeStatsModal();
        }).catch(error => {
          console.error('保存统计数据失败:', error);
          this.syncStatus = 'error';
          this.showSuccess(`保存失败: ${error.message}`);
        });
      } catch (error) {
        console.error('保存统计数据失败:', error);
        this.showSuccess(`保存失败: ${error.message}`);
      }
    },

    // 关闭统计编辑模态框
    closeStatsModal() {
      this.showStatsModal = false;
      this.editingStats = null;
    },

    // 编辑访问记录
    editVisit(index, visit) {
      this.visitForm = {
        index: index,
        time: visit.time || '',
        page: visit.page || '',
        duration: visit.duration || '',
        location: visit.location || ''
      };
      this.showVisitModal = true;
    },

    // 保存访问记录
    async saveVisit() {
      if (this.visitForm.index === null) return;
      try {
        this.syncStatus = 'syncing';
        const recentVisitsRef = ref(db, 'recentVisits');
        const updatedVisits = [...this.recentVisits];
        updatedVisits[this.visitForm.index] = {
          time: this.visitForm.time,
          page: this.visitForm.page,
          duration: this.visitForm.duration,
          location: this.visitForm.location
        };

        await set(recentVisitsRef, updatedVisits);
        this.recentVisits = updatedVisits;
        this.syncStatus = 'synced';
        this.showSuccess('访问记录已更新');
        this.closeVisitModal();
      } catch (error) {
        console.error('保存访问记录失败:', error);
        this.syncStatus = 'error';
        this.showSuccess(`保存失败: ${error.message}`);
      }
    },

    closeVisitModal() {
      this.showVisitModal = false;
      this.visitForm = { index: null, time: '', page: '', duration: '', location: '' };
    },

    // 删除单条访问记录
    deleteVisit(index) {
      if (confirm('确定要删除这条访问记录吗？')) {
        try {
          this.syncStatus = 'syncing';
          const recentVisitsRef = ref(db, 'recentVisits');

          // 创建新数组，排除要删除的项
          const updatedVisits = this.recentVisits.filter((_, i) => i !== index);

          set(recentVisitsRef, updatedVisits).then(() => {
            this.recentVisits = updatedVisits;
            this.syncStatus = 'synced';
            this.showSuccess('访问记录已删除');
          }).catch(error => {
            console.error('删除访问记录失败:', error);
            this.syncStatus = 'error';
            this.showSuccess(`删除失败: ${error.message}`);
          });
        } catch (error) {
          console.error('删除访问记录失败:', error);
          this.showSuccess(`删除失败: ${error.message}`);
        }
      }
    },

    // 编辑页面统计
    editPageStat(pagePath, stats) {
      this.pageStatForm = {
        path: pagePath,
        views: stats.views || 0
      };
      this.showPageStatModal = true;
    },

    // 保存页面统计
    async savePageStat() {
      if (!this.pageStatForm.path) return;
      try {
        this.syncStatus = 'syncing';
        const pageStatsRef = ref(db, 'pageStats');
        const updatedPageStats = {...this.pageStats};
        updatedPageStats[this.pageStatForm.path] = {
          ...updatedPageStats[this.pageStatForm.path],
          views: this.pageStatForm.views
        };

        await set(pageStatsRef, updatedPageStats);
        this.pageStats = updatedPageStats;
        this.syncStatus = 'synced';
        this.showSuccess('页面统计已更新');
        this.closePageStatModal();
      } catch (error) {
        console.error('保存页面统计失败:', error);
        this.syncStatus = 'error';
        this.showSuccess(`保存失败: ${error.message}`);
      }
    },

    closePageStatModal() {
      this.showPageStatModal = false;
      this.pageStatForm = { path: '', views: 0 };
    },

    // 删除页面统计
    deletePageStat(pagePath) {
      if (confirm(`确定要删除${pagePath}的统计数据吗？`)) {
        try {
          this.syncStatus = 'syncing';
          const pageStatsRef = ref(db, 'pageStats');

          // 创建新对象，排除要删除的页面
          const updatedPageStats = {...this.pageStats};
          delete updatedPageStats[pagePath];

          set(pageStatsRef, updatedPageStats).then(() => {
            this.pageStats = updatedPageStats;
            this.syncStatus = 'synced';
            this.showSuccess('页面统计已删除');
          }).catch(error => {
            console.error('删除页面统计失败:', error);
            this.syncStatus = 'error';
            this.showSuccess(`删除失败: ${error.message}`);
          });
        } catch (error) {
          console.error('删除页面统计失败:', error);
          this.showSuccess(`删除失败: ${error.message}`);
        }
      }
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

.input-with-action {
  display: flex;
  gap: 10px;
  align-items: center;
}

.small-add-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: #81D8CF;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.small-add-btn:hover {
  background: #5ebfb4;
  transform: scale(1.1);
}

.small-modal {
  max-width: 400px;
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

/* 背景管理样式 */
.background-manage {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.background-preview {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.background-preview h3 {
  color: #1e293b;
  margin-bottom: 20px;
  font-size: 16px;
}

.bg-preview-container {
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.bg-name {
  margin-top: 15px;
  color: #64748b;
  font-size: 14px;
}

.background-selection {
  padding: 20px 0;
}

.background-selection h3 {
  color: #1e293b;
  margin-bottom: 20px;
  font-size: 16px;
}

.bg-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.bg-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 2px solid transparent;
}

.bg-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.bg-item.selected {
  border-color: #81D8CF;
  box-shadow: 0 0 0 3px rgba(129, 216, 207, 0.2);
}

.bg-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.bg-item-name {
  padding: 10px 8px;
  background: white;
  margin: 0;
  font-size: 12px;
  color: #64748b;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 1px solid #e2e8f0;
}

.selected-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #81D8CF;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.bg-actions {
  padding: 20px 0;
  text-align: center;
}

.bg-actions .save-btn {
  padding: 12px 30px;
  background: #81D8CF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.bg-actions .save-btn:hover:not(:disabled) {
  background: #6dd3c9;
}

.bg-actions .save-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
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

/* 数据库管理样式 */
.database-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}

.database-card h3 {
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 15px;
}

.stats-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e2e8f0;
}

.stat-label {
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.visits-table,
.pages-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.table-header {
  display: flex;
  background: #f8f9fa;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.col {
  padding: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-index {
  flex: 0 0 60px;
  text-align: center;
}

.col-time {
  flex: 0 0 180px;
}

.col-page {
  flex: 0 0 200px;
}

.col-duration {
  flex: 0 0 100px;
  text-align: center;
}

.col-location {
  flex: 0 0 150px;
}

.col-views {
  flex: 0 0 100px;
  text-align: center;
}

.col-actions {
  flex: 0 0 120px;
  display: flex;
  gap: 5px;
  justify-content: center;
}

.table-empty {
  padding: 30px;
  text-align: center;
  color: #94a3b8;
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

  .stats-display {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    flex-direction: column;
  }

  .col {
    padding: 8px;
    flex: 1;
    text-align: left !important;
  }

  .col-actions {
    justify-content: flex-start;
    margin-top: 8px;
  }
}
</style>