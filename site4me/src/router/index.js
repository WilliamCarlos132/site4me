import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { db, ref, set, get } from '@/firebase'

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
      
      // 游戏相关路由
      { path: 'havefun', name: 'have-fun', component: HaveFunIndex, meta: { title: '游戏天地' } },
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
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch (e) {
    return fallback
  }
}

// 创建BroadcastChannel用于标签页间通信
let broadcastChannel;
try {
  broadcastChannel = new BroadcastChannel('ournote-stats');
} catch (e) {
  // 如果浏览器不支持BroadcastChannel，忽略
}

function saveJSON(key, value) {
  try {
    // 保存到localStorage作为备份
    localStorage.setItem(key, JSON.stringify(value));
    // 通过BroadcastChannel通知其他标签页数据已更新
    if (broadcastChannel) {
      broadcastChannel.postMessage({ key, value });
    }
    // 保存到Firebase实时数据库
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
          startDate: new Date().toISOString().split('T')[0],
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
  })
}

// 初始化：从Firebase加载初始数据
async function initServerData() {
  try {
    // 先检查本地是否已有访客ID
    const localVisitorId = localStorage.getItem('visitorId')
    const localSiteStats = localStorage.getItem('siteStats')
    let localUniqueVisitors = 0
    
    if (localVisitorId && localSiteStats) {
      try {
        const parsedLocalStats = JSON.parse(localSiteStats)
        localUniqueVisitors = parsedLocalStats.uniqueVisitors || 0
      } catch (e) {
        // ignore
      }
    }
    
    const keys = ['siteStats', 'todayStats', 'recentVisits', 'pageStats', 'trendData', 'durationStats']
    for (const key of keys) {
      const snapshot = await get(ref(db, key))
      if (snapshot.exists()) {
        const data = snapshot.val()
        // 特殊处理siteStats，保留本地的访客ID和访问统计
        if (key === 'siteStats') {
          // 如果本地已有访客ID，使用本地的唯一访客数
          if (localVisitorId && localUniqueVisitors > 0) {
            data.uniqueVisitors = localUniqueVisitors
          }
        }
        localStorage.setItem(key, JSON.stringify(data))
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
      // 从localStorage加载备份
      const savedIPs = localStorage.getItem('knownIPs')
      if (savedIPs) {
        knownIPs = JSON.parse(savedIPs)
      }
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
      // 保存到localStorage和Firebase
      localStorage.setItem('knownIPs', JSON.stringify(knownIPs))
      set(ref(db, 'knownIPs'), knownIPs)
    }
    
    // 立即更新唯一访客数
    const uniqueVisitors = knownIPs.length
    const prevStats = loadJSON('siteStats', {
      pageViews: 0,
      uniqueVisitors: uniqueVisitors,
      averageTime: '--:--',
      pageCount: routes[0].children.length,
      startDate: new Date().toISOString().split('T')[0],
      todayViews: 0
    })
    
    const siteStats = {
      ...prevStats,
      uniqueVisitors: uniqueVisitors
    }
    
    // 保存到localStorage
    localStorage.setItem('siteStats', JSON.stringify(siteStats))
    // 保存到Firebase
    set(ref(db, 'siteStats'), siteStats)
    
    // 保存当前IP到localStorage，用于后续快速检查
    localStorage.setItem('currentIP', currentIP)
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
    let trends = loadJSON('trendData', [])
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
    const durationStats = loadJSON('durationStats', { totalSeconds: 0, visits: 0 })
    const avgSeconds = durationStats.visits > 0 ? durationStats.totalSeconds / durationStats.visits : 0
    const avgTime = formatDuration(avgSeconds)

    // 6. 访客统计 - 基于IP地址
    let knownIPs = loadJSON('knownIPs', [])
    if (!Array.isArray(knownIPs)) {
      knownIPs = []
    }
    
    // 确保当前IP已被记录
    const currentIP = localStorage.getItem('currentIP')
    if (currentIP && !knownIPs.includes(currentIP)) {
      knownIPs.push(currentIP)
      localStorage.setItem('knownIPs', JSON.stringify(knownIPs))
      set(ref(db, 'knownIPs'), knownIPs)
    }
    
    // 计算唯一访客数
    const uniqueVisitors = knownIPs.length
    
    const prevStats = loadJSON('siteStats', {
      pageViews: totalTrendViews,
      uniqueVisitors: uniqueVisitors,
      averageTime: avgTime,
      pageCount: routes[0].children.length,
      startDate: todayStr,
      todayViews: todayStats.views
    })

    // 7. 统一的全站统计数据
    const siteStats = {
      pageViews: totalTrendViews,
      uniqueVisitors,
      averageTime: avgTime,
      pageCount: routes[0].children.length,
      startDate: prevStats.startDate || todayStr,
      todayViews: todayStats.views
    }
    saveJSON('siteStats', siteStats)

    // 8. 最近访问记录
    const location = await getVisitorLocation()
    const visit = {
      time: new Date().toLocaleString(),
      page: to.meta && to.meta.title ? to.meta.title : (to.path || '未知页面'),
      duration: '--:--',
      referrer: document.referrer || '直接访问',
      location: location
    }
    let visits = loadJSON('recentVisits', [])
    visits.unshift(visit)
    if (visits.length > 10) visits = visits.slice(0, 10)
    saveJSON('recentVisits', visits)

    // 9. 页面访问排行
    const pageStats = loadJSON('pageStats', {})
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
