import FingerprintJS from '@fingerprintjs/fingerprintjs'

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
      })

      window.addEventListener('beforeunload', () => {
        this.sendPageView()
      })

      window.addEventListener('unload', () => {
        this.sendPageView()
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

      // 同时发送到后端API和Firebase
      // 1. 发送到后端API
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
      } catch (apiError) {
        console.warn('API request failed:', apiError)
      }

      // 2. 同步到Firebase
      try {
        // 导入Firebase（动态导入避免初始化问题）
        const { db, ref, update } = await import('@/firebase')
        // 准备要更新的数据
        const updates = {}
        const visitKey = `recentVisits/${Date.now()}`
        updates[visitKey] = {
          time: new Date(data.timestamp).toLocaleString(),
          page: data.pagePath,
          duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60).toString().padStart(2, '0')}`,
          referrer: data.referrer,
          visitorId: data.visitorId.substring(0, 8)
        }
        // 更新Firebase
        await update(ref(db), updates)
        console.log('Page view synced to Firebase:', data)
      } catch (firebaseError) {
        console.warn('Firebase sync failed:', firebaseError)
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