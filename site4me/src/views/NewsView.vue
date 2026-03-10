<template>
  <div class="news-view">
    <transition name="loader-fade">
      <div v-if="isLoading" class="page-loader">
        <div class="loader-logo">ERYANMEI-OURNOTE</div>
        <div class="loader-subtitle">网站资讯数据加载中...</div>
      </div>
    </transition>
    <!-- 网站资讯标题 -->
    <div class="news-header">
      <h1>网站资讯</h1>
      <p>实时统计网站访问数据，记录网站成长历程</p>
    </div>

    <!-- 网站统计概览 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">
          🛎️
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.pageViews }}</div>
          <div class="stat-label">总访问量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          🙋🏻‍♂️
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.uniqueVisitors }}</div>
          <div class="stat-label">访问人数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          🕐
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.averageTime }}</div>
          <div class="stat-label">平均访问时长</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          📑
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.pageCount }}</div>
          <div class="stat-label">页面数量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          📅
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.startDate }}</div>
          <div class="stat-label">网站上线日期</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          📈
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.todayViews }}</div>
          <div class="stat-label">今日访问量</div>
        </div>
      </div>
    </div>

    <!-- 最近访问记录 -->
    <div class="recent-visits">
      <h2>最近访问记录</h2>
      <div class="visits-table">
        <div class="table-header">
          <span>访问时间</span>
          <span>访问页面</span>
          <span>停留时长</span>
          <span>访问来源</span>
          <span>访客地址</span>
        </div>
        <div class="table-body">
          <div v-for="(visit, index) in paginatedVisits" :key="index" class="table-row">
            <span>{{ visit.time }}</span>
            <span>{{ getPageTitle(visit.page) }}</span>
            <span>{{ visit.duration }}</span>
            <span>{{ visit.referrer }}</span>
            <span>{{ visit.location || '未知' }}</span>
          </div>
          <div v-if="paginatedVisits.length === 0" class="empty-state">
            暂无访问记录
          </div>
        </div>
        <!-- 分页控件 -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">上一页</button>
          <div class="page-numbers">
            <button
              v-for="page in totalPages"
              :key="page"
              class="page-number"
              :class="{ active: currentPage === page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>
          <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
        </div>
      </div>
    </div>

    <!-- 访问趋势 -->
    <div class="visit-trends">
      <h2>访问趋势</h2>
      <div class="trends-chart">
        <div class="chart-container">
          <div class="chart-grid">
            <div class="chart-y-axis">
              <div class="y-axis-inner">
                <span v-for="i in 4" :key="i" class="axis-label">
                  {{ Math.round((maxVisits / 4) * (4 - i + 1)) }}
                </span>
                <span class="axis-label">0</span>
              </div>
            </div>
            <div class="chart-scroll-wrapper">
              <div class="chart-content">
                <div
                  v-for="(item, index) in dailyTrends"
                  :key="index"
                  class="chart-column"
                >
                  <div class="bar-wrapper">
                    <div
                      class="chart-bar"
                      :style="{ height: (item.views / maxVisits) * 100 + '%' }"
                    >
                      <div class="bar-tooltip">
                        <div class="tooltip-date">{{ item.date }}</div>
                        <div class="tooltip-views">访问次数: {{ item.views }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="axis-label">{{ item.date }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 页面访问次数柱形图 -->
    <div class="page-access-chart">
      <h2>页面访问次数（自 2026/2/16晚 始）</h2>
      <div class="access-chart">
        <div class="chart-container page-chart-container">
          <div class="chart-grid">
            <div class="chart-y-axis">
              <div class="y-axis-inner">
                <span v-for="i in 4" :key="i" class="axis-label">
                  {{ Math.round((maxPageVisits / 4) * (4 - i + 1)) }}
                </span>
                <span class="axis-label">0</span>
              </div>
            </div>
            <div class="chart-scroll-wrapper">
              <div class="chart-content page-chart-content">
                <div
                  v-for="(page, index) in pageAccessData"
                  :key="index"
                  class="page-column"
                >
                  <div class="bar-wrapper">
                    <div
                      class="chart-bar"
                      :style="{ height: (page.views / maxPageVisits) * 100 + '%' }"
                    >
                      <span class="bar-value">{{ page.views }}</span>
                      <div class="bar-tooltip">
                        <div class="tooltip-date">{{ getPageTitle(page.name) }}</div>
                        <div class="tooltip-views">访问次数: {{ page.views }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="page-axis-label">{{ getPageTitle(page.name) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { db, ref, onValue, get, set } from '@/firebase'

export default {
  data() {
    return {
      stats: {
        startDate: '2026-01-31' // 固定的上线日期
      },
      recentVisits: [],
      currentPage: 1,
      pageSize: 10,
      dailyTrends: [],
      pageAccessData: [],
      pageStats: {},
      maxVisits: 10,
      maxPageVisits: 10,
      // 同步相关
      isInitialLoad: true, // 首次加载标志
      forceSync: false, // 强制同步标志
      isLoading: false, // 加载状态标志
      loadStartTime: 0, // 加载开始时间
      refreshInterval: null, // 定期刷新定时器
      refreshIntervalTime: 5000 // 每5秒刷新一次数据
    }
  },
  mounted() {
    // 记录加载开始时间
    this.loadStartTime = performance.now()
    this.isLoading = true

    // 初始化数据加载，后续的 onValue 监听会保持数据实时更新
    this.initDataLoading()
  },
  computed: {
    // 计算总页数
    totalPages() {
      return Math.ceil(this.recentVisits.length / this.pageSize)
    },
    // 计算当前页的访问记录
    paginatedVisits() {
      const startIndex = (this.currentPage - 1) * this.pageSize
      const endIndex = startIndex + this.pageSize
      return this.recentVisits.slice(startIndex, endIndex)
    }
  },
  beforeUnmount() {
    // 清除定时器
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },
  methods: {
    // 规范化recentVisits中的时间戳格式
    normalizeRecentVisitsTimestamp(visits) {
      if (!Array.isArray(visits)) {
        return visits;
      }
      
      return visits.map(visit => {
        if (visit && visit.time) {
          // 检查时间是否已经是正确格式（YYYY/M/D HH:MM:SS）
          const correctFormatRegex = /^\d{4}\/\d{1,2}\/\d{1,2} \d{2}:\d{2}:\d{2}$/;
          if (!correctFormatRegex.test(visit.time)) {
            // 尝试解析旧格式的时间并转换为新格式
            try {
              const parsedDate = new Date(visit.time);
              if (!isNaN(parsedDate.getTime())) {
                // 格式化为 YYYY/M/D HH:MM:SS
                const year = parsedDate.getFullYear();
                const month = parsedDate.getMonth() + 1;
                const day = parsedDate.getDate();
                const hours = String(parsedDate.getHours()).padStart(2, '0');
                const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
                const seconds = String(parsedDate.getSeconds()).padStart(2, '0');
                visit.time = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
              }
            } catch (e) {
              console.warn('Failed to parse time format:', visit.time);
            }
          }
        }
        return visit;
      });
    },
    // 切换到指定页
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },
    // 切换到上一页
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    // 切换到下一页
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    // 路径到中文标题的映射
    getPageTitle(page) {
      const pathTitleMap = {
        '/': '首页',
        '/home': '首页',
        '/blog': '博客',
        '/music': '音乐站台',
        '/music/': '音乐站台',
        '/news': '网站资讯',
        '/updates': '更新动态',
        '/guestbook': '留言板',
        '/quotes': '幸运曲奇',
        '/vote': '投票广场',
        '/admin': '后台管理',
        '/teleport': '传送舱',
        '/havefun': '游戏首页',
        '/havefun/lights': '熄灯游戏',
        '/havefun/cipher': '密文',
        '/havefun/monty': '三门问题',
        '/havefun/boring': '无聊字符',
        '/havefun/minesweeper': '扫雷'
      }
      // 检查是否是路径
      if (page.startsWith('/')) {
        // 尝试直接匹配
        if (pathTitleMap[page]) {
          return pathTitleMap[page]
        }
        // 尝试去除末尾斜杠后匹配
        const pageWithoutSlash = page.endsWith('/') ? page.slice(0, -1) : page
        if (pathTitleMap[pageWithoutSlash]) {
          return pathTitleMap[pageWithoutSlash]
        }
        return page
      }
      // 如果已经是中文标题，直接返回
      return page
    },
    // 定期刷新分析数据
    async refreshAnalyticsData() {
      try {
        // 并行加载所有关键数据
        await Promise.all([
          this.loadStats(),
          this.loadRecentVisits(),
          this.loadPageStats(),
          this.loadTrendData()
        ])
        console.log('Periodic refresh completed')
      } catch (error) {
        console.error('Periodic refresh failed:', error)
      }
    },
    // 初始化数据加载
    async initDataLoading() {
      try {
        // 1. 从Firebase加载站点统计数据（真实数据源）
        await this.loadStats()

        // 2. 加载访问趋势数据
        await this.loadTrendData()

        // 3. 加载最近访问记录
        await this.loadRecentVisits()

        // 4. 加载页面访问统计数据
        await this.loadPageStats()

        // 5. 初始化Firebase监听器，后续保持实时更新
        this.initFirebaseListeners()

        // 记录加载完成时间
        const loadEndTime = performance.now()
        console.log(`数据加载完成，耗时: ${(loadEndTime - this.loadStartTime).toFixed(2)}ms`)
      } catch (error) {
        console.error('数据加载失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    // 初始化Firebase数据监听
    initFirebaseListeners() {
      try {
        // 监听站点统计数据变化
        onValue(ref(db, 'siteStats'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 保留startDate为固定值2026-01-31
            this.stats = {
              ...this.stats,
              ...data,
              startDate: '2026-01-31'
            }
          }
        })

        // 监听今日统计数据变化
        onValue(ref(db, 'todayStats'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            this.stats.todayViews = data.views || 0
            console.log('今日访问量更新:', this.stats.todayViews)
          }
        })

        // 监听最近访问记录变化
        onValue(ref(db, 'recentVisits'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            this.recentVisits = this.normalizeRecentVisitsTimestamp(data)
          }
        })

        // 监听页面访问统计数据变化
        onValue(ref(db, 'pageStats'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            this.pageStats = data
            this.calculatePageAccessData()
          }
        })

        // 监听访问趋势数据变化
        onValue(ref(db, 'trendData'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            this.dailyTrends = data
            if (this.dailyTrends.length > 0) {
              this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views))
            } else {
              this.maxVisits = 10
            }
          }
        })

        // 使用BroadcastChannel实现更可靠的标签页间通信
        try {
          const broadcastChannel = new BroadcastChannel('ournote-stats');
          broadcastChannel.onmessage = (event) => {
            const { key, value } = event.data;
            if (key === 'siteStats') {
              this.stats = value;
            } else if (key === 'recentVisits') {
              this.recentVisits = this.normalizeRecentVisitsTimestamp(value);
            } else if (key === 'pageStats') {
              this.pageStats = value;
              this.calculatePageAccessData();
            } else if (key === 'trendData') {
              this.dailyTrends = value;
              if (this.dailyTrends.length > 0) {
                this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views));
              } else {
                this.maxVisits = 10;
              }
            }
          };
        } catch (e) {
          // 如果浏览器不支持BroadcastChannel，忽略
        }
      } catch (e) {
        console.error('Firebase listener error:', e)
        this.isInitialLoad = false
      }
    },


    // 加载统计数据
    async loadStats() {
      try {
        console.log('Loading stats from Firebase...');
        const snapshot = await get(ref(db, 'siteStats'))
        if (snapshot.exists()) {
          const data = snapshot.val()
          console.log('Stats data from Firebase:', data);
          this.stats = {
            ...data,
            startDate: '2026-01-31'
          }
          console.log('Stats set to:', this.stats);
        } else {
          console.warn('No stats data in Firebase, keeping current stats');
        }
      } catch (e) {
        console.error('Load stats failed:', e)
      }
      // 加载完成后设置为非首次加载
      this.isInitialLoad = false
    },
    // 加载最近访问记录
    async loadRecentVisits() {
      try {
        const snapshot = await get(ref(db, 'recentVisits'))
        if (snapshot.exists()) {
          const data = snapshot.val()
          this.recentVisits = this.normalizeRecentVisitsTimestamp(data)
        }
      } catch (e) {
        console.error('Load recent visits failed:', e)
      }
    },

    // 计算页面访问数据
    calculatePageAccessData() {
      try {
        const statsSource = this.pageStats && typeof this.pageStats === 'object' ? this.pageStats : null
        if (!statsSource || Object.keys(statsSource).length === 0) {
          this.pageAccessData = []
          this.maxPageVisits = 10
          console.log('Page access data cleared because pageStats is empty')
          return
        }

        // 转换原始数据，统一使用中文标题，过滤掉/test等测试页面
        const pageAccessArray = Object.values(statsSource).map(page => {
          const path = page.path || page.name || '未知页面'
          // 过滤掉/test页面
          if (path === '/test') {
            return null
          }
          const chineseTitle = this.getPageTitle(path)
          return {
            name: chineseTitle,
            path: path,
            views: page.views || 0
          }
        }).filter(Boolean) // 过滤掉null值

        // 合并相同标题的页面访问数（处理 / 和 /home 都映射到"首页"的情况）
        const mergedMap = {}
        pageAccessArray.forEach(page => {
          if (mergedMap[page.name]) {
            mergedMap[page.name].views += page.views
          } else {
            mergedMap[page.name] = { name: page.name, views: page.views }
          }
        })

        // 转换回数组并按访问次数降序排序
        const mergedArray = Object.values(mergedMap)
        mergedArray.sort((a, b) => b.views - a.views)

        // 更新页面访问数据
        this.pageAccessData = mergedArray

        // 更新最大页面访问次数
        if (mergedArray.length > 0) {
          this.maxPageVisits = Math.max(...mergedArray.map(page => page.views))
        } else {
          this.maxPageVisits = 10
        }

        console.log('Page access data calculated:', this.pageAccessData)
      } catch (e) {
        console.error('Calculate page access data failed:', e)
        this.pageAccessData = []
        this.maxPageVisits = 10
      }
    },

    async loadPageStats() {
      try {
        const snapshot = await get(ref(db, 'pageStats'))
        if (snapshot.exists()) {
          const data = snapshot.val()
          this.pageStats = data
          this.calculatePageAccessData()
        }
      } catch (e) {
        console.error('Load page stats failed:', e)
        this.pageStats = {}
        this.pageAccessData = []
        this.maxPageVisits = 10
      }
    },
    // 加载访问趋势数据
    async loadTrendData() {
      try {
        const snapshot = await get(ref(db, 'trendData'))
        if (snapshot.exists()) {
          const data = snapshot.val()
          if (Array.isArray(data)) {
            this.dailyTrends = data
            if (this.dailyTrends.length > 0) {
              this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views))
            } else {
              this.maxVisits = 10
            }
          }
        }
      } catch (e) {
        console.error('Load trend data failed:', e)
        this.dailyTrends = []
        this.maxVisits = 10
      }
    },

    // 从本地API加载统计数据
    async loadStatsFromAPI() {
      try {
        console.log('开始加载统计数据...')

        const apiUrl = process.env.NODE_ENV === 'production' ? '/api/stats/siteStats' : 'http://localhost:3001/api/stats/siteStats'
        const response = await fetch(apiUrl)
        console.log('API响应状态:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('API返回数据:', data)
          if (data) {
            // 更新数据，确保所有字段都有值
            this.stats = {
              ...this.getDefaultStats(),
              ...data,
              startDate: '2026-01-31'
            }
            console.log('Stats loaded from API:', data)
          } else {
            console.warn('API返回空数据，使用默认值...')
            this.stats = this.getDefaultStats()
            this.stats.startDate = '2026-01-31'
          }
        } else {
          console.warn('Failed to load stats from API, using default values')
          this.stats = this.getDefaultStats()
          this.stats.startDate = '2026-01-31'
        }
      } catch (e) {
        console.error('Error loading stats from API:', e)
        this.stats = this.getDefaultStats()
        this.stats.startDate = '2026-01-31'
      } finally {
        console.log('统计数据加载完成:', this.stats)
      }
    },

    // 获取默认统计数据
    getDefaultStats() {
      return {
        pageViews: 0,
        uniqueVisitors: 0,
        averageTime: '--:--',
        pageCount: 0,
        todayViews: 0
      }
    },


    // 强制同步本地数据到Firebase
    forceSyncData() {
      try {
        this.forceSync = true
        // 保存本地数据到Firebase
        set(ref(db, 'siteStats'), this.stats)
        set(ref(db, 'recentVisits'), this.recentVisits)
        set(ref(db, 'trendData'), this.dailyTrends)
        console.log('本地网站资讯数据已强制同步到Firebase')
        alert('本地网站资讯数据已成功同步到Firebase，所有访客将看到更新后的内容')
      } catch (e) {
        console.error('Force sync data failed:', e)
        alert('同步失败，请稍后重试')
      }
    }
  }
}
</script>

