import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { db, ref, set, get } from '@/firebase'
import analyticsTracker from '@/api/analytics'

// 导入游戏相关组件
import HaveFunIndex from '@/views/HaveFunIndex.vue'
import LightsOutView from '@/views/LightsOutView.vue'
import CipherGameView from '@/views/CipherGameView.vue'
import MontyHallView from '@/views/MontyHallView.vue'
import BoringStringView from '@/views/BoringStringView.vue'
import MinesweeperView from '@/views/MinesweeperView.vue'

// 导入新增组件
import HomeView from '@/views/HomeView.vue'
import BlogView from '@/views/BlogView.vue'
import MusicView from '@/views/MusicView.vue'
import NewsView from '@/views/NewsView.vue'
import UpdatesView from '@/views/UpdatesView.vue'
import GuestbookView from '@/views/GuestbookView.vue'
import QuotesView from '@/views/QuotesView.vue'
import VoteView from '@/views/VoteView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', redirect: 'home' },
      { path: 'home', name: 'home', component: HomeView, meta: { title: '首页' } },
      { path: 'blog', name: 'blog', component: BlogView, meta: { title: '博客' } },
      { path: 'music', name: 'music', component: MusicView, meta: { title: '音乐站台' } },
      { path: 'news', name: 'news', component: NewsView, meta: { title: '网站资讯' } },
      { path: 'updates', name: 'updates', component: UpdatesView, meta: { title: '更新动态' } },
      { path: 'guestbook', name: 'guestbook', component: GuestbookView, meta: { title: '留言板' } },
      { path: 'quotes', name: 'quotes', component: QuotesView, meta: { title: '幸运曲奇' } },
      { path: 'vote', name: 'vote', component: VoteView, meta: { title: '投票广场' } },
      { path: 'admin', name: 'admin', component: () => import('@/views/AdminView.vue'), meta: { title: '后台管理' } },
      
      // 游戏相关路由
      { path: 'havefun', name: 'have-fun', component: HaveFunIndex, meta: { title: 'havefun' } },
      { path: 'havefun/lights', name: 'lights-out', component: LightsOutView, meta: { title: '熄灯游戏' } },
      { path: 'havefun/cipher', name: 'cipher-game', component: CipherGameView, meta: { title: '文字加密与解密器' } },
      { path: 'havefun/monty', name: 'monty-hall', component: MontyHallView, meta: { title: '三门问题' } },
      { path: 'havefun/boring', name: 'boring-string', component: BoringStringView, meta: { title: '无聊字符串' } },
      { path: 'havefun/minesweeper', name: 'minesweeper', component: MinesweeperView, meta: { title: '扫雷' } }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

// 统计工具：记录全站访问量、今日访问量、页面访问排行、最近访问和平均访问时长
async function loadJSON(key, fallback) {
  try {
    // 直接从Firebase数据库读取数据
    const snapshot = await get(ref(db, key))
    if (snapshot.exists()) {
      return snapshot.val()
    }
    return fallback
  } catch (e) {
    console.error('Load failed:', e);
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    // 直接保存到Firebase实时数据库
    set(ref(db, key), value);
  } catch (e) {
    console.error('Save failed:', e);
  }
}



