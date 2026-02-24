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
    '/havefun/minesweeper': '扫雷'
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
    const duration = this.getCurrentDuration()
    if (duration < 1) return // 忽略小于1秒的访问

    try {
      const data = {
        visitorId: this.visitorId,
        pagePath: this.pagePath,
        duration: duration,
        timestamp: Date.now(),
        referrer: document.referrer || 'direct'
      }

      // 发送到后端API，由后端服务器处理数据同步到Firebase的任务
      try {
        const apiUrl = process.env.NODE_ENV === 'production' ? '/api/analytics/pageview' : 'http://localhost:3001/api/analytics/pageview'
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        console.log('Page view sent to API:', data)
        
        // 强制刷新DataManager数据，确保数据实时更新
        setTimeout(() => {
          dataManager.init()
        }, 1000)
      } catch (apiError) {
        console.warn('API request failed:', apiError)
        // 如果API请求失败，尝试直接同步到Firebase作为备选方案
        try {
          // 导入Firebase（动态导入避免初始化问题）
          const { db, ref, get, set } = await import('@/firebase')
          // 先获取现有的最近访问记录
          const recentVisitsRef = ref(db, 'recentVisits')
          const snapshot = await get(recentVisitsRef)
          let recentVisits = []
          if (snapshot.exists()) {
            const data = snapshot.val()
            recentVisits = Array.isArray(data) ? data : []
          }
          // 添加新的访问记录
          const newVisit = {
            time: new Date(data.timestamp).toLocaleString(),
            page: getPageTitleFromPath(data.pagePath),
            duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60).toString().padStart(2, '0')}`,
            referrer: data.referrer,
            visitorId: data.visitorId.substring(0, 8)
          }
          recentVisits.unshift(newVisit)
          // 保持最多30条记录
          if (recentVisits.length > 30) {
            recentVisits = recentVisits.slice(0, 30)
          }
          // 更新Firebase
          await set(recentVisitsRef, recentVisits)
          console.log('Page view synced to Firebase as fallback:', data)
          
          // 强制刷新DataManager数据，确保数据实时更新
          setTimeout(() => {
            dataManager.init()
          }, 1000)
        } catch (firebaseError) {
          console.warn('Firebase sync failed:', firebaseError)
        }
      }

    } catch (error) {
      console.error('Failed to send page view:', error)
    }
  }

  updatePagePath(path) {
    this.sendPageView()
    this.pagePath = path
    this.pageEnterTime = Date.now()
    this.accumulatedDuration = 0
    this.lastHeartbeat = Date.now()
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this.sendPageView()
  }
}

export default AnalyticsTracker.getInstance()