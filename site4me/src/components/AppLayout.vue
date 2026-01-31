<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="navbar-container">
        <!-- Logo -->
        <div class="navbar-logo">
          <router-link to="/home">
            <img src="@/assets/mylogo.png" alt="Logo" class="logo-image" />
            <span>OurNote</span>
          </router-link>
        </div>
        
        <!-- 主导航 -->
        <nav class="navbar-nav">
          <router-link to="/home" class="nav-item" active-class="active">首页</router-link>
          <router-link to="/blog" class="nav-item" active-class="active">博客</router-link>
          <router-link to="/music" class="nav-item" active-class="active">音乐站台</router-link>
          <router-link to="/quotes" class="nav-item" active-class="active">幸运曲奇</router-link>
          <router-link to="/vote" class="nav-item" active-class="active">投票广场</router-link>
          
          <!-- 游戏下拉菜单 -->
          <div class="nav-dropdown">
            <div 
              class="nav-item dropdown-toggle" 
              :class="{ active: isHaveFunRoute }"
              @click="toggleDropdown('games')"
            >
              havefun
              <icon-down class="dropdown-arrow" :class="{ open: dropdowns.games }" />
            </div>
            <transition name="dropdown">
              <div v-show="dropdowns.games" class="dropdown-menu">
                <router-link to="/havefun" class="dropdown-item" active-class="active">
                  游戏首页
                </router-link>
                <router-link to="/havefun/lights" class="dropdown-item" active-class="active">
                  熄灯游戏
                </router-link>
                <router-link to="/havefun/cipher" class="dropdown-item" active-class="active">
                  密文游戏
                </router-link>
                <router-link to="/havefun/monty" class="dropdown-item" active-class="active">
                  三门问题
                </router-link>
                <router-link to="/havefun/boring" class="dropdown-item" active-class="active">
                  无聊字符串
                </router-link>
                <router-link to="/havefun/minesweeper" class="dropdown-item" active-class="active">
                  扫雷
                </router-link>
              </div>
            </transition>
          </div>
          
          <!-- 时钟下拉菜单 -->
          <div class="nav-dropdown">
            <div 
              class="nav-item dropdown-toggle"
              @click="toggleDropdown('clock')"
            >
              {{ currentTime }}
              <icon-down class="dropdown-arrow" :class="{ open: dropdowns.clock }" />
            </div>
            <transition name="dropdown">
              <div v-show="dropdowns.clock" class="dropdown-menu clock-dropdown">
                <div class="dropdown-item clock-face">
                  <vue-clock :size="'140px'" :color="'#81D8CF'" :bg="'white'"></vue-clock>
                  <div class="clock-info">
                    <div class="clock-date">{{ currentDate }}</div>
                    <div class="clock-time">{{ currentTime }}</div>
                  </div>
                </div>
                <div class="dropdown-item">
                  <strong>本次访问时长</strong>
                  <span class="session-time">{{ sessionDuration }}</span>
                </div>
              </div>
            </transition>
          </div>
          
          <router-link to="/news" class="nav-item" active-class="active">网站资讯</router-link>
          <router-link to="/updates" class="nav-item" active-class="active">更新动态</router-link>
          <router-link to="/guestbook" class="nav-item" active-class="active">留言板</router-link>
        </nav>
        
        <!-- 移动端菜单按钮 -->
        <div class="navbar-toggle" @click="toggleMobileMenu">
          <icon-menu />
        </div>
      </div>
      
      <!-- 移动端菜单 -->
      <transition name="mobile-menu">
        <div v-show="mobileMenuOpen" class="mobile-menu">
          <router-link to="/home" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">首页</router-link>
          <router-link to="/blog" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">博客</router-link>
          <router-link to="/music" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">音乐站台</router-link>
          <router-link to="/quotes" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">幸运曲奇</router-link>
          <router-link to="/vote" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">投票广场</router-link>
          
          <div class="mobile-nav-dropdown">
            <div 
              class="mobile-nav-item dropdown-toggle" 
              @click="toggleMobileDropdown('games')"
            >
              havefun
              <icon-down class="dropdown-arrow" :class="{ open: mobileDropdowns.games }" />
            </div>
            <div v-show="mobileDropdowns.games" class="mobile-dropdown-menu">
              <router-link to="/havefun" class="mobile-dropdown-item" active-class="active" @click="closeMobileMenu">
                游戏首页
              </router-link>
              <router-link to="/havefun/lights" class="mobile-dropdown-item" active-class="active" @click="closeMobileMenu">
                熄灯游戏
              </router-link>
              <router-link to="/havefun/cipher" class="mobile-dropdown-item" active-class="active" @click="closeMobileMenu">
                密文游戏
              </router-link>
              <router-link to="/havefun/monty" class="mobile-dropdown-item" active-class="active" @click="closeMobileMenu">
                三门问题
              </router-link>
              <router-link to="/havefun/boring" class="mobile-dropdown-item" active-class="active" @click="closeMobileMenu">
                无聊字符串
              </router-link>
              <router-link to="/havefun/minesweeper" class="mobile-dropdown-item" active-class="active" @click="closeMobileMenu">
                扫雷
              </router-link>
            </div>
          </div>
          
          <router-link to="/news" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">网站资讯</router-link>
          <router-link to="/updates" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">更新动态</router-link>
          <router-link to="/guestbook" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">留言板</router-link>
        </div>
      </transition>
    </header>

    <!-- 主内容区 -->
    <main class="main">
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import {Down, Menu} from '@icon-park/vue'
import VueClock from 'vue-clock2'

