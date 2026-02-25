import FingerprintJS from '@fingerprintjs/fingerprintjs'
import dataManager from './dataManager'

// 路径到中文标题的映射
function getPageTitleFromPath(path) {
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
    '/havefun': 'havefun',
    '/havefun/lights': '熄灯游戏',
    '/havefun/cipher': '文字加密与解密器',
    '/havefun/monty': '三门问题',
    '/havefun/boring': '无聊字符串',
    '/havefun/minesweeper': '扫雷',
    'direct': '直接访问'
  }
  return pathTitleMap[path] || path
}

class AnalyticsTracker {
  constructor() {
    this.visitorId = null
    this.pageEnterTime = Date.now()
    this.accumulatedDuration = 0
    this.isVisible = true
    this.heartbeatInterval = null
    this.lastHeartbeat = Date.now()
    this.pagePath = window.location.pathname
    this.previousPath = 'direct' // 初始化为direct，后续会通过updatePagePath更新
    this.pendingSendPageView = false // 防止重复发送同一页面的数据
    this.init()
  }

  static getInstance() {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker()
    }
    return AnalyticsTracker.instance
  }

  async init() {
    await this.initFingerprint()
    this.setupEventListeners()
    this.startHeartbeat()
  }

  async initFingerprint() {
    try {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      this.visitorId = result.visitorId
      console.log('Visitor ID:', this.visitorId)
    } catch (error) {
      console.error('Failed to initialize fingerprint:', error)
      this.visitorId = `fallback_${Date.now()}`
    }
  }

  setupEventListeners() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.handleVisibilityChange()
        // 当页面失去焦点时发送页面访问数据
        if (document.hidden) {
          console.log('Page hidden, sending page view...');
          this.sendPageView();
        }
      })

      window.addEventListener('beforeunload', () => {
        console.log('Before unload, sending page view...');
        this.sendPageView();
      })

      window.addEventListener('unload', () => {
        console.log('Unload, sending page view...');
        this.sendPageView();
      })
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.isVisible = false
      this.accumulatedDuration += Date.now() - this.lastHeartbeat
    } else {
      this.isVisible = true
      this.lastHeartbeat = Date.now()
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isVisible) {
        this.accumulatedDuration += Date.now() - this.lastHeartbeat
        this.lastHeartbeat = Date.now()
      }
    }, 1000)
  }

  getCurrentDuration() {
    let totalDuration = this.accumulatedDuration
    if (this.isVisible) {
      totalDuration += Date.now() - this.lastHeartbeat
    }
    return totalDuration / 1000 // 转换为秒
  }

  async sendPageView() {
    // 防止同一页面被重复记录
    if (this.pendingSendPageView) {
      console.log('Page view already pending, skipping duplicate send')
      return
    }

    const duration = this.getCurrentDuration()
    if (duration <= 0) return // 仅忽略零秒或负数的访问

    this.pendingSendPageView = true // 标记为待发送中
    
    try {
      // 访问来源使用原始路由路径，如/news等
      let referrerPath = this.previousPath
      // 如果是'direct'，保持不变
      if (referrerPath === 'direct') {
        referrerPath = '直接访问'
      }
      
      const data = {
        visitorId: this.visitorId,
        pagePath: this.pagePath,
        duration: duration,
        timestamp: Date.now(),
        referrer: referrerPath,
        port: window.location.port // 发送当前端口号
      }

      // 保存到本地存储，作为备份
      this.saveToLocalStorage(data)

      // 发送到后端API，由后端服务器处理数据同步到Firebase的任务
      try {
        // 优先使用本地API，然后直接同步到Firebase
        let sent = false
        
        // 尝试发送到本地/后端API（本地开发环境）
        if (process.env.NODE_ENV !== 'production') {
          try {
            const apiUrl = 'http://localhost:3001/api/analytics/pageview'
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
            
            await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data),
              signal: controller.signal
            })
            clearTimeout(timeoutId)
            console.log('Page view sent to local API:', data)
            sent = true
          } catch (localApiError) {
            console.warn('Local API request failed:', localApiError)
          }
        }
        
        // 如果本地API失败或在生产环境，直接同步到Firebase
        if (!sent) {
          console.log('Syncing data directly to Firebase...')
          await this.syncToFirebaseDirectly(data)
          sent = true
        }
        
        if (sent) {
          // 发送成功后从本地存储移除
          this.removeFromLocalStorage(data.timestamp)
          
          // 强制刷新DataManager数据，确保数据实时更新
          setTimeout(() => {
            dataManager.init()
          }, 1000)
        }
      } catch (error) {
        console.warn('Failed to sync data:', error)
      }

    } catch (error) {
      console.error('Failed to send page view:', error)
    } finally {
      this.pendingSendPageView = false // 确保标志被重置
    }
  }
  
  // 保存数据到本地存储
  saveToLocalStorage(data) {
    try {
      const pendingData = JSON.parse(localStorage.getItem('pendingAnalyticsData') || '[]')
      pendingData.push(data)
      // 只保留最近10条待发送数据
      if (pendingData.length > 10) {
        pendingData.splice(0, pendingData.length - 10)
      }
      localStorage.setItem('pendingAnalyticsData', JSON.stringify(pendingData))
    } catch (error) {
      console.warn('Failed to save data to localStorage:', error)
    }
  }
  
  // 从本地存储移除数据
  removeFromLocalStorage(timestamp) {
    try {
      const pendingData = JSON.parse(localStorage.getItem('pendingAnalyticsData') || '[]')
      const filteredData = pendingData.filter(item => item.timestamp !== timestamp)
      localStorage.setItem('pendingAnalyticsData', JSON.stringify(filteredData))
    } catch (error) {
      console.warn('Failed to remove data from localStorage:', error)
    }
  }
  
  // 获取客户端 IP 地址（支持多个备用方案）
  async getClientIp() {
    const ipApis = [
      { url: 'https://api.ipify.org?format=json', parser: (r) => r.ip, timeout: 2000 },
      { url: 'https://api64.ipify.org?format=json', parser: (r) => r.ip, timeout: 2000 },
      { url: 'https://api.my-ip.io/ip', parser: (r) => r.trim(), timeout: 2000, isText: true },
      { url: 'https://ip-api.com/json/?fields=query', parser: (r) => r.query, timeout: 2000 },
      { url: 'https://ipapi.co/json/', parser: (r) => r.ip, timeout: 2000 }
    ]

    for (const api of ipApis) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), api.timeout)
        
        const response = await fetch(api.url, { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (response.ok) {
          let data = api.isText ? await response.text() : await response.json()
          let ip = api.parser(data)
          if (ip && ip.trim()) {
            console.log('✓ IP retrieved from', api.url, ':', ip)
            return ip.trim()
          }
        }
      } catch (error) {
        console.warn('✗ Failed to get IP from', api.url)
      }
    }
    
    console.warn('⚠ Could not get IP, using default')
    return '访客'
  }

  // 直接同步到Firebase（用于生产环境或API失败的情况）
  async syncToFirebaseDirectly(data) {
    try {
      // 只有访问时长大于0才记录
      if (data.duration <= 0) {
        console.log('Skipping visit record with zero duration')
        return
      }

      const { db, ref, get, set, update } = await import('@/firebase')
      
      // 获取IP地址
      const clientIp = await this.getClientIp()

      // 准备新访问记录
      const newVisit = {
        time: new Date(data.timestamp).toLocaleString(),
        page: getPageTitleFromPath(data.pagePath),
        duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60).toString().padStart(2, '0')}`,
        referrer: data.referrer,
        visitorId: data.visitorId.substring(0, 8),
        location: clientIp
      }

      // 并行获取所有数据（减少网络延迟）
      const [visitsSnapshot, siteStatsSnapshot, knownVisitorsSnapshot, pageStatsSnapshot, durationStatsSnapshot, todayStatsSnapshot] = await Promise.all([
        get(ref(db, 'recentVisits')),
        get(ref(db, 'siteStats')),
        get(ref(db, 'knownVisitors')),
        get(ref(db, 'pageStats')),
        get(ref(db, 'durationStats')),
        get(ref(db, 'todayStats'))
      ])

      // 处理最近访问记录
      let recentVisits = {}
      if (visitsSnapshot.exists()) {
        const existingData = visitsSnapshot.val()
        if (typeof existingData === 'object' && !Array.isArray(existingData)) {
          const records = Object.entries(existingData)
            .map(([key, value]) => ({ ...value, _key: key }))
          records.unshift(newVisit)
          const top30 = records.slice(0, 30)
          top30.forEach((record, index) => {
            recentVisits[index] = record
          })
        } else if (Array.isArray(existingData)) {
          existingData.unshift(newVisit)
          const top30 = existingData.slice(0, 30)
          top30.forEach((record, index) => {
            recentVisits[index] = record
          })
        }
      } else {
        recentVisits[0] = newVisit
      }

      // 处理站点统计
      let siteStats = {
        pageViews: 0,
        uniqueVisitors: 0,
        averageTime: '--:--',
        pageCount: 0,
        startDate: new Date().toISOString().split('T')[0],
        todayViews: 0
      }
      if (siteStatsSnapshot.exists()) {
        siteStats = { ...siteStats, ...siteStatsSnapshot.val() }
      }
      siteStats.pageViews += 1

      // 处理已知访客和UV计算
      let knownVisitorsCount = 0
      if (knownVisitorsSnapshot.exists()) {
        const visitors = knownVisitorsSnapshot.val()
        knownVisitorsCount = typeof visitors === 'object' ? Object.keys(visitors).length : 1
      }
      siteStats.uniqueVisitors = knownVisitorsCount + 1

      // 处理页面统计
      let pageStats = {}
      if (pageStatsSnapshot.exists()) {
        pageStats = pageStatsSnapshot.val()
      }
      const safePagePath = data.pagePath.replace(/\//g, '_')
      if (!pageStats[safePagePath]) {
        pageStats[safePagePath] = {
          name: data.pagePath,
          path: data.pagePath,
          views: 1
        }
      } else {
        pageStats[safePagePath].views += 1
      }

      // 处理停留时长统计
      let durationStats = {
        totalSeconds: 0,
        visits: 0
      }
      if (durationStatsSnapshot.exists()) {
        durationStats = durationStatsSnapshot.val()
      }
      durationStats.totalSeconds += data.duration
      durationStats.visits += 1

      // 计算平均停留时间
      const avgSeconds = durationStats.visits > 0 ? durationStats.totalSeconds / durationStats.visits : 0
      const avgMinutes = Math.floor(avgSeconds / 60)
      const avgSecs = Math.floor(avgSeconds % 60)
      siteStats.averageTime = `${avgMinutes.toString().padStart(2, '0')}:${avgSecs.toString().padStart(2, '0')}`

      // 处理今日统计
      let todayStats = {
        date: new Date().toISOString().split('T')[0],
        views: 0
      }
      if (todayStatsSnapshot.exists()) {
        todayStats = todayStatsSnapshot.val()
      }
      const today = new Date().toISOString().split('T')[0]
      if (todayStats.date === today) {
        todayStats.views += 1
      } else {
        todayStats.date = today
        todayStats.views = 1
      }

      // 一次性更新所有数据（使用单个 update 调用）
      const rootRef = ref(db)
      await update(rootRef, {
        recentVisits,
        siteStats,
        pageStats,
        durationStats,
        todayStats,
        [`knownVisitors/${data.visitorId}`]: true
      })

      console.log('Data synced to Firebase directly:', data)
    } catch (error) {
      console.error('Failed to sync data to Firebase directly:', error)
      throw error
    }
  }
  
  // 重试发送本地存储的数据
  async retryPendingData() {
    try {
      const pendingData = JSON.parse(localStorage.getItem('pendingAnalyticsData') || '[]')
      if (pendingData.length === 0) return
      
      console.log('Retrying', pendingData.length, 'pending analytics events')
      
      for (const data of pendingData) {
        try {
          // 在生产环境直接使用Firebase
          if (process.env.NODE_ENV === 'production') {
            await this.syncToFirebaseDirectly(data)
          } else {
            // 本地开发环境优先使用本地API
            const apiUrl = 'http://localhost:3001/api/analytics/pageview'
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)
            
            await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data),
              signal: controller.signal
            })
            clearTimeout(timeoutId)
            console.log('Pending page view sent to API:', data)
          }
          this.removeFromLocalStorage(data.timestamp)
        } catch (error) {
          console.warn('Failed to send/sync pending data:', error)
          // 尝试Firebase作为备选
          try {
            await this.syncToFirebaseDirectly(data)
            this.removeFromLocalStorage(data.timestamp)
          } catch (firebaseError) {
            console.warn('Firebase fallback also failed:', firebaseError)
          }
        }
      }
    } catch (error) {
      console.error('Failed to retry pending data:', error)
    }
  }

  updatePagePath(path) {
    this.sendPageView()
    this.previousPath = this.pagePath // 将当前路径设置为前一个路径
    this.pagePath = path
    this.pageEnterTime = Date.now()
    this.accumulatedDuration = 0
    this.lastHeartbeat = Date.now()
    this.pendingSendPageView = false // 重置标志，允许新页面的数据被记录
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this.sendPageView()
  }
}

export default AnalyticsTracker.getInstance()