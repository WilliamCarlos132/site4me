<template>
  <div id="app">
    <div class="app-bg" :style="bgStyle"></div>
    <div class="cursor-trail">
      <div
        v-for="(p, index) in trail"
        :key="index"
        class="cursor-dot"
        :style="{
          transform: 'translate3d(' + p.x + 'px,' + p.y + 'px,0)',
          opacity: p.opacity,
          background: p.color
        }"
      ></div>
    </div>
    <router-view />
    <GlobalMusicPlayer />
    <ClickEffects />
  </div>
</template>

<script>
import GlobalMusicPlayer from '@/components/GlobalMusicPlayer.vue'
import ClickEffects from '@/components/ClickEffects.vue'
import analytics from '@/api/analytics'
import { db, ref, onValue } from '@/firebase'

export default {
  name: 'App',
  components: {
    GlobalMusicPlayer,
    ClickEffects
  },
  data() {
    return {
      backgroundUrl: null,
      trail: []
    }
  },
  computed: {
    bgStyle() {
      const url = this.backgroundUrl || `${(process.env.BASE_URL || '/') }theme/hero.jpg`;
      return {
        backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.25), rgba(15, 23, 42, 0.45)), url(${url})`
      }
    }
  },
  mounted() {
    // 首先尝试从 Firebase 加载背景设置
    this.loadBackgroundFromFirebase()

    // 初始化分析器，重试待发送的数据
    setTimeout(() => {
      analytics.retryPendingData()
    }, 2000)

    // 初始化鼠标拖尾点位
    const POINT_COUNT = 19
    // 定义渐变色数组，从近到远
    const colors = [
      'rgba(255, 250, 100,0.95)',
      'rgba(0,255,255,0.9)',
      'rgba(143,188,143,0.85)',
      'rgba(224,255,255, 0.8)',
      'rgba(245,255,250, 0.75)',
      'rgba(0, 128, 64, 0.7)',
      'rgba(255,192,203,0.65)',
      'rgba(255,250,240, 0.6)',
      'rgba(147,112,219, 0.55)',
      'rgba(102, 205, 170, 0.5)',
      'rgba(175,238,238, 0.45)',
      'rgba(129, 216, 207, 0.4)',
      'rgba(175, 225, 0,0.35)',
      'rgba(0, 255, 255, 0.3)',
      'rgba(255,215,0, 0.25)',
      'rgba(1, 132, 127, 0.2)',
      'rgba(60,179,113, 0.15)',
      'rgba(255,250,240, 0.1)',
      'rgba(0,0,0,0.05)'
    ]
    this.trail = Array.from({ length: POINT_COUNT }).map((_, index) => ({
      x: -9999,
      y: -9999,
      opacity: 0,
      color: colors[index]
    }))

    let targetX = -9999
    let targetY = -9999

    const handleMove = (e) => {
      targetX = e.clientX
      targetY = e.clientY
      // 头部点紧贴鼠标
      if (this.trail.length > 0) {
        this.trail[0].x = targetX
        this.trail[0].y = targetY
        this.trail[0].opacity = 1
      }
    }

    this._cursorMoveHandler = handleMove
    window.addEventListener('mousemove', handleMove)

    const animate = () => {
      // 从前一个点向后插值，形成拖尾
      const easedTrail = this.trail.slice()
      for (let i = 1; i < easedTrail.length; i++) {
        const prev = easedTrail[i - 1]
        const curr = easedTrail[i]
        const lerp = 0.2  // 减小值增加拖尾延迟，增大值减少拖尾延迟
        curr.x += (prev.x - curr.x) * lerp
        curr.y += (prev.y - curr.y) * lerp
        curr.opacity = Math.max(0, (1 - i / easedTrail.length))
      }
      this.trail = easedTrail
      this._trailRaf = requestAnimationFrame(animate)
    }
    this._trailRaf = requestAnimationFrame(animate)
  },
  methods: {
    // 从 Firebase 加载背景设置
    loadBackgroundFromFirebase() {
      try {
        const backgroundRef = ref(db, 'backgroundSettings')
        // 使用 onValue 监听实时变化，这样当后台修改背景时，所有访客都会实时看到
        onValue(backgroundRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            if (data && data.path) {
              // 加载选中的背景
              this.loadBackground(data.path)
              console.info('[bg] loaded from Firebase:', data.path)
            }
          } else {
            // 如果 Firebase 中没有设置，使用默认背景
            this.loadDefaultBackground()
          }
        }, (error) => {
          console.warn('[bg] Firebase load failed:', error)
          // 如果加载失败，使用默认背景
          this.loadDefaultBackground()
        })
      } catch (error) {
        console.error('[bg] Firebase initialization failed:', error)
        this.loadDefaultBackground()
      }
    },

    // 加载指定的背景
    loadBackground(url) {
      const img = new Image()
      img.onload = () => {
        this.backgroundUrl = url
        console.info('[bg] loaded successfully:', url)
      }
      img.onerror = () => {
        console.warn('[bg] failed to load:', url)
        this.loadDefaultBackground()
      }
      img.src = url
    },

    // 加载默认背景
    loadDefaultBackground() {
      const candidates = [
        `${(process.env.BASE_URL || '/') }theme/hero.jpg`,
        '/theme/hero.jpg'
      ]
      const tryLoad = (idx) => {
        if (idx >= candidates.length) return
        const url = candidates[idx]
        const img = new Image()
        img.onload = () => {
          this.backgroundUrl = url
          console.info('[bg] loaded default:', url)
        }
        img.onerror = () => {
          console.warn('[bg] failed:', url)
          tryLoad(idx + 1)
        }
        img.src = url
      }
      tryLoad(0)
    }
  },
  beforeDestroy() {
    if (this._cursorMoveHandler) {
      window.removeEventListener('mousemove', this._cursorMoveHandler)
    }
    if (this._trailRaf) {
      cancelAnimationFrame(this._trailRaf)
    }
  }
}
</script>

<style>
/* 全局重置 - 关键！ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #0f172a;
  overflow-x: hidden;
  overflow-y: auto; /* 允许页面滚动 */
  position: relative;
}

#app {
  min-height: 100vh; /* 关键：用 min-height */
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 固定背景层（通过内联样式设置图片 URL） */
.app-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
  filter: saturate(105%);
  pointer-events: none;
}
.cursor-trail {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.cursor-dot {
    position: fixed;
    width: 14px;
    height: 14px;
    margin-left: -7px;  /* 以中心对齐鼠标 */
    margin-top: -7px;
    border-radius: 999px;
    filter: blur(2px);
    mix-blend-mode: screen;
    transition: transform 0.08s linear;
  }
</style>