export default {
  components: {
    IconDown: Down,
    IconMenu: Menu,
    VueClock: VueClock
  },
  data() {
    return {
      dropdowns: {
        games: false,
        clock: false
      },
      mobileMenuOpen: false,
      mobileDropdowns: {
        games: false
      },
      currentTime: '',
      currentDateTime: '',
      currentDate: '',
      currentHour: 0,
      currentMinute: 0,
      currentSecond: 0,
      sessionStartTime: Date.now(),
      sessionDuration: '00:00',
      timeUpdateInterval: null
    }
  },
  computed: {
    isHaveFunRoute() {
      return this.$route.path.startsWith('/havefun')
    },
    // 时钟指针样式
    clockHourStyle() {
      // 正确计算时针角度，考虑分钟的影响
      const angle = (this.currentHour % 12) * 30 + this.currentMinute * 0.5
      return `rotate(${angle}deg)`
    },
    clockMinuteStyle() {
      // 正确计算分针角度
      const angle = this.currentMinute * 6
      return `rotate(${angle}deg)`
    },
    clockSecondStyle() {
      // 正确计算秒针角度
      const angle = this.currentSecond * 6
      return `rotate(${angle}deg)`
    }
  },
  watch: {
    '$route.path': {
      immediate: true,
      handler() {
        // 路由变化时关闭所有下拉菜单
        this.dropdowns.games = false
        this.mobileMenuOpen = false
        this.mobileDropdowns.games = false
      }
    }
  },
  methods: {
    toggleDropdown(key) {
      this.dropdowns[key] = !this.dropdowns[key]
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false
    },
    toggleMobileDropdown(key) {
      this.mobileDropdowns[key] = !this.mobileDropdowns[key]
    },
    // 更新时间
    updateTime() {
      const now = new Date()
      // 格式化时间 HH:MM:SS
      this.currentTime = now.toLocaleTimeString()
      // 格式化日期时间
      this.currentDateTime = now.toLocaleString()
      // 格式化日期
      this.currentDate = now.toLocaleDateString()
      // 更新当前时间的小时、分钟、秒数
      this.currentHour = now.getHours()
      this.currentMinute = now.getMinutes()
      this.currentSecond = now.getSeconds()
      // 更新会话时长
      this.updateSessionDuration()
    },
    // 更新会话时长
    updateSessionDuration() {
      const now = Date.now()
      const durationSeconds = Math.floor((now - this.sessionStartTime) / 1000)
      this.sessionDuration = this.formatDuration(durationSeconds)
    },
    // 格式化时长
    formatDuration(seconds) {
      if (!seconds || seconds < 0) return '00:00'
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      const pad = n => (n < 10 ? `0${n}` : `${n}`)
      return `${pad(mins)}:${pad(secs)}`
    },

  },
  mounted() {
    // 点击外部关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown') && !e.target.closest('.mobile-nav-dropdown')) {
        this.dropdowns.games = false
        this.dropdowns.clock = false
        this.mobileDropdowns.games = false
      }
    })
    
    // 初始化时钟功能
    this.updateTime()
    // 启动时间更新定时器
    this.timeUpdateInterval = setInterval(() => {
      this.updateTime()
    }, 1000)
  },
  beforeUnmount() {
    // 清除定时器
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval)
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* 顶部导航栏 */
.navbar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: saturate(140%) blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

