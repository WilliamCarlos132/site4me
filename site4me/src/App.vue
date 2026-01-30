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
          opacity: p.opacity
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
    const candidates = [
      `${(process.env.BASE_URL || '/') }theme/hero.jpg`,
      '/theme/hero.jpg'
    ];
    const tryLoad = (idx) => {
      if (idx >= candidates.length) return;
      const url = candidates[idx];
      const img = new Image();
      img.onload = () => { this.backgroundUrl = url; console.info('[bg] loaded:', url); };
      img.onerror = () => { console.warn('[bg] failed:', url); tryLoad(idx + 1); };
      img.src = url;
    };
    tryLoad(0);

    // 初始化鼠标拖尾点位
    const POINT_COUNT = 10
    this.trail = Array.from({ length: POINT_COUNT }).map(() => ({
      x: -9999,
      y: -9999,
      opacity: 0
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
        const lerp = 0.25
        curr.x += (prev.x - curr.x) * lerp
        curr.y += (prev.y - curr.y) * lerp
        curr.opacity = Math.max(0, (1 - i / easedTrail.length))
      }
      this.trail = easedTrail
      this._trailRaf = requestAnimationFrame(animate)
    }
    this._trailRaf = requestAnimationFrame(animate)
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
  background: radial-gradient(circle, rgba(248, 250, 252, 0.9), rgba(129, 140, 248, 0.4));
  filter: blur(2px);
  mix-blend-mode: screen;
  transition: transform 0.08s linear;
}
</style>