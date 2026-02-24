import { db, ref, onValue, get, set } from '@/firebase'

class DataManager {
  constructor() {
    this.data = {
      siteStats: {
        pageViews: 0,
        uniqueVisitors: 0,
        averageTime: '--:--',
        pageCount: 0,
        startDate: '2026-01-31',
        todayViews: 0
      },
      recentVisits: [],
      pageStats: {},
      trendData: [],
      durationStats: {
        totalSeconds: 0,
        visits: 0
      },
      knownVisitors: [],
      todayStats: {
        date: new Date().toISOString().split('T')[0],
        views: 0
      }
    }
    this.listeners = []
    this.isInitialized = false
    this.isInitializing = false
  }

  static getInstance() {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  // 初始化数据管理
  async init() {
    if (this.isInitialized || this.isInitializing) return

    this.isInitializing = true
    try {
      // 加载初始数据
      await this.loadInitialData()
      // 设置实时监听
      this.setupRealTimeListeners()
      this.isInitialized = true
      console.log('DataManager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize DataManager:', error)
    } finally {
      this.isInitializing = false
    }
  }

  // 确保数据已经初始化
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init()
    }
    return this.isInitialized
  }

  // 加载初始数据
  async loadInitialData() {
    try {
      // 并行加载所有数据
      const [siteStatsSnapshot, recentVisitsSnapshot, pageStatsSnapshot, trendDataSnapshot, durationStatsSnapshot, knownVisitorsSnapshot, todayStatsSnapshot] = await Promise.all([
        get(ref(db, 'siteStats')),
        get(ref(db, 'recentVisits')),
        get(ref(db, 'pageStats')),
        get(ref(db, 'trendData')),
        get(ref(db, 'durationStats')),
        get(ref(db, 'knownVisitors')),
        get(ref(db, 'todayStats'))
      ])

      // 更新数据
      if (siteStatsSnapshot.exists()) {
        this.data.siteStats = {
          ...this.data.siteStats,
          ...siteStatsSnapshot.val()
        }
      }

      if (recentVisitsSnapshot.exists()) {
        this.data.recentVisits = recentVisitsSnapshot.val()
      }

      if (pageStatsSnapshot.exists()) {
        this.data.pageStats = pageStatsSnapshot.val()
      }

      if (trendDataSnapshot.exists()) {
        this.data.trendData = trendDataSnapshot.val()
      }

      if (durationStatsSnapshot.exists()) {
        this.data.durationStats = durationStatsSnapshot.val()
      }

      if (knownVisitorsSnapshot.exists()) {
        this.data.knownVisitors = knownVisitorsSnapshot.val()
      }

      if (todayStatsSnapshot.exists()) {
        this.data.todayStats = todayStatsSnapshot.val()
      }

      console.log('Initial data loaded successfully')
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  // 设置实时监听
  setupRealTimeListeners() {
    try {
      // 监听站点统计数据变化
      onValue(ref(db, 'siteStats'), (snapshot) => {
        if (snapshot.exists()) {
          this.data.siteStats = {
            ...this.data.siteStats,
            ...snapshot.val()
          }
          console.log('siteStats updated:', this.data.siteStats)
          this.notifyListeners()
        }
      })

      // 监听最近访问记录变化
      onValue(ref(db, 'recentVisits'), (snapshot) => {
        if (snapshot.exists()) {
          this.data.recentVisits = snapshot.val()
          console.log('recentVisits updated:', this.data.recentVisits)
          this.notifyListeners()
        }
      })

      // 监听页面访问统计数据变化
      onValue(ref(db, 'pageStats'), (snapshot) => {
        if (snapshot.exists()) {
          this.data.pageStats = snapshot.val()
          console.log('pageStats updated:', this.data.pageStats)
          this.notifyListeners()
        }
      })

      // 监听访问趋势数据变化
      onValue(ref(db, 'trendData'), (snapshot) => {
        if (snapshot.exists()) {
          this.data.trendData = snapshot.val()
          console.log('trendData updated:', this.data.trendData)
          this.notifyListeners()
        }
      })

      // 监听停留时长统计数据变化
      onValue(ref(db, 'durationStats'), (snapshot) => {
        if (snapshot.exists()) {
          this.data.durationStats = snapshot.val()
          console.log('durationStats updated:', this.data.durationStats)
          this.notifyListeners()
        }
      })

      // 监听已知访客数据变化
      onValue(ref(db, 'knownVisitors'), (snapshot) => {
        if (snapshot.exists()) {
          this.data.knownVisitors = snapshot.val()
          console.log('knownVisitors updated:', this.data.knownVisitors)
          this.notifyListeners()
        }
      })

      // 监听今日统计数据变化
      onValue(ref(db, 'todayStats'), (snapshot) => {
        if (snapshot.exists()) {
          this.data.todayStats = snapshot.val()
          console.log('todayStats updated:', this.data.todayStats)
          this.notifyListeners()
        }
      })

      console.log('Real-time listeners setup successfully')
    } catch (error) {
      console.error('Failed to setup real-time listeners:', error)
    }
  }

  // 获取数据
  getData(key = null) {
    if (key) {
      return this.data[key] || null
    }
    return this.data
  }

  // 更新数据
  async updateData(key, value) {
    try {
      // 先更新本地数据
      this.data[key] = value
      // 然后同步到Firebase
      await set(ref(db, key), value)
      console.log(`Data ${key} updated successfully`)
      this.notifyListeners()
      return true
    } catch (error) {
      console.error(`Failed to update data ${key}:`, error)
      return false
    }
  }

  // 批量更新数据
  async batchUpdateData(updates) {
    try {
      // 准备Firebase更新对象
      const firebaseUpdates = {}
      
      // 先更新本地数据并准备Firebase更新
      Object.keys(updates).forEach(key => {
        this.data[key] = updates[key]
        firebaseUpdates[key] = updates[key]
      })

      // 执行Firebase批量更新
      await set(ref(db), firebaseUpdates)
      console.log('Batch data updated successfully')
      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Failed to batch update data:', error)
      return false
    }
  }

  // 添加监听器
  addListener(callback) {
    this.listeners.push(callback)
    // 立即调用一次，提供当前数据
    callback(this.data)
    
    // 返回取消监听的函数
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.data)
      } catch (error) {
        console.error('Error in listener callback:', error)
      }
    })

    // 使用BroadcastChannel通知其他标签页
    try {
      const broadcastChannel = new BroadcastChannel('ournote-data');
      broadcastChannel.postMessage({ type: 'dataUpdate', data: this.data });
    } catch (e) {
      // 如果浏览器不支持BroadcastChannel，忽略
    }
  }

  // 初始化BroadcastChannel监听
  initBroadcastChannel() {
    try {
      const broadcastChannel = new BroadcastChannel('ournote-data');
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'dataUpdate') {
          // 更新本地数据
          this.data = {
            ...this.data,
            ...event.data.data
          }
          console.log('Data updated from other tab')
          this.notifyListeners()
        }
      };
    } catch (e) {
      // 如果浏览器不支持BroadcastChannel，忽略
    }
  }
}

// 初始化BroadcastChannel监听
const dataManager = DataManager.getInstance()
dataManager.initBroadcastChannel()

export default dataManager