/* Logo */
.navbar-logo a {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 700;
  transition: color 0.2s ease;
}

.navbar-logo a:hover {
  color: #81D8CF;
}

/* Logo图片 */
.logo-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

/* 主导航 */
.navbar-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-item {
  position: relative;
  padding: 10px 16px;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item:hover, .nav-item.active {
  color: #81D8CF;
  background: rgba(129, 216, 207, 0.1);
}

/* 下拉菜单 */
.nav-dropdown {
  position: relative;
}

.dropdown-toggle {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  font-size: 12px;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  overflow: hidden;
  z-index: 101;
}

.dropdown-item {
  display: block;
  padding: 12px 16px;
  text-decoration: none;
  color: #64748b;
  transition: all 0.2s ease;
}

.dropdown-item:hover, .dropdown-item.active {
  color: #81D8CF;
  background: rgba(129, 216, 207, 0.1);
}

/* 时钟下拉菜单样式 */
.clock-dropdown {
  min-width: 250px;
}

.clock-dropdown .dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clock-face {
  flex-direction: column;
  padding: 16px;
  text-align: center;
}

/* 时钟表盘样式 */
.clock-dial {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #81D8CF;
  box-shadow: 0 6px 20px rgba(129, 216, 207, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.clock-dial::before {
  content: '';
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: white;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* 时钟刻度 */
.clock-dial::after {
  content: '';
  position: absolute;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: transparent;
  background-image: radial-gradient(circle, transparent 30%, #e2e8f0 30%, #e2e8f0 32%, transparent 32%),
                    radial-gradient(circle, transparent 48%, #e2e8f0 48%, #e2e8f0 50%, transparent 50%),
                    radial-gradient(circle, transparent 88%, #e2e8f0 88%, #e2e8f0 90%, transparent 90%);
  background-size: 100% 100%, 100% 100%, 100% 100%;
  background-repeat: no-repeat;
  background-position: center center;
}

/* 时钟指针样式 */
.clock-hour {
  position: absolute;
  width: 4px;
  height: 40px;
  background: #1e293b;
  border-radius: 2px;
  transform-origin: bottom center;
  z-index: 1;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.clock-minute {
  position: absolute;
  width: 3px;
  height: 50px;
  background: #475569;
  border-radius: 1.5px;
  transform-origin: bottom center;
  z-index: 2;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.clock-second {
  position: absolute;
  width: 2px;
  height: 55px;
  background: #ef4444;
  border-radius: 1px;
  transform-origin: bottom center;
  z-index: 3;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  animation: tick 1s linear infinite;
}

/* 秒针跳动动画 */
@keyframes tick {
  0% {
    transform-origin: bottom center;
  }
}

.clock-center {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #81D8CF;
  z-index: 4;
  box-shadow: 0 0 4px rgba(129, 216, 207, 0.4);
}

.clock-center::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
}

/* 时钟信息样式 */
.clock-info {
  margin-top: 8px;
}

.clock-date {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 4px;
}

.clock-time {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  font-family: monospace;
}

.session-time {
  font-size: 0.875rem;
  color: #64748b;
  font-family: monospace;
}

/* 移动端菜单 */
.navbar-toggle {
  display: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.navbar-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.mobile-nav-item {
  display: block;
  padding: 16px 20px;
  text-decoration: none;
  color: #64748b;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.mobile-nav-item:hover, .mobile-nav-item.active {
  color: #008C8C;
  background: rgba(0, 140, 140, 0.1);
}

.mobile-nav-dropdown {
  border-bottom: 1px solid #f1f5f9;
}

.mobile-dropdown-menu {
  background: #f8fafc;
}

.mobile-dropdown-item {
  display: block;
  padding: 12px 36px;
  text-decoration: none;
  color: #64748b;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.mobile-dropdown-item:hover, .mobile-dropdown-item.active {
  color: #008C8C;
  background: rgba(0, 140, 140, 0.1);
}

/* 主内容区 */
.main {
  flex: 1;
  background: transparent;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
  min-height: calc(100vh - 60px);
}

/* 动画效果 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-nav {
    display: none;
  }
  
  .navbar-toggle {
    display: block;
  }
  
  .content {
    padding: 24px 16px;
  }
}

@media (min-width: 769px) {
  .mobile-menu {
    display: none !important;
  }
}
</style>