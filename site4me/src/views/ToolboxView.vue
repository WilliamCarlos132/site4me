<template>
  <div class="toolbox-page">
    <section class="welcome-card">
      <h2>🧰 小工具箱</h2>
      <p>一些实用的小工具，方便日常开发和生活</p>
      <div class="quick-links">
        <el-button type="primary" size="small" @click="activeTool = 'color'">
          🎨 颜色转换器
        </el-button>
        <el-button type="primary" size="small" @click="activeTool = 'markdown'">
          📝 Markdown编辑器
        </el-button>
        <el-button type="default" size="small" disabled>
          🔧 更多工具开发中...
        </el-button>
      </div>
    </section>

    <section class="tool-content" v-if="activeTool === 'color'">
      <div class="color-converter">
        <div class="converter-header">
          <h3>🎨 颜色转换器</h3>
          <p>支持 RGB、HEX、HSL 格式互转，实时预览，一键复制</p>
        </div>

        <div class="converter-body">
          <div class="preview-section">
            <div class="color-preview" :style="{ backgroundColor: currentColor }">
              <div class="preview-overlay">
                <div class="checkerboard"></div>
              </div>
              <div class="color-info">
                <span class="color-value">{{ currentColor }}</span>
              </div>
            </div>
            <div class="alpha-preview">
              <div class="alpha-box">
                <div class="alpha-bg white-bg"></div>
                <div class="alpha-color" :style="{ backgroundColor: currentColor }"></div>
                <span class="alpha-label">白底</span>
              </div>
              <div class="alpha-box">
                <div class="alpha-bg black-bg"></div>
                <div class="alpha-color" :style="{ backgroundColor: currentColor }"></div>
                <span class="alpha-label">黑底</span>
              </div>
            </div>
          </div>

          <div class="input-section">
            <div class="input-group">
              <label>RGB / RGBA</label>
              <div class="input-row">
                <input 
                  type="text" 
                  v-model="rgbInput" 
                  @input="handleRGBInput"
                  placeholder="rgb(106, 133, 182) 或 rgba(106, 133, 182, 0.8)"
                />
                <el-button size="small" @click="copyToClipboard(rgbInput)">📋</el-button>
              </div>
            </div>

            <div class="input-group">
              <label>HEX / HEXA</label>
              <div class="input-row">
                <input 
                  type="text" 
                  v-model="hexInput" 
                  @input="handleHexInput"
                  placeholder="#6A85B6 或 #6A85B6CC"
                />
                <el-button size="small" @click="copyToClipboard(hexInput)">📋</el-button>
              </div>
            </div>

            <div class="input-group">
              <label>HSL / HSLA</label>
              <div class="input-row">
                <input 
                  type="text" 
                  v-model="hslInput" 
                  @input="handleHSLInput"
                  placeholder="hsl(216, 30%, 56%) 或 hsla(216, 30%, 56%, 0.8)"
                />
                <el-button size="small" @click="copyToClipboard(hslInput)">📋</el-button>
              </div>
            </div>

            <div class="error-message" v-if="errorMessage">
              {{ errorMessage }}
            </div>
          </div>
        </div>

        <div class="adjustment-section">
          <h4>颜色微调</h4>
          <div class="sliders">
            <div class="slider-group">
              <label>红色 (R): {{ rgb.r }}</label>
              <input type="range" v-model.number="rgb.r" min="0" max="255" @input="updateFromRGB">
              <div class="slider-buttons">
                <el-button size="mini" @click="adjustRGB('r', -1)">-</el-button>
                <el-button size="mini" @click="adjustRGB('r', 1)">+</el-button>
              </div>
            </div>
            <div class="slider-group">
              <label>绿色 (G): {{ rgb.g }}</label>
              <input type="range" v-model.number="rgb.g" min="0" max="255" @input="updateFromRGB">
              <div class="slider-buttons">
                <el-button size="mini" @click="adjustRGB('g', -1)">-</el-button>
                <el-button size="mini" @click="adjustRGB('g', 1)">+</el-button>
              </div>
            </div>
            <div class="slider-group">
              <label>蓝色 (B): {{ rgb.b }}</label>
              <input type="range" v-model.number="rgb.b" min="0" max="255" @input="updateFromRGB">
              <div class="slider-buttons">
                <el-button size="mini" @click="adjustRGB('b', -1)">-</el-button>
                <el-button size="mini" @click="adjustRGB('b', 1)">+</el-button>
              </div>
            </div>
            <div class="slider-group">
              <label>透明度 (A): {{ alpha }}</label>
              <input type="range" v-model.number="alpha" min="0" max="1" step="0.01" @input="updateFromRGB">
              <div class="slider-buttons">
                <el-button size="mini" @click="adjustAlpha(-0.01)">-</el-button>
                <el-button size="mini" @click="adjustAlpha(0.01)">+</el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="preset-section">
          <h4>常用颜色预设</h4>
          <div class="presets">
            <div 
              v-for="preset in presets" 
              :key="preset.name"
              class="preset-color"
              :style="{ backgroundColor: preset.hex }"
              @click="applyPreset(preset)"
              :title="preset.name"
            >
              <span class="preset-name">{{ preset.name }}</span>
            </div>
          </div>
        </div>

        <div class="advanced-section">
          <h4>高级功能</h4>
          <div class="advanced-buttons">
            <el-button @click="generateInverted">生成反色</el-button>
            <el-button @click="generateComplementary">生成互补色</el-button>
          </div>
          <div class="generated-colors" v-if="invertedColor || complementaryColor">
            <div class="generated-color" v-if="invertedColor">
              <label>反色:</label>
              <div class="color-display">
                <div class="color-box" :style="{ backgroundColor: invertedColor }"></div>
                <input type="text" :value="invertedColor" readonly />
                <el-button size="small" @click="copyToClipboard(invertedColor)">📋</el-button>
              </div>
            </div>
            <div class="generated-color" v-if="complementaryColor">
              <label>互补色:</label>
              <div class="color-display">
                <div class="color-box" :style="{ backgroundColor: complementaryColor }"></div>
                <input type="text" :value="complementaryColor" readonly />
                <el-button size="small" @click="copyToClipboard(complementaryColor)">📋</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Markdown编辑器 -->
    <section class="tool-content" v-if="activeTool === 'markdown'">
      <div class="markdown-tool">
        <div class="converter-header">
          <h3>📝 Markdown 实时预览编辑器</h3>
          <p>支持实时预览、代码高亮、滚动同步、一键复制</p>
        </div>
        <MarkdownEditor />
      </div>
    </section>
  </div>