<style scoped>
.news-view {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.16);
  padding: 32px;
  backdrop-filter: saturate(140%) blur(6px);
}

/* 网站资讯标题 */
.news-header {
  text-align: center;
  margin-bottom: 48px;
}

.news-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.news-header p {
  font-size: 1.125rem;
  color: #64748b;
}

/* 网站统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 48px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  background: #81D8CF;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(129, 216, 207, 0.3);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

.page-loader {
  position: fixed;
  inset: 0;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: #e5e7eb;
}

.loader-logo {
  font-size: 2.4rem;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  font-weight: 600;
  color: #e5e7eb;
  animation: loader-glow 1.8s ease-in-out infinite;
}

.loader-subtitle {
  margin-top: 16px;
  font-size: 0.95rem;
  color: #9ca3af;
}

.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.4s ease;
}

.loader-fade-enter,
.loader-fade-leave-to {
  opacity: 0;
}

@keyframes loader-glow {
  0% {
    opacity: 0.3;
    transform: translateY(4px);
  }
  50% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0.3;
    transform: translateY(4px);
  }
}

/* 最近访问记录 */
.recent-visits {
  margin-bottom: 48px;
}

.recent-visits h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.visits-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1.5fr 1.5fr;
  gap: 16px;
  padding: 16px 24px;
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  font-size: 0.875rem;
  border-bottom: 1px solid #f1f5f9;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1.5fr 1.5fr;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.empty-state {
  padding: 48px;
  text-align: center;
  color: #94a3b8;
  font-size: 1rem;
}

