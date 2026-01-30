<template>
  <div class="boring-string">
    <section class="hero">
      <div class="hero-content">
        <h2>无聊字符串</h2>
        <p class="subtitle">海珊瑚基地出品 · 2025.4.25</p>
        <p>
          这是一个字符动画效果程序，可以逐字符显示文本，支持两种模式：经典模式（逐个字符显示）和最新版（所有字符同时递增）。
        </p>
      </div>
    </section>

    <section class="main-panel card">
      <div class="mode-selector">
        <el-radio-group v-model="mode" size="medium" @change="resetAnimation">
          <el-radio-button :label="1">经典模式</el-radio-button>
          <el-radio-button :label="2">最新版</el-radio-button>
          <el-radio-button :label="3">改进版（随机跳动）</el-radio-button>
        </el-radio-group>
      </div>

      <div class="option-section">
        <el-checkbox v-model="singleLine" @change="resetAnimation">
          单行输出（清屏效果）
        </el-checkbox>
        <span class="option-hint">关闭后为逐行输出（每次更新追加新行）</span>
      </div>

      <div class="input-section">
        <label class="input-label">请输入一个英文语句</label>
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="3"
          placeholder="输入文本..."
          class="text-input"
        />
      </div>

      <div class="action-section">
        <el-button type="primary" size="medium" @click="startAnimation" :disabled="!inputText.trim() || isAnimating">
          {{ isAnimating ? '动画中...' : '开始动画' }}
        </el-button>
        <el-button size="medium" @click="stopAnimation" :disabled="!isAnimating">停止</el-button>
        <el-button size="medium" @click="clearAll">清空</el-button>
      </div>

      <div class="output-section">
        <div class="output-label">输出：</div>
        <div ref="outputArea" class="output-area" :class="{ 'single-line': singleLine, 'multi-line': !singleLine }">
          {{ displayText }}
        </div>
      </div>
    </section>

    <section class="tips card">
      <h3>使用说明</h3>
      <ul>
        <li><strong>经典模式</strong>：逐个字符显示，每个字符从 'A' 开始递增到目标字符。</li>
        <li><strong>最新版</strong>：所有字符同时从 'A' 开始递增，直到所有字符都达到目标。</li>
        <li><strong>改进版（随机跳动）</strong>：所有字符先随机跳动，然后逐渐收敛形成目标字符串，视觉效果更丰富。</li>
        <li><strong>单行输出</strong>：开启后，每次更新会替换之前的内容（类似清屏效果）。关闭后为逐行输出，每次更新会追加新行，可以看到完整的动画过程。</li>
        <li>支持英文字母、空格和常见标点符号（逗号、引号、问号、句号、感叹号）。</li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {
  name: 'BoringStringView',
  data() {
    return {
      mode: 1, // 1: 经典模式, 2: 最新版, 3: 改进版
      singleLine: false,
      inputText: '',
      displayText: '',
      displayLines: [], // 用于逐行输出
      isAnimating: false,
      animationTimer: null,
      currentIndex: 0,
      currentChars: [],
      targetChars: [],
      completedFlags: []
    }
  },
  beforeDestroy() {
    this.stopAnimation()
  },
  methods: {
    // 字符转 ASCII
    ctoa(c) {
      return c.charCodeAt(0)
    },
    // ASCII 转字符
    atoc(code) {
      return String.fromCharCode(code)
    },
    // 检查是否为特殊标点符号
    check(char) {
      return [',', "'", '?', '.', '!'].includes(char)
    },
    // 更新显示内容（支持单行和逐行输出）
    updateDisplay(text) {
      if (this.singleLine) {
        // 单行输出：替换内容
        this.displayText = text
      } else {
        // 逐行输出：追加新行
        this.displayLines.push(text)
        this.displayText = this.displayLines.join('\n')
        // 自动滚动到底部
        this.$nextTick(() => {
          const outputArea = this.$refs.outputArea
          if (outputArea) {
            outputArea.scrollTop = outputArea.scrollHeight
          }
        })
      }
    },
    // 获取随机字符（A-z 范围内）
    getRandomChar() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      return chars[Math.floor(Math.random() * chars.length)]
    },
    // 经典模式：逐个字符输出
    async outputClassic(accumulated, char) {
      if (this.check(char)) {
        // 特殊标点符号：显示所有字母后显示标点
        for (let i = 'A'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
          this.updateDisplay(accumulated + this.atoc(i))
          await this.sleep(10)
        }
        this.updateDisplay(accumulated + char)
        return accumulated + char
      }
      if (char === ' ') {
        this.updateDisplay(accumulated + ' ')
        return accumulated + ' '
      }
      // 普通字符：从 'A' 递增到目标字符
      const targetCode = this.ctoa(char)
      for (let i = 'A'.charCodeAt(0); i <= targetCode; i++) {
        this.updateDisplay(accumulated + this.atoc(i))
        await this.sleep(10)
      }
      return accumulated + char
    },
    // 最新版模式：所有字符同时递增
    async outputLatest(chars) {
      const targetChars = chars
      const completedFlags = new Array(chars.length).fill(true)
      
      // 从 'A' 到 'z' 逐个字符尝试
      for (let i = 'A'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
        const char = this.atoc(i)
        const currentChars = []
        let allCompleted = true
        
        // 构建当前显示的字符串
        for (let j = 0; j < targetChars.length; j++) {
          if (targetChars[j] === ' ') {
            // 空格直接显示
            currentChars.push(' ')
          } else if (completedFlags[j]) {
            // 未完成的字符显示当前遍历的字符
            if (char === targetChars[j]) {
              // 匹配到目标字符，显示目标字符并标记为完成
              currentChars.push(targetChars[j])
              completedFlags[j] = false
            } else {
              // 未匹配，显示当前遍历的字符
              currentChars.push(char)
            }
            allCompleted = false
          } else {
            // 已完成的字符显示目标字符
            currentChars.push(targetChars[j])
          }
        }
        
        // 显示当前状态
        this.updateDisplay(currentChars.join(''))
        await this.sleep(10)
        
        // 如果所有字符都完成了，退出
        if (allCompleted) {
          break
        }
      }
      
      // 确保最终显示正确
      this.updateDisplay(targetChars.join(''))
    },
    // 改进版模式：随机跳动后形成目标字符串
    async outputEnhanced(chars) {
      const targetChars = chars
      const currentChars = new Array(chars.length)
      const completedFlags = new Array(chars.length).fill(false)
      
      // 初始化：所有字符随机跳动
      for (let i = 0; i < chars.length; i++) {
        if (targetChars[i] === ' ') {
          currentChars[i] = ' '
          completedFlags[i] = true
        } else {
          currentChars[i] = this.getRandomChar()
        }
      }
      
      // 随机跳动阶段（约 50-100 次，让字符充分随机）
      const randomPhaseCount = 50 + Math.floor(Math.random() * 50)
      for (let phase = 0; phase < randomPhaseCount; phase++) {
        // 随机更新未完成的字符
        for (let i = 0; i < chars.length; i++) {
          if (!completedFlags[i]) {
            // 有一定概率保持当前字符，增加视觉美感
            if (Math.random() > 0.3) {
              currentChars[i] = this.getRandomChar()
            }
          }
        }
        this.updateDisplay(currentChars.join(''))
        await this.sleep(15) // 稍微慢一点，让跳动更明显
      }
      
      // 逐渐收敛到目标字符
      let allCompleted = false
      let convergencePhase = 0
      const maxConvergencePhases = 200 // 最多收敛阶段
      
      while (!allCompleted && convergencePhase < maxConvergencePhases) {
        allCompleted = true
        
        for (let i = 0; i < targetChars.length; i++) {
          if (!completedFlags[i]) {
            const currentCode = this.ctoa(currentChars[i])
            const targetCode = this.ctoa(targetChars[i])
            
            if (currentCode === targetCode) {
              // 已匹配，标记为完成
              completedFlags[i] = true
              currentChars[i] = targetChars[i]
            } else {
              // 未匹配，逐渐接近目标字符
              allCompleted = false
              
              // 使用概率性收敛，增加美感
              if (Math.random() < 0.7) {
                // 70% 概率向目标字符靠近
                if (currentCode < targetCode) {
                  currentChars[i] = this.atoc(currentCode + 1)
                } else if (currentCode > targetCode) {
                  currentChars[i] = this.atoc(currentCode - 1)
                }
              } else {
                // 30% 概率随机跳动（增加视觉趣味）
                currentChars[i] = this.getRandomChar()
              }
            }
          }
        }
        
        this.updateDisplay(currentChars.join(''))
        await this.sleep(20) // 收敛阶段稍慢
        convergencePhase++
      }
      
      // 确保最终显示正确
      for (let i = 0; i < targetChars.length; i++) {
        currentChars[i] = targetChars[i]
      }
      this.updateDisplay(currentChars.join(''))
    },
    // 延迟函数
    sleep(ms) {
      return new Promise(resolve => {
        this.animationTimer = setTimeout(resolve, ms)
      })
    },
    // 开始动画
    async startAnimation() {
      if (!this.inputText.trim()) return
      
      this.stopAnimation()
      this.isAnimating = true
      this.displayText = ''
      this.displayLines = []
      
      const text = this.inputText
      const chars = text.split('')
      
      try {
        if (this.mode === 1) {
          // 经典模式
          let accumulated = ''
          for (let i = 0; i < chars.length; i++) {
            if (!this.isAnimating) break
            accumulated = await this.outputClassic(accumulated, chars[i])
          }
        } else if (this.mode === 2) {
          // 最新版模式
          await this.outputLatest(chars)
        } else if (this.mode === 3) {
          // 改进版模式
          await this.outputEnhanced(chars)
        }
      } catch (err) {
        console.error('动画错误:', err)
      } finally {
        this.isAnimating = false
      }
    },
    // 停止动画
    stopAnimation() {
      if (this.animationTimer) {
        clearTimeout(this.animationTimer)
        this.animationTimer = null
      }
      this.isAnimating = false
    },
    // 重置动画
    resetAnimation() {
      this.stopAnimation()
      this.displayText = ''
      this.displayLines = []
    },
    // 清空所有
    clearAll() {
      this.stopAnimation()
      this.inputText = ''
      this.displayText = ''
      this.displayLines = []
    }
  }
}
</script>

