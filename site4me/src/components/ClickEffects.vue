<template>
  <div class="click-effects-container">
    <div
      v-for="effect in effects"
      :key="effect.id"
      class="click-effect"
      :style="{
        left: effect.x + 'px',
        top: effect.y + 'px',
        color: effect.color,
        fontSize: effect.fontSize + 'px',
        opacity: effect.opacity,
        transform: `translate(-50%, -50%) scale(${effect.scale})`
      }"
    >
      {{ effect.text }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClickEffects',
  data() {
    return {
      effects: [],
      nextId: 0,
      words: ['⚓', '😊', '😴', '🌙', '☀️', '🌐', '❄️', '❤️', '🐕', '🪶', '🏛️', '🏟️', '🏜️','🌇','🌆']
    }
  },
  mounted() {
    window.addEventListener('click', this.handleClick)
    this.animate()
  },
  beforeDestroy() {
    window.removeEventListener('click', this.handleClick)
    cancelAnimationFrame(this.animationFrame)
  },
  methods: {
    handleClick(e) {
      const text = this.words[Math.floor(Math.random() * this.words.length)]
      const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8B94', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71']
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      this.effects.push({
        id: this.nextId++,
        x: e.clientX,
        y: e.clientY,
        text: text,
        color: color,
        opacity: 1,
        scale: 0.5,
        fontSize: 16,
        vy: -2 // 向上漂浮速度
      })
    },
    animate() {
      this.effects = this.effects.filter(effect => effect.opacity > 0.05)
      
      this.effects.forEach(effect => {
        effect.y += effect.vy
        effect.opacity -= 0.02
        effect.scale += 0.02
      })
      
      this.animationFrame = requestAnimationFrame(this.animate)
    }
  }
}
</script>

<style scoped>
.click-effects-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99999;
  overflow: hidden;
}

.click-effect {
  position: absolute;
  font-weight: bold;
  user-select: none;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}
</style>