/* 分页控件 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #334155;
  border-color: #cbd5e1;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-number {
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover {
  background: #f8fafc;
  color: #334155;
  border-color: #cbd5e1;
}

.page-number.active {
  background: #81D8CF;
  color: white;
  border-color: #81D8CF;
}

/* 访问趋势 */
.visit-trends {
  margin-bottom: 48px;
}

.visit-trends h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.trends-chart {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.chart-container {
  height: 300px;
  position: relative;
  overflow: visible;
}

.page-chart-container {
  height: 400px; /* 增加高度以容纳较长的页面标题 */
}

.chart-grid {
  display: flex;
  height: 100%;
  overflow: visible;
}

.chart-y-axis {
  width: 50px;
  padding-right: 12px;
  font-size: 0.75rem;
  color: #94a3b8;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
  position: relative;
}

.y-axis-inner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: absolute;
  top: 0;
  bottom: 28px; /* 与访问趋势图表的日期标签高度对齐 */
  left: 0;
  right: 12px;
}

/* 页面访问次数图表的Y轴底部对齐（页面标题更高） */
.page-chart-container .y-axis-inner {
  bottom: 66px; /* 与 .page-axis-label 的 height(50px) + margin(16px) 对齐 */
}

.chart-scroll-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: visible;
}

/* 自定义滚动条样式 */
.chart-scroll-wrapper::-webkit-scrollbar {
  height: 6px;
}

