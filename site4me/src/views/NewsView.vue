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

    <!-- 页面访问排行 -->
    <div class="page-ranking">
      <h2>页面访问排行</h2>
      <div class="ranking-list">
        <div 
          v-for="(page, index) in pageRanking" 
          :key="index"
          class="ranking-item"
        >
          <div class="ranking-number">{{ index + 1 }}</div>
          <div class="ranking-info">
            <div class="page-name">{{ page.name }}</div>
            <div class="page-path">{{ page.path }}</div>
          </div>
          <div class="ranking-views">{{ page.views }} 次</div>
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
        startDate: '2026-01-20',
        todayViews: 0
      },
      recentVisits: [],
      dailyTrends: [],
      pageRanking: [],
      maxVisits: 10,
      // 同步相关
      isInitialLoad: true, // 首次加载标志
      forceSync: false // 强制同步标志
    }
  },
  mounted() {
    // 初始化Firebase数据监听
    this.initFirebaseListeners()
    // 加载统计数据（不再在这里进行累加，统计逻辑移到全局路由钩子）
    this.loadStats()
    // 加载访问趋势数据
    this.loadTrendData()
    // 加载页面访问排行数据
    this.loadPageRanking()
    // 加载最近访问记录
    this.loadRecentVisits()
  },
  methods: {
    // 初始化Firebase数据监听
    initFirebaseListeners() {
      try {
        // 监听站点统计数据变化
        onValue(ref(db, 'siteStats'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 首次加载时才从Firebase更新，避免本地修改被覆盖
            if (this.isInitialLoad) {
              this.stats = data
            }
          }
        })
        
        // 监听最近访问记录变化
        onValue(ref(db, 'recentVisits'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 首次加载时才从Firebase更新，避免本地修改被覆盖
            if (this.isInitialLoad) {
              this.recentVisits = data
            }
          }
        })
        
        // 监听访问趋势数据变化
        onValue(ref(db, 'trendData'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 首次加载时才从Firebase更新，避免本地修改被覆盖
            if (this.isInitialLoad) {
              this.dailyTrends = data
              if (this.dailyTrends.length > 0) {
                this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2
              } else {
                this.maxVisits = 10
              }
            }
          }
        })
        
        // 监听页面访问排行数据变化
        onValue(ref(db, 'pageStats'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 首次加载时才从Firebase更新，避免本地修改被覆盖
            if (this.isInitialLoad) {
              const pages = Object.values(data)
              pages.sort((a, b) => b.views - a.views)
              this.pageRanking = pages
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
            } else if (key === 'trendData') {
              this.dailyTrends = value;
              if (this.dailyTrends.length > 0) {
                this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2;
              } else {
                this.maxVisits = 10;
              }
            } else if (key === 'pageStats') {
              const pages = Object.values(value);
              pages.sort((a, b) => b.views - a.views);
              this.pageRanking = pages;
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
        } else {
          const savedStats = localStorage.getItem('siteStats')
          if (savedStats) {
            this.stats = JSON.parse(savedStats)
          }
        }
      } catch (e) {
        const savedStats = localStorage.getItem('siteStats')
        if (savedStats) {
          this.stats = JSON.parse(savedStats)
        }
      }
      // 加载完成后设置为非首次加载
      this.isInitialLoad = false
    },
    // 加载最近访问记录
    async loadRecentVisits() {
      try {
        const snapshot = await get(ref(db, 'recentVisits'))
        if (snapshot.exists()) {
          this.recentVisits = snapshot.val()
        } else {
          const recentVisits = localStorage.getItem('recentVisits')
          this.recentVisits = recentVisits ? JSON.parse(recentVisits) : []
        }
      } catch (e) {
        const recentVisits = localStorage.getItem('recentVisits')
        this.recentVisits = recentVisits ? JSON.parse(recentVisits) : []
      }
    },
    // 加载访问趋势数据
    async loadTrendData() {
      try {
        const snapshot = await get(ref(db, 'trendData'))
        if (snapshot.exists()) {
          this.dailyTrends = snapshot.val()
          if (this.dailyTrends.length > 0) {
            this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2
          } else {
            this.maxVisits = 10
          }
        } else {
          const savedTrends = localStorage.getItem('trendData')
          if (savedTrends) {
            this.dailyTrends = JSON.parse(savedTrends)
            if (this.dailyTrends.length > 0) {
              this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2
            } else {
              this.maxVisits = 10
            }
          } else {
            this.dailyTrends = []
            this.maxVisits = 10
          }
        }
      } catch (e) {
        const savedTrends = localStorage.getItem('trendData')
        if (savedTrends) {
          this.dailyTrends = JSON.parse(savedTrends)
          if (this.dailyTrends.length > 0) {
            this.maxVisits = Math.max(...this.dailyTrends.map(item => item.views)) * 1.2
          } else {
            this.maxVisits = 10
          }
        } else {
          this.dailyTrends = []
          this.maxVisits = 10
        }
      }
    },
    // 加载页面访问排行数据
    async loadPageRanking() {
      try {
        const snapshot = await get(ref(db, 'pageStats'))
        if (snapshot.exists()) {
          const pages = Object.values(snapshot.val())
          pages.sort((a, b) => b.views - a.views)
          this.pageRanking = pages
        } else {
          const savedPageStats = localStorage.getItem('pageStats')
          if (savedPageStats) {
            const pages = Object.values(JSON.parse(savedPageStats))
            pages.sort((a, b) => b.views - a.views)
            this.pageRanking = pages
          } else {
            this.pageRanking = []
          }
        }
      } catch (e) {
        const savedPageStats = localStorage.getItem('pageStats')
        if (savedPageStats) {
          const pages = Object.values(JSON.parse(savedPageStats))
          pages.sort((a, b) => b.views - a.views)
          this.pageRanking = pages
        } else {
          this.pageRanking = []
        }
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
        // 页面排行数据需要特殊处理，因为它是对象格式
        const pageStatsObject = {}
        this.pageRanking.forEach((page, index) => {
          pageStatsObject[page.path || `page-${index}`] = page
        })
        set(ref(db, 'pageStats'), pageStatsObject)
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

/* 页面访问排行 */
.page-ranking {
  margin-bottom: 32px;
}

.page-ranking h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.ranking-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.ranking-item {
  display: grid;
  grid-template-columns: 60px 1fr 120px;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s ease;
}

.ranking-item:hover {
  background: #f8fafc;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #81D8CF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ranking-info {
  flex: 1;
}

.page-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.page-path {
  font-size: 0.875rem;
  color: #64748b;
}

.ranking-views {
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
  
  .ranking-item {
    grid-template-columns: 40px 1fr 80px;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .ranking-number {
    font-size: 1rem;
  }
  
  .page-name {
    font-size: 0.875rem;
  }
  
  .page-path {
    font-size: 0.75rem;
  }
  
  .ranking-views {
    font-size: 0.875rem;
  }
}
</style>