<style scoped>
.boring-string {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
}

.hero-content h2 {
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: #f8fafc;
}

.subtitle {
  margin-bottom: 12px;
  font-weight: 500;
  color: #cbd5f5;
}

.card {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mode-selector {
  display: flex;
  justify-content: center;
}

.option-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.option-hint {
  font-size: 0.9rem;
  color: #94a3b8;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-weight: 500;
  color: #e2e8f0;
}

.text-input {
  width: 100%;
}

.action-section {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.output-section {
  margin-top: 16px;
}

.output-label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #e2e8f0;
}

.output-area {
  min-height: 120px;
  max-height: 400px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  color: #facc15;
  line-height: 1.6;
  overflow-y: auto;
}

.output-area.single-line {
  white-space: nowrap;
  overflow: hidden;
  max-height: 120px;
}

.output-area.multi-line {
  white-space: pre-wrap;
  word-break: break-all;
}

.tips h3 {
  margin-bottom: 12px;
  color: #f8fafc;
}

.tips ul {
  padding-left: 20px;
  line-height: 1.8;
}

.tips li {
  margin-bottom: 8px;
}

/* Element UI 样式覆盖 */
::v-deep .el-radio-button__inner {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.3);
}

::v-deep .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

::v-deep .el-checkbox__label {
  color: #e2e8f0;
}

::v-deep .el-textarea__inner,
::v-deep .el-input__inner {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(148, 163, 184, 0.3);
  color: #f8fafc;
}

::v-deep .el-textarea__inner::placeholder,
::v-deep .el-input__inner::placeholder {
  color: #94a3b8;
}
</style>