.chart-scroll-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.chart-scroll-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.chart-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.chart-content {
  display: flex;
  gap: 20px;
  padding: 0 10px;
  height: 100%;
  min-width: max-content;
}

.chart-column, .page-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  flex-shrink: 0;
}

.page-column {
  width: 70px; /* 页面标题列宽一些 */
}

.bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  overflow: visible;
}

/* 日期标签的容器 */
.axis-label, .page-axis-label {
  margin-top: 12px;
  margin-bottom: 4px;
}

.chart-bar {
  width: 80%;
  max-width: 32px;
  background: #81D8CF;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 2px;
}

.chart-bar:hover {
  background: #5ebfb4;
}

.bar-tooltip {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-views {
  font-size: 0.6875rem;
  opacity: 0.9;
}

.bar-value {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.axis-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: center;
  width: 100%;
}

.page-axis-label {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.3;
  width: 100%;
  height: 60px; /* 固定高度以对齐 */
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
}

/* 页面访问次数图表容器 */
.page-access-chart {
  margin-bottom: 48px;
}

.page-access-chart h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.access-chart {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}



/* 响应式设计 */
@media (max-width: 768px) {
  .news-view {
    padding: 24px 16px;
  }

  .news-header h1 {
    font-size: 2rem;
  }

  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px 16px;
  }

  .table-header span,
  .table-row span {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .table-header span::before,
  .table-row span::before {
    content: attr(data-label);
    font-weight: 600;
    color: #64748b;
  }

  .chart-container {
    height: 250px;
  }

  .page-chart-container {
    height: 350px;
  }

  .chart-y-axis {
    width: 40px;
    font-size: 0.625rem;
    padding-right: 8px;
    padding-bottom: 60px;
  }

  .chart-content {
    gap: 12px;
  }

  .chart-column {
    width: 30px;
  }

  .page-column {
    width: 60px;
  }

  .page-axis-label {
    height: 50px;
    font-size: 0.625rem;
  }

  .bar-value {
    font-size: 0.625rem;
    top: -20px;
  }
}
</style>