function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '--:--'
  const total = Math.round(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  const pad = n => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(mins)}:${pad(secs)}`
}

// 获取访客IP地址
async function getVisitorIP() {
  try {
    // 尝试使用第三方API获取IP地址
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      // 尝试使用其他IP地址API
      try {
        const response = await fetch('https://api.ip.sb/jsonip')
        const data = await response.json()
        return data.ip
      } catch {
        // 尝试使用浏览器信息作为备选
        const userAgent = navigator.userAgent
        return `browser_${btoa(userAgent.substring(0, 50))}`
      }
    }
  } catch {
    return `unknown_${Date.now()}`
  }
}

// 获取访客地址信息
async function getVisitorLocation() {
  try {
    const ip = await getVisitorIP()
    return `IP: ${ip}`
  } catch {
    return '未知访客'
  }
}

// 记录页面停留时长的函数
function recordPageDuration() {
  try {
    const now = Date.now()
    const start = window.__pageVisitStart
    if (typeof start === 'number') {
      const staySeconds = (now - start) / 1000
      if (staySeconds > 0.5) {
        // 累积总停留时间，用于计算平均访问时长
        const durationStats = loadJSON('durationStats', { totalSeconds: 0, visits: 0 })
        durationStats.totalSeconds += staySeconds
        durationStats.visits += 1
        saveJSON('durationStats', durationStats)

        // 更新最近一次访问记录的停留时长
        const visits = loadJSON('recentVisits', [])
        if (visits && visits.length > 0) {
          visits[0].duration = formatDuration(staySeconds)
          saveJSON('recentVisits', visits)
        }

        // 更新站点统计中的平均访问时长
        const avgSeconds = durationStats.visits > 0 ? durationStats.totalSeconds / durationStats.visits : 0
        const avgTime = formatDuration(avgSeconds)
        const prevStats = loadJSON('siteStats', {
          pageViews: 0,
          uniqueVisitors: 0,
          averageTime: '--:--',
          pageCount: routes[0].children.length,
          startDate: '2026-01-31',
          todayViews: 0
        })
        const siteStats = {
          ...prevStats,
          averageTime: avgTime
        }
        saveJSON('siteStats', siteStats)
      }
    }
    window.__pageVisitStart = now
  } catch (e) {
    // ignore
  }
}

// 在路由切换前，记录上一页的停留时长
router.beforeEach((to, from, next) => {
  if (from && from.name) {
    recordPageDuration()
    analyticsTracker.updatePagePath(to.path)
  }
  next()
})

// 添加页面可见性变化的监听，当用户切换标签页或关闭浏览器时，也能记录停留时长
if (typeof document !== 'undefined' && document.addEventListener) {
  // 当页面失去焦点时
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      recordPageDuration()
    }
  })
  
  // 当用户关闭浏览器或标签页时
  window.addEventListener('beforeunload', function() {
    recordPageDuration()
    analyticsTracker.sendPageView()
  })
}

// 初始化：优先从本地API加载数据，然后同步到Firebase
async function initServerData() {
  try {
    // 1. 优先从本地API加载数据
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded data from local API:', data)
        // 数据已通过API加载，无需再从Firebase加载
        return
      }
    } catch (apiError) {
      console.warn('Failed to load data from API, falling back to Firebase:', apiError)
    }

    // 2. 如果API加载失败，从Firebase加载数据
    const keys = ['siteStats', 'todayStats', 'recentVisits', 'pageStats', 'trendData', 'durationStats', 'knownIPs']
    for (const key of keys) {
      const snapshot = await get(ref(db, key))
      if (snapshot.exists()) {
        const data = snapshot.val()
        console.log('Loaded data from Firebase:', key, data)
      }
    }
  } catch (e) {
    console.error('Init failed:', e)
  }
}

// 初始化访客信息（基于IP地址）
async function initVisitorInfo() {
  try {
    // 先从Firebase加载已有的访客记录
    let knownIPs = []
    try {
      const snapshot = await get(ref(db, 'knownIPs'))
      if (snapshot.exists()) {
        knownIPs = snapshot.val()
      }
    } catch (e) {
      console.error('Load knownIPs failed:', e)
      knownIPs = []
    }
    
    // 获取当前访客的IP地址
    const currentIP = await getVisitorIP()
    
    // 检查当前IP是否已经被记录
    if (!Array.isArray(knownIPs)) {
      knownIPs = []
    }
    
    const isNewVisitor = !knownIPs.includes(currentIP)
    
    // 如果是新访客，添加到已知IP列表
    if (isNewVisitor) {
      knownIPs.push(currentIP)
      // 直接保存到Firebase
      set(ref(db, 'knownIPs'), knownIPs)
    }
    
    // 立即更新唯一访客数
    const uniqueVisitors = knownIPs.length
    let prevStats = {
      pageViews: 0,
      uniqueVisitors: uniqueVisitors,
      averageTime: '--:--',
      pageCount: routes[0].children.length,
      startDate: '2026-01-31',
      todayViews: 0
    }
    
    try {
      const statsSnapshot = await get(ref(db, 'siteStats'))
      if (statsSnapshot.exists()) {
        prevStats = statsSnapshot.val()
      }
    } catch (e) {
      console.error('Load siteStats failed:', e)
    }
    
    const siteStats = {
      ...prevStats,
      uniqueVisitors: uniqueVisitors
    }
    
    // 直接保存到Firebase
    set(ref(db, 'siteStats'), siteStats)
  } catch (e) {
    console.error('Init visitor info failed:', e)
  }
}

// 初始化应用数据
async function initApp() {
  try {
    // 先初始化服务器数据
    await initServerData()
    // 然后初始化访客信息（基于IP地址）
    await initVisitorInfo()
    console.log('App initialization completed')
  } catch (e) {
    console.error('App initialization failed:', e)
  }
}

// 初始化应用
initApp()

// 在每次进入新页面后，记录访问量、今日访问、访问趋势和页面排行
router.afterEach(async to => {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const label = `${today.getMonth() + 1}/${today.getDate()}`

    // 1. 首先更新访问趋势数据（这是所有访问量统计的基础）
    let trends = []
    try {
      const trendsSnapshot = await get(ref(db, 'trendData'))
      if (trendsSnapshot.exists()) {
        trends = trendsSnapshot.val()
      }
    } catch (e) {
      console.error('Load trendData failed:', e)
      trends = []
    }
    
    let todayItem = trends.find(item => item.date === label)
    if (!todayItem) {
      todayItem = { date: label, views: 0 }
      trends.push(todayItem)
    }
    todayItem.views += 1
    
    // 2. 保存所有趋势数据（不限制天数）
    saveJSON('trendData', trends)

    // 3. 计算总访问量（基于所有趋势数据）
    const totalTrendViews = trends.reduce((sum, item) => sum + (item.views || 0), 0)
    
    // 4. 计算今日访问量
    const todayStats = {
      date: todayStr,
      views: todayItem.views
    }
    saveJSON('todayStats', todayStats)

    // 5. 全站统计
    let durationStats = { totalSeconds: 0, visits: 0 }
    try {
      const durationSnapshot = await get(ref(db, 'durationStats'))
      if (durationSnapshot.exists()) {
        durationStats = durationSnapshot.val()
      }
    } catch (e) {
      console.error('Load durationStats failed:', e)
    }
    const avgSeconds = durationStats.visits > 0 ? durationStats.totalSeconds / durationStats.visits : 0
    const avgTime = formatDuration(avgSeconds)

    // 6. 访客统计 - 基于IP地址
    let knownIPs = []
    try {
      const ipsSnapshot = await get(ref(db, 'knownIPs'))
      if (ipsSnapshot.exists()) {
        knownIPs = ipsSnapshot.val()
      }
    } catch (e) {
      console.error('Load knownIPs failed:', e)
    }
    
    if (!Array.isArray(knownIPs)) {
      knownIPs = []
    }
    
    // 计算唯一访客数
    const uniqueVisitors = knownIPs.length
    
    let prevStats = {
      pageViews: totalTrendViews,
      uniqueVisitors: uniqueVisitors,
      averageTime: avgTime,
      pageCount: routes[0].children.length,
      startDate: '2026-01-31',
      todayViews: todayStats.views
    }
    
    try {
      const statsSnapshot = await get(ref(db, 'siteStats'))
      if (statsSnapshot.exists()) {
        prevStats = statsSnapshot.val()
      }
    } catch (e) {
      console.error('Load siteStats failed:', e)
    }

    // 7. 统一的全站统计数据
    const siteStats = {
      pageViews: totalTrendViews,
      uniqueVisitors,
      averageTime: avgTime,
      pageCount: routes[0].children.length,
      startDate: '2026-01-31',
      todayViews: todayStats.views
    }
    saveJSON('siteStats', siteStats)

    // 8. 最近访问记录 - 移除直接创建访问记录的逻辑
    // 最近访问记录由analytics.js在页面离开时通过sendPageView方法创建，包含真实的停留时长
    // 这样可以确保所有访问记录都有准确的停留时长信息

    // 9. 页面访问排行
    let pageStats = {}
    try {
      const pageSnapshot = await get(ref(db, 'pageStats'))
      if (pageSnapshot.exists()) {
        pageStats = pageSnapshot.val()
      }
    } catch (e) {
      console.error('Load pageStats failed:', e)
    }
    const pagePath = to.path
    const pageName = to.meta && to.meta.title ? to.meta.title : pagePath
    if (!pageStats[pagePath]) {
      pageStats[pagePath] = { name: pageName, path: pagePath, views: 1 }
    } else {
      pageStats[pagePath].views += 1
      pageStats[pagePath].name = pageName
    }
    
    // 确保页面访问排行的总访问量与总访问量一致
    const totalPageViews = Object.values(pageStats).reduce((sum, page) => sum + (page.views || 0), 0)
    if (totalPageViews !== totalTrendViews) {
      // 如果不一致，调整页面访问数据以匹配总访问量
      const pagePaths = Object.keys(pageStats)
      if (pagePaths.length > 0) {
        // 找到访问量最大的页面进行调整
        let maxViewsPage = pagePaths[0]
        for (const path of pagePaths) {
          if ((pageStats[path].views || 0) > (pageStats[maxViewsPage].views || 0)) {
            maxViewsPage = path
          }
        }
        // 调整该页面的访问量以匹配总访问量
        const difference = totalTrendViews - totalPageViews
        if (pageStats[maxViewsPage]) {
          pageStats[maxViewsPage].views = (pageStats[maxViewsPage].views || 0) + difference
        }
      }
    }
    saveJSON('pageStats', pageStats)
  } catch (e) {
    console.error('Statistics error:', e)
  }
})

export default router