</template>

<script>
import MarkdownEditor from '@/components/MarkdownEditor.vue'

export default {
  name: 'ToolboxView',
  components: {
    MarkdownEditor
  },
  data() {
    return {
      activeTool: 'color',
      rgb: { r: 106, g: 133, b: 182 },
      alpha: 1,
      rgbInput: 'rgb(106, 133, 182)',
      hexInput: '#6A85B6',
      hslInput: 'hsl(216, 30%, 56%)',
      errorMessage: '',
      invertedColor: '',
      complementaryColor: '',
      presets: [
        { name: '莫兰迪蓝', hex: '#6A85B6' },
        { name: '莫兰迪粉', hex: '#E8B4BC' },
        { name: '马卡龙蓝', hex: '#A8D8EA' },
        { name: '马卡龙粉', hex: '#FFB7B2' },
        { name: '前端蓝', hex: '#3B82F6' },
        { name: '成功绿', hex: '#10B981' },
        { name: '警告黄', hex: '#F59E0B' },
        { name: '错误红', hex: '#EF4444' },
        { name: '中性灰', hex: '#6B7280' },
        { name: '深色主题', hex: '#1F2937' }
      ]
    }
  },
  computed: {
    currentColor() {
      if (this.alpha < 1) {
        return `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, ${this.alpha})`
      }
      return `rgb(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b})`
    }
  },
  methods: {
    handleRGBInput() {
      this.errorMessage = ''
      const result = this.parseRGB(this.rgbInput)
      if (result) {
        this.rgb = result.rgb
        this.alpha = result.alpha
        this.updateInputs()
      } else {
        this.errorMessage = '格式错误，请输入如 rgb(106, 133, 182) 或 rgba(106, 133, 182, 0.8) 的格式'
      }
    },

    handleHexInput() {
      this.errorMessage = ''
      const result = this.parseHex(this.hexInput)
      if (result) {
        this.rgb = result.rgb
        this.alpha = result.alpha
        this.updateInputs()
      } else {
        this.errorMessage = '格式错误，请输入如 #6A85B6 或 #6A85B6CC 的格式'
      }
    },

    handleHSLInput() {
      this.errorMessage = ''
      const result = this.parseHSL(this.hslInput)
      if (result) {
        this.rgb = result.rgb
        this.alpha = result.alpha
        this.updateInputs()
      } else {
        this.errorMessage = '格式错误，请输入如 hsl(216, 30%, 56%) 或 hsla(216, 30%, 56%, 0.8) 的格式'
      }
    },

    parseRGB(input) {
      const match = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i)
      if (!match) return null
      
      const r = parseInt(match[1])
      const g = parseInt(match[2])
      const b = parseInt(match[3])
      const a = match[4] ? parseFloat(match[4]) : 1
      
      if (r > 255 || g > 255 || b > 255 || a > 1) {
        return null
      }
      
      return { rgb: { r, g, b }, alpha: a }
    },

    parseHex(input) {
      let hex = input.trim()
      if (!hex.startsWith('#')) {
        hex = '#' + hex
      }
      
      const match = hex.match(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/)
      if (!match) return null
      
      let hexValue = match[1]
      
      if (hexValue.length === 3) {
        hexValue = hexValue.split('').map(c => c + c).join('')
      }
      
      let alpha = 1
      if (hexValue.length === 8) {
        alpha = parseInt(hexValue.slice(6, 8), 16) / 255
        hexValue = hexValue.slice(0, 6)
      }
      
      const r = parseInt(hexValue.slice(0, 2), 16)
      const g = parseInt(hexValue.slice(2, 4), 16)
      const b = parseInt(hexValue.slice(4, 6), 16)
      
      return { rgb: { r, g, b }, alpha }
    },

    parseHSL(input) {
      const match = input.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)/i)
      if (!match) return null
      
      const h = parseInt(match[1])
      const s = parseInt(match[2])
      const l = parseInt(match[3])
      const a = match[4] ? parseFloat(match[4]) : 1
      
      if (h > 360 || s > 100 || l > 100 || a > 1) {
        return null
      }
      
      const rgb = this.hslToRGB(h, s, l)
      return { rgb, alpha: a }
    },

    hslToRGB(h, s, l) {
      h /= 360
      s /= 100
      l /= 100
      
      let r, g, b
      
      if (s === 0) {
        r = g = b = l
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1
          if (t > 1) t -= 1
          if (t < 1/6) return p + (q - p) * 6 * t
          if (t < 1/2) return q
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
          return p
        }
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
      }
      
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      }
    },

    rgbToHSL(r, g, b) {
      r /= 255
      g /= 255
      b /= 255
      
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2
      
      if (max === min) {
        h = s = 0
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        
        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6
            break
          case g:
            h = ((b - r) / d + 2) / 6
            break
          case b:
            h = ((r - g) / d + 4) / 6
            break
        }
      }
      
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      }
    },

    rgbToHex(r, g, b, a = 1) {
      const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase()
      let hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`
      
      if (a < 1) {
        const alphaHex = toHex(Math.round(a * 255))
        hex += alphaHex
      }
      
      return hex
    },

    updateFromRGB() {
      this.updateInputs()
    },

    updateInputs() {
      const { r, g, b } = this.rgb
      
      if (this.alpha < 1) {
        this.rgbInput = `rgba(${r}, ${g}, ${b}, ${this.alpha})`
        this.hexInput = this.rgbToHex(r, g, b, this.alpha)
      } else {
        this.rgbInput = `rgb(${r}, ${g}, ${b})`
        this.hexInput = this.rgbToHex(r, g, b)
      }
      
      const hsl = this.rgbToHSL(r, g, b)
      if (this.alpha < 1) {
        this.hslInput = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${this.alpha})`
      } else {
        this.hslInput = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
      }
      
      this.invertedColor = ''
      this.complementaryColor = ''
    },

    adjustRGB(channel, delta) {
      this.rgb[channel] = Math.max(0, Math.min(255, this.rgb[channel] + delta))
      this.updateFromRGB()
    },

    adjustAlpha(delta) {
      this.alpha = Math.max(0, Math.min(1, parseFloat((this.alpha + delta).toFixed(2))))
      this.updateFromRGB()
    },

    applyPreset(preset) {
      const result = this.parseHex(preset.hex)
      if (result) {
        this.rgb = result.rgb
        this.alpha = result.alpha
        this.updateInputs()
      }
    },

    generateInverted() {
      const inverted = {
        r: 255 - this.rgb.r,
        g: 255 - this.rgb.g,
        b: 255 - this.rgb.b
      }
      this.invertedColor = this.rgbToHex(inverted.r, inverted.g, inverted.b, this.alpha)
    },

    generateComplementary() {
      const hsl = this.rgbToHSL(this.rgb.r, this.rgb.g, this.rgb.b)
      const complementaryH = (hsl.h + 180) % 360
      const complementaryRGB = this.hslToRGB(complementaryH, hsl.s, hsl.l)
      this.complementaryColor = this.rgbToHex(complementaryRGB.r, complementaryRGB.g, complementaryRGB.b, this.alpha)
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.$message.success('复制成功！')
      }).catch(() => {
        this.$message.error('复制失败，请手动复制')
      })
    }
  },
  mounted() {
    this.updateInputs()
  }
}
</script>

