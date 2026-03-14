import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
// firebase utilities will be imported lazily when needed
import analyticsTracker from '@/api/analytics'
import dataManager from '@/api/dataManager' // ensure realtime data from Firebase

// 游戏相关组件采用按需加载以减小首屏包体
const HaveFunIndex = () => import(/* webpackChunkName: "havefun" */ '@/views/HaveFunIndex.vue')
const LightsOutView = () => import(/* webpackChunkName: "havefun" */ '@/views/LightsOutView.vue')
const CipherGameView = () => import(/* webpackChunkName: "havefun" */ '@/views/CipherGameView.vue')
const MontyHallView = () => import(/* webpackChunkName: "havefun" */ '@/views/MontyHallView.vue')
const BoringStringView = () => import(/* webpackChunkName: "havefun" */ '@/views/BoringStringView.vue')
const MinesweeperView = () => import(/* webpackChunkName: "havefun" */ '@/views/MinesweeperView.vue')

// 常规页面也使用懒加载
const HomeView = () => import(/* webpackChunkName: "home" */ '@/views/HomeView.vue')
const BlogView = () => import(/* webpackChunkName: "blog" */ '@/views/BlogView.vue')
const MusicView = () => import(/* webpackChunkName: "music" */ '@/views/MusicView.vue')
const NewsView = () => import(/* webpackChunkName: "news" */ '@/views/NewsView.vue')
const UpdatesView = () => import(/* webpackChunkName: "updates" */ '@/views/UpdatesView.vue')
const GuestbookView = () => import(/* webpackChunkName: "guestbook" */ '@/views/GuestbookView.vue')
const TeleportView = () => import(/* webpackChunkName: "teleport" */ '@/views/TeleportView.vue')
const QuotesView = () => import(/* webpackChunkName: "quotes" */ '@/views/QuotesView.vue')
const VoteView = () => import(/* webpackChunkName: "vote" */ '@/views/VoteView.vue')
const ToolboxView = () => import(/* webpackChunkName: "toolbox" */ '@/views/ToolboxView.vue')

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
      { path: 'teleport', name: 'teleport', component: TeleportView, meta: { title: '传送舱' } },
      { path: 'quotes', name: 'quotes', component: QuotesView, meta: { title: '幸运曲奇' } },
      { path: 'vote', name: 'vote', component: VoteView, meta: { title: '投票广场' } },
      { path: 'toolbox', name: 'toolbox', component: ToolboxView, meta: { title: '小工具箱' } },
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

// helper to lazily load firebase database helpers
async function getFirebase() {
  const mod = await import('@/firebase');
  return { db: mod.db, ref: mod.ref, set: mod.set, get: mod.get };
}

// 统计工具：记录全站访问量、今日访问量、页面访问排行、最近访问和平均访问时长
async function loadJSON(key, fallback) {
  try {
    // 直接从Firebase数据库读取数据
    const { db, ref } = await getFirebase();
    const snapshot = await get(ref(db, key));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return fallback;
  } catch (e) {
    console.error('Load failed:', e);
    return fallback;
  }
}

async function saveJSON(key, value) {
  try {
    // 直接保存到Firebase实时数据库
    const { db, ref, set } = await getFirebase();
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

// 记录页面停留时长的函数 (已迁移到 analyticsTracker)
function recordPageDuration() {
  // 不再在 router 中记录停留时长，由 analyticsTracker 统一处理
  console.log('recordPageDuration in router is disabled, use analyticsTracker instead');
}

// 在路由切换前，通知 analyticsTracker 更新路径
router.beforeEach((to, from, next) => {
  if (from && from.name) {
    // 路由切换时，analyticsTracker 会自动处理页面访问逻辑
    analyticsTracker.updatePagePath(to.path)
  }
  next()
})

// 添加页面可见性变化的监听
if (typeof document !== 'undefined' && document.addEventListener) {
  // 页面可见性变化监听已由 analyticsTracker 处理
}

// 初始化：优先从本地API加载数据，然后同步到Firebase
async function initServerData() {
  try {
    // make sure the shared DataManager is initialized so that realtime listeners
    // are attached early; this ensures every page receives live updates
    await dataManager.init()
    console.log('DataManager initialized from router')
  } catch (e) {
    console.error('Init server data failed:', e)
  }
}

// 初始化访客信息 (已迁移到 analyticsTracker)
async function initVisitorInfo() {
  // 不再在 router 中初始化访客信息，由 analyticsTracker 统一处理
  console.log('initVisitorInfo in router is disabled, use analyticsTracker instead');
}

// 初始化应用数据
async function initApp() {
  try {
    // 先初始化服务器数据
    await initServerData()
    // 然后由 analyticsTracker 处理后续统计
    console.log('App initialization completed')
  } catch (e) {
    console.error('App initialization failed:', e)
  }
}

// 初始化应用
initApp()

export default router
