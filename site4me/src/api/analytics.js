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
        const apiUrl = process.env.NODE_ENV === 'production' ? '/api/analytics/pageview' : 'http://localhost:3001/api/analytics/pageview'
        // 添加超时设置
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
        console.log('Page view sent to API:', data)
        
        // 发送成功后从本地存储移除
        this.removeFromLocalStorage(data.timestamp)
        
        // 强制刷新DataManager数据，确保数据实时更新
        setTimeout(() => {
          dataManager.init()
        }, 500) // 减少延迟，更快地更新数据
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
          // 尝试获取IP地址
          let clientIp = '访客';
          try {
            // 尝试通过第三方服务获取IP地址
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              clientIp = ipData.ip;
            }
          } catch (ipError) {
            console.warn('Failed to get IP address:', ipError);
          }
          
          // 添加新的访问记录
          const newVisit = {
            time: new Date(data.timestamp).toLocaleString(),
            page: getPageTitleFromPath(data.pagePath),
            duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60).toString().padStart(2, '0')}`,
            referrer: data.referrer,
            visitorId: data.visitorId.substring(0, 8),
            location: clientIp // 添加访客IP地址作为位置信息
          }
          recentVisits.unshift(newVisit)
          // 保持最多30条记录
          if (recentVisits.length > 30) {
            recentVisits = recentVisits.slice(0, 30)
          }
          // 更新Firebase
          await set(recentVisitsRef, recentVisits)
          console.log('Page view synced to Firebase as fallback:', data)
          
          // 发送成功后从本地存储移除
          this.removeFromLocalStorage(data.timestamp)
          
          // 强制刷新DataManager数据，确保数据实时更新
          setTimeout(() => {
            dataManager.init()
          }, 500) // 减少延迟，更快地更新数据
        } catch (firebaseError) {
          console.warn('Firebase sync failed:', firebaseError)
          // 保存到本地存储，稍后重试
          console.log('Saving data to localStorage for later retry')
        }
      }

    } catch (error) {
      console.error('Failed to send page view:', error)
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
  
  // 重试发送本地存储的数据
  async retryPendingData() {
    try {
      const pendingData = JSON.parse(localStorage.getItem('pendingAnalyticsData') || '[]')
      if (pendingData.length === 0) return
      
      console.log('Retrying', pendingData.length, 'pending analytics events')
      
      for (const data of pendingData) {
        try {
          const apiUrl = process.env.NODE_ENV === 'production' ? '/api/analytics/pageview' : 'http://localhost:3001/api/analytics/pageview'
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
          this.removeFromLocalStorage(data.timestamp)
        } catch (apiError) {
          console.warn('Failed to send pending data via API:', apiError)
          // 尝试Firebase
          try {
            const { db, ref, get, set } = await import('@/firebase')
            const recentVisitsRef = ref(db, 'recentVisits')
            const snapshot = await get(recentVisitsRef)
            let recentVisits = []
            if (snapshot.exists()) {
              const dataSnapshot = snapshot.val()
              recentVisits = Array.isArray(dataSnapshot) ? dataSnapshot : []
            }
            
            // 尝试获取IP地址
            let clientIp = '访客';
            try {
              // 尝试通过第三方服务获取IP地址
              const ipResponse = await fetch('https://api.ipify.org?format=json');
              if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                clientIp = ipData.ip;
              }
            } catch (ipError) {
              console.warn('Failed to get IP address:', ipError);
            }
            
            const newVisit = {
              time: new Date(data.timestamp).toLocaleString(),
              page: getPageTitleFromPath(data.pagePath),
              duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60).toString().padStart(2, '0')}`,
              referrer: data.referrer,
              visitorId: data.visitorId.substring(0, 8),
              location: clientIp
            }
            recentVisits.unshift(newVisit)
            if (recentVisits.length > 30) {
              recentVisits = recentVisits.slice(0, 30)
            }
            await set(recentVisitsRef, recentVisits)
            console.log('Pending page view synced to Firebase:', data)
            this.removeFromLocalStorage(data.timestamp)
          } catch (firebaseError) {
            console.warn('Failed to send pending data via Firebase:', firebaseError)
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
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this.sendPageView()
  }
}

export default AnalyticsTracker.getInstance()