<style scoped>
.toolbox-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-card {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
  line-height: 1.7;
}

.quick-links {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.welcome-card h2 {
  font-size: 1.8rem;
  margin-bottom: 12px;
}

.tool-content {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
}

.color-converter {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.converter-header {
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
  padding-bottom: 16px;
}

.converter-header h3 {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.converter-header p {
  color: #cbd5f5;
  font-size: 0.95rem;
}

.converter-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.color-preview {
  position: relative;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(148, 163, 184, 0.35);
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.checkerboard {
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.color-info {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.color-value {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: #fff;
}

.alpha-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.alpha-box {
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
  border: 2px solid rgba(148, 163, 184, 0.35);
  position: relative;
  overflow: hidden;
}

.alpha-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.alpha-color {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
}

.alpha-label {
  position: relative;
  z-index: 3;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.white-bg {
  background: linear-gradient(45deg, #fff 25%, #f0f0f0 25%, #f0f0f0 50%, #fff 50%, #fff 75%, #f0f0f0 75%);
  background-size: 20px 20px;
}

.black-bg {
  background: linear-gradient(45deg, #333 25%, #222 25%, #222 50%, #333 50%, #333 75%, #222 75%);
  background-size: 20px 20px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-weight: 500;
  color: #cbd5f5;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.input-row input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}

.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.9rem;
}

.adjustment-section {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.adjustment-section h4 {
  margin-bottom: 16px;
  color: #cbd5f5;
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-group label {
  font-size: 0.9rem;
  color: #cbd5f5;
  display: flex;
  justify-content: space-between;
}

.slider-group input[type="range"] {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
  outline: none;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #38bdf8;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.slider-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-buttons {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.preset-section {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.preset-section h4 {
  margin-bottom: 16px;
  color: #cbd5f5;
}

.presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.preset-color {
  height: 60px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.preset-color:hover {
  border-color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.preset-name {
  font-size: 0.75rem;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  font-weight: 500;
}

.advanced-section {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.advanced-section h4 {
  margin-bottom: 16px;
  color: #cbd5f5;
}

.advanced-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.generated-colors {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.generated-color {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.generated-color label {
  font-size: 0.9rem;
  color: #cbd5f5;
}

.color-display {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid rgba(148, 163, 184, 0.5);
}

.color-display input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .converter-body {
    grid-template-columns: 1fr;
  }
  
  .color-preview {
    height: 150px;
  }
  
  .presets {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}

/* Markdown编辑器样式 */
.markdown-tool {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.markdown-tool h3 {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.markdown-tool p {
  color: #cbd5f5;
  font-size: 0.95rem;
}
</style>
