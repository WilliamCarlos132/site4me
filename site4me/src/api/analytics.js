// FingerprintJS will be loaded dynamically to avoid pulling large library into the main bundle
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
    '/teleport': '传送舱',
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
    this.hasCountedHit = false // 标记当前页面访问是否已计入访问量
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
      // lazy load fingerprint library only when needed
      const { default: FingerprintJS } = await import('@fingerprintjs/fingerprintjs')
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

  async sendPageView(customPath = null, customDuration = null) {
    // ensure analytics system is initialized before sending
    if (!this.visitorId) {
      await this.initFingerprint()
    }
    // 防止同一页面被重复记录
    if (this.pendingSendPageView) {
      console.log('Page view already pending, skipping duplicate send')
      return
    }

    const path = customPath || this.pagePath
    const duration = customDuration !== null ? customDuration : this.getCurrentDuration()
    
    // 只有离开页面或切换时记录，且时长需大于0.5秒
    if (duration < 0.5) {
      console.log('Duration too short, skipping record:', duration)
      return 
    }

    this.pendingSendPageView = true // 标记为待发送中
    const isNewHit = !this.hasCountedHit
    this.hasCountedHit = true // 标记为已计数
    
    try {
      // 访问来源使用原始路由路径，如/news等
      let referrerPath = this.previousPath
      // 如果是'direct'，保持不变
      if (referrerPath === 'direct') {
        referrerPath = '直接访问'
      }
      
      const data = {
        visitorId: this.visitorId,
        pagePath: path,
        duration: duration,
        timestamp: Date.now(),
        referrer: referrerPath,
        port: window.location.port, // 发送当前端口号
        isNewHit: isNewHit // 传递是否为新访问
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
            console.log('Sending pageview to local API:', apiUrl)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data),
              signal: controller.signal
            })
            clearTimeout(timeoutId)
            
            if (response.ok) {
              console.log('✓ Page view sent to local API successfully')
              sent = true
            }
          } catch (localApiError) {
            console.error('✗ Local API request failed')
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
      const { db, ref, runTransaction, set } = await import('@/firebase')
      
      // 获取IP地址
      const clientIp = await this.getClientIp()
      
      // 统一的时间格式化函数
      const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
      }

      // 准备新访问记录
      const newVisit = {
        time: formatTimestamp(data.timestamp),
        page: getPageTitleFromPath(data.pagePath),
        duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60).toString().padStart(2, '0')}`,
        referrer: data.referrer,
        visitorId: data.visitorId.substring(0, 8),
        location: clientIp
      }

      console.log('Syncing data to Firebase using transactions...')

      // 1. 更新停留时长统计 (durationStats) 并获取最新数据用于计算平均时长
      const durationResult = await runTransaction(ref(db, 'durationStats'), (currentDuration) => {
        if (currentDuration === null) {
          return {
            totalSeconds: data.duration,
            visits: data.isNewHit ? 1 : 0 // 只有新访问才增加访问次数
          }
        }
        const totalSeconds = (currentDuration.totalSeconds || 0) + data.duration
        const visits = (currentDuration.visits || 0) + (data.isNewHit ? 1 : 0)
        return {
          totalSeconds,
          visits
        }
      })

      const newDurationStats = durationResult.snapshot.val()
      const avgSeconds = newDurationStats.visits > 0 ? newDurationStats.totalSeconds / newDurationStats.visits : 0
      const avgMinutes = Math.floor(avgSeconds / 60)
      const avgSecs = Math.floor(avgSeconds % 60)
      const newAverageTime = `${avgMinutes.toString().padStart(2, '0')}:${avgSecs.toString().padStart(2, '0')}`

      // 2. 更新站点统计 (siteStats) 和 3. 处理今日统计 (todayStats)
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const trendLabel = `${today.getMonth() + 1}/${today.getDate()}`
      
      // 1. 获取并更新 IP 列表 (knownIPs)
      const ipResult = await runTransaction(ref(db, 'knownIPs'), (currentIPs) => {
        let ips = currentIPs || []
        if (!Array.isArray(ips)) ips = []
        if (clientIp !== '访客' && !ips.includes(clientIp)) {
          ips.push(clientIp)
        }
        return ips
      })
      
      const updatedIPs = ipResult.snapshot.val() || []
      const currentUVCount = updatedIPs.length

      if (data.isNewHit) {
        await runTransaction(ref(db, 'siteStats'), (currentStats) => {
          if (currentStats === null) {
            return {
              pageViews: 1,
              uniqueVisitors: currentUVCount || 1,
              averageTime: newAverageTime,
              pageCount: 16,
              startDate: '2026-01-31'
              // 注意：todayViews 不再存储在 siteStats 中，只使用 todayStats
            }
          }
          return {
            ...currentStats,
            pageViews: (currentStats.pageViews || 0) + 1,
            // 访问人数始终同步为 knownIPs 列表的长度
            uniqueVisitors: currentUVCount,
            pageCount: 16,
            averageTime: newAverageTime
            // 注意：todayViews 不再存储在 siteStats 中，只使用 todayStats
          }
        })

        // 4. 更新今日统计
        await runTransaction(ref(db, 'todayStats'), (currentToday) => {
          if (currentToday === null || currentToday.date !== todayStr) {
            return {
              date: todayStr,
              views: 1
            }
          }
          return {
            ...currentToday,
            views: (currentToday.views || 0) + 1
          }
        })

        // 5. 更新访问趋势数据 (trendData)
        await runTransaction(ref(db, 'trendData'), (currentTrends) => {
          let trends = currentTrends || []
          let todayItem = trends.find(item => item.date === trendLabel)
          if (!todayItem) {
            todayItem = { date: trendLabel, views: 1 }
            trends.push(todayItem)
          } else {
            todayItem.views += 1
          }
          return trends
        })

        // 6. 更新页面统计 (pageStats)
        const safePagePath = data.pagePath.replace(/\//g, '_') || 'root'
        await runTransaction(ref(db, `pageStats/${safePagePath}`), (currentPage) => {
          if (currentPage === null) {
            return {
              name: getPageTitleFromPath(data.pagePath),
              path: data.pagePath || '/',
              views: 1
            }
          }
          return {
            ...currentPage,
            views: (currentPage.views || 0) + 1
          }
        })
      } else {
        // 如果不是新访问，只更新平均时间
        await runTransaction(ref(db, 'siteStats'), (currentStats) => {
          if (currentStats === null) return null
          return {
            ...currentStats,
            averageTime: newAverageTime
          }
        })
      }

      // 7. 更新最近访问记录 (recentVisits) - 总是更新以反映最新时长
      await runTransaction(ref(db, 'recentVisits'), (currentVisits) => {
        let records = []
        if (currentVisits === null) {
          records = [newVisit]
        } else if (Array.isArray(currentVisits)) {
          // 如果是数组格式，先检查是否已有该访客在同一页面的记录
          records = [...currentVisits]
          // 移除旧记录并插入新记录，或者直接插入
          records.unshift(newVisit)
        } else if (typeof currentVisits === 'object') {
          // 处理对象格式 {0: visit, 1: visit, ...}
          const sortedRecords = Object.entries(currentVisits)
            .map(([key, value]) => ({ ...value, _key: key }))
            .sort((a, b) => parseInt(a._key) - parseInt(b._key))
          
          records = [newVisit, ...sortedRecords]
        }
        
        // 只保留最近30条，并转为对象格式以确保索引稳定
        const top30 = records.slice(0, 30)
        const result = {}
        top30.forEach((record, index) => {
          const { _key, ...cleanRecord } = record
          result[index] = cleanRecord
        })
        return result
      })

      // 8. 更新已知访客 (knownVisitors)
      await set(ref(db, `knownVisitors/${data.visitorId}`), true)

      console.log('✓ All data synced to Firebase using transactions')
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
    if (this.pagePath === path) return
    
    // 捕获当前页面的状态
    const oldPath = this.pagePath
    const duration = this.getCurrentDuration()
    
    // 发送当前页面的数据
    this.sendPageView(oldPath, duration)
    
    // 重置为新页面状态
    this.previousPath = oldPath
    this.pagePath = path
    this.pageEnterTime = Date.now()
    this.accumulatedDuration = 0
    this.lastHeartbeat = Date.now()
    this.hasCountedHit = false // 新页面重置计数标记
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