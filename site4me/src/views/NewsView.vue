<template>
  <div class="news-view">
    <!-- 网站资讯标题 -->
    <div class="news-header">
      <h1>网站资讯</h1>
      <p>实时统计网站访问数据，记录网站成长历程</p>
    </div>

    <!-- 网站统计概览 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">
          👁️
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.pageViews }}</div>
          <div class="stat-label">总访问量</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          👤
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.uniqueVisitors }}</div>
          <div class="stat-label">访问人数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          ⏰
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.averageTime }}</div>
          <div class="stat-label">平均访问时长</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          📄
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
          <div v-for="(visit, index) in recentVisits" :key="index" class="table-row">
            <span>{{ visit.time }}</span>
            <span>{{ visit.page }}</span>
            <span>{{ visit.duration }}</span>
            <span>{{ visit.referrer }}</span>
            <span>{{ visit.location || '未知' }}</span>
          </div>
          <div v-if="recentVisits.length === 0" class="empty-state">
            暂无访问记录
          </div>
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
              <span v-for="i in 6" :key="i" class="axis-label">
                {{ Math.round((maxVisits / 5) * (5 - i)) }}
              </span>
            </div>
            <div class="chart-content">
              <div class="chart-bars">
                <div 
                  v-for="(item, index) in dailyTrends" 
                  :key="index"
                  class="chart-bar"
                  :style="{ height: (item.views / maxVisits) * 100 + '%' }"
                >
                  <span class="bar-value">{{ item.views }}</span>
                </div>
              </div>
              <div class="chart-x-axis">
                <span v-for="(item, index) in dailyTrends" :key="index" class="axis-label">
                  {{ item.date }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 页面访问次数柱形图 -->
    <div class="page-access-chart">
      <h2>页面访问次数（2026/2/2 下午开始）</h2>
      <div class="access-chart">
        <div class="chart-container">
          <div class="chart-grid">
            <div class="chart-y-axis">
              <span v-for="i in 6" :key="i" class="axis-label">
                {{ Math.round((maxPageVisits / 5) * (5 - i)) }}
              </span>
            </div>
            <div class="chart-content">
              <div class="chart-bars">
                <div 
                  v-for="(page, index) in pageAccessData" 
                  :key="index"
                  class="chart-bar"
                  :style="{ height: (page.views / maxPageVisits) * 100 + '%' }"
                >
                  <span class="bar-value">{{ page.views }}</span>
                </div>
              </div>
              <div class="chart-x-axis">
                <span v-for="(page, index) in pageAccessData" :key="index" class="axis-label">
                  {{ page.name }}
                </span>
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
        pageViews: 0,
        uniqueVisitors: 0,
        averageTime: '--:--',
        pageCount: 0,
        startDate: '2026-01-31',
        todayViews: 0
      },
      recentVisits: [],
      dailyTrends: [],
      pageAccessData: [],
      maxVisits: 10,
      maxPageVisits: 10,
      // 同步相关
      isInitialLoad: true, // 首次加载标志
      forceSync: false, // 强制同步标志
      // 缓存相关
      dataCache: {}, // 数据缓存
      isLoading: false, // 加载状态标志
      loadStartTime: 0 // 加载开始时间
    }
  },
  mounted() {
    // 记录加载开始时间
    this.loadStartTime = performance.now()
    this.isLoading = true
    
    // 优先加载本地API数据，延迟初始化Firebase监听器
    this.initDataLoading()
  },
  methods: {
    // 初始化数据加载
    async initDataLoading() {
      try {
        // 1. 优先从本地API加载统计数据
        await this.loadStatsFromAPI()
        
        // 2. 加载访问趋势数据
        await this.loadTrendData()
        
        // 3. 加载最近访问记录
        await this.loadRecentVisits()
        
        // 4. 计算页面访问数据
        this.calculatePageAccessData()
        
        // 5. 延迟初始化Firebase监听器，减少对页面加载速度的影响
        setTimeout(() => {
          this.initFirebaseListeners()
        }, 1000)
        
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
              ...data,
              startDate: '2026-01-31'
            }
          }
        })
        
        // 监听最近访问记录变化
        onValue(ref(db, 'recentVisits'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            this.recentVisits = data
          }
        })
        
        // 监听访问趋势数据变化
        onValue(ref(db, 'trendData'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            this.dailyTrends = data
            if (this.dailyTrends.length > 0) {
              this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2
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
              this.recentVisits = value;
              // 访问记录更新后重新计算页面访问数据
              this.calculatePageAccessData();
            } else if (key === 'trendData') {
              this.dailyTrends = value;
              if (this.dailyTrends.length > 0) {
                this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2;
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
        const snapshot = await get(ref(db, 'siteStats'))
        if (snapshot.exists()) {
          this.stats = snapshot.val()
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
        console.log('开始加载最近访问记录...')
        // 检查缓存
        const cacheKey = 'recentVisits'
        if (this.dataCache[cacheKey]) {
          this.recentVisits = this.dataCache[cacheKey]
          console.log('Recent visits loaded from cache:', this.dataCache[cacheKey])
          return
        }
        
        // 优先从本地API加载
        try {
          console.log('从API加载最近访问记录...')
          const apiUrl = process.env.NODE_ENV === 'production' ? '/api/stats/recentVisits' : 'http://localhost:3001/api/stats/recentVisits'
          const response = await fetch(apiUrl)
          console.log('API响应状态:', response.status)
          if (response.ok) {
            const data = await response.json()
            console.log('API返回数据:', data)
            if (data) {
              // 更新缓存
              this.dataCache[cacheKey] = data
              // 更新数据
              this.recentVisits = data
              console.log('Recent visits loaded from API:', data)
              // 加载最近访问记录后重新计算页面访问数据
              this.calculatePageAccessData()
              return
            } else {
              console.warn('API返回空数据，从Firebase加载...')
            }
          } else {
            console.warn('API响应失败，状态码:', response.status)
          }
        } catch (apiError) {
          console.warn('Failed to load recent visits from API, falling back to Firebase:', apiError)
        }
        
        // 从Firebase加载作为备选
        console.log('从Firebase加载最近访问记录...')
        const snapshot = await get(ref(db, 'recentVisits'))
        if (snapshot.exists()) {
          const data = snapshot.val()
          console.log('Firebase返回数据:', data)
          // 更新缓存
          this.dataCache[cacheKey] = data
          // 更新数据
          this.recentVisits = data
          console.log('Recent visits loaded from Firebase:', data)
          // 加载最近访问记录后重新计算页面访问数据
          this.calculatePageAccessData()
        } else {
          console.warn('Firebase中没有最近访问记录数据')
        }
      } catch (e) {
        console.error('Load recent visits failed:', e)
      } finally {
        console.log('最近访问记录加载完成:', this.recentVisits)
      }
    },

    // 计算页面访问数据
    calculatePageAccessData() {
      try {
        // 从最近访问记录中统计各页面的访问次数
        const pageCounts = {}
        
        // 遍历最近访问记录
        this.recentVisits.forEach(visit => {
          const pageName = visit.page || '未知页面'
          if (pageCounts[pageName]) {
            pageCounts[pageName] += 1
          } else {
            pageCounts[pageName] = 1
          }
        })
        
        // 转换为数组格式并排序
        const pageAccessArray = Object.entries(pageCounts).map(([name, views]) => ({
          name,
          views
        }))
        
        // 按访问次数降序排序
        pageAccessArray.sort((a, b) => b.views - a.views)
        
        // 更新页面访问数据
        this.pageAccessData = pageAccessArray
        
        // 更新最大页面访问次数
        if (pageAccessArray.length > 0) {
          this.maxPageVisits = Math.max(...pageAccessArray.map(page => page.views)) * 1.2
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
    // 加载访问趋势数据
    async loadTrendData() {
      try {
        // 检查缓存
        const cacheKey = 'trendData'
        if (this.dataCache[cacheKey]) {
          this.dailyTrends = this.dataCache[cacheKey]
          if (this.dailyTrends.length > 0) {
            this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2
          } else {
            this.maxVisits = 10
          }
          console.log('Trend data loaded from cache')
          return
        }
        
        // 优先从本地API加载
        try {
          const apiUrl = process.env.NODE_ENV === 'production' ? '/api/stats/trendData' : 'http://localhost:3001/api/stats/trendData'
          const response = await fetch(apiUrl)
          console.log('Trend API响应状态:', response.status)
          if (response.ok) {
            const data = await response.json()
            console.log('Trend API返回数据:', data)
            if (data && Array.isArray(data)) {
              // 更新缓存
              this.dataCache[cacheKey] = data
              // 更新数据
              this.dailyTrends = data
              if (this.dailyTrends.length > 0) {
                this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2
              } else {
                this.maxVisits = 10
              }
              console.log('Trend data loaded from API:', data)
              return
            }
          }
        } catch (apiError) {
          console.warn('Failed to load trend data from API:', apiError)
        }
        
        // 从Firebase加载作为备选
        try {
          const snapshot = await get(ref(db, 'trendData'))
          if (snapshot.exists()) {
            const data = snapshot.val()
            if (Array.isArray(data)) {
              // 更新缓存
              this.dataCache[cacheKey] = data
              // 更新数据
              this.dailyTrends = data
              if (this.dailyTrends.length > 0) {
                this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2
              } else {
                this.maxVisits = 10
              }
              console.log('Trend data loaded from Firebase:', data)
            }
          } else {
            this.dailyTrends = []
            this.maxVisits = 10
          }
        } catch (firebaseError) {
          console.warn('Failed to load trend data from Firebase:', firebaseError)
          this.dailyTrends = []
          this.maxVisits = 10
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
        // 检查缓存
        const cacheKey = 'siteStats'
        if (this.dataCache[cacheKey]) {
          this.stats = {
            ...this.getDefaultStats(),
            ...this.dataCache[cacheKey],
            startDate: '2026-01-31'
          }
          console.log('Stats loaded from cache:', this.dataCache[cacheKey])
          return
        }
        
        console.log('缓存未命中，从API加载...')
        const apiUrl = process.env.NODE_ENV === 'production' ? '/api/stats/siteStats' : 'http://localhost:3001/api/stats/siteStats'
        const response = await fetch(apiUrl)
        console.log('API响应状态:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('API返回数据:', data)
          if (data) {
            // 更新缓存
            this.dataCache[cacheKey] = data
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
}

.chart-grid {
  display: flex;
  height: 100%;
}

.chart-y-axis {
  width: 50px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 16px;
  font-size: 0.75rem;
  color: #94a3b8;
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.chart-bar {
  flex: 1;
  background: #81D8CF;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s ease;
  min-height: 20px;
}

.chart-bar:hover {
  opacity: 0.8;
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

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  font-size: 0.75rem;
  color: #94a3b8;
}

.axis-label {
  text-align: center;
}

/* 页面访问次数柱形图 */
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
  
  .chart-y-axis {
    width: 40px;
    font-size: 0.625rem;
  }
  
  .chart-bars {
    gap: 8px;
  }
  
  .chart-bar {
    min-height: 16px;
  }
  
  .bar-value {
    font-size: 0.625rem;
    top: -20px;
  }
  
  .chart-x-axis {
    font-size: 0.625rem;
  }
}
</style>
