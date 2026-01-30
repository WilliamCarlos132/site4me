<template>
  <div class="cipher-game">
    <section class="hero">
      <div class="hero-content">
        <h2>文字加密与解密器 1.3版</h2>
        <p class="subtitle">海珊瑚研发基地出品 · 2024.10.10</p>
        <p class="rule">
          输入英语语句和四位数字密码，系统将对其进行加密或解密处理。
          加密后的密文可以用相同密码解密回原文。
        </p>
      </div>
    </section>

    <section class="main-panel">
      <div class="operation-selector">
        <el-radio-group v-model="operation" size="medium">
          <el-radio-button :label="0">加密</el-radio-button>
          <el-radio-button :label="1">解密</el-radio-button>
        </el-radio-group>
      </div>

      <div class="input-section">
        <label class="input-label">
          {{ operation === 0 ? '请输入需要加密的英语语句' : '请输入需要解密的英语密文' }}
        </label>
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="4"
          placeholder="输入文本..."
          class="text-input"
        />
      </div>

      <div class="password-section">
        <label class="input-label">
          {{ operation === 0 ? '请设置由四位数字组成的密码' : '请输入由四位数字组成的密码' }}
        </label>
        <el-input
          v-model="password"
          type="text"
          maxlength="4"
          placeholder="0000"
          class="password-input"
          @input="validatePassword"
        />
        <p v-if="passwordError" class="error-msg">{{ passwordError }}</p>
      </div>

      <div class="action-section">
        <el-button type="primary" size="medium" @click="processText" :disabled="!canProcess">
          {{ operation === 0 ? '加密' : '解密' }}
        </el-button>
        <el-button size="medium" @click="clearAll">清空</el-button>
      </div>

      <div v-if="result" class="result-section">
        <label class="result-label">
          {{ operation === 0 ? '加密密文是：' : '解密结果是：' }}
        </label>
        <div class="result-box">
          {{ result }}
        </div>
        <el-button size="small" @click="copyResult">复制结果</el-button>
      </div>
    </section>

    <section class="tips">
      <h3>使用说明</h3>
      <ul>
        <li>密码必须是四位数字（1000-9999）。</li>
        <li>加密和解密使用相同的密码才能正确还原。</li>
        <li>支持英文字母、空格和常见标点符号（引号、逗号、句号等）。</li>
        <li>特殊字符在加密过程中会保留原样。</li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {
  name: 'CipherGameView',
  data() {
    return {
      operation: 0, // 0: 加密, 1: 解密
      inputText: '',
      password: '',
      passwordError: '',
      result: ''
    }
  },
  computed: {
    canProcess() {
      return this.inputText.trim() && this.password.length === 4 && !this.passwordError
    }
  },
  methods: {
    // 字符转 ASCII 码
    ctoa(c) {
      return c.charCodeAt(0)
    },
    // ASCII 码转字符
    atoc(code) {
      return String.fromCharCode(code)
    },
    // 根据四位数字密码计算编码值（对应 C++ 的 code 函数）
    code(n) {
      let x = n - 3456
      if (x < 0) x *= -1
      const z4 = x % 10
      const z1 = Math.floor(x / 1000)
      let y = z4 * 5 + z1
      if (y < 0) y *= -1
      return y
    },
    // 生成随机数生成器（模拟 C++ 的 mt19937）
    createRandomGen(seed) {
      // 简单的线性同余生成器
      let state = seed
      return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff
        return state
      }
    },
    // 处理字符对（对应 C++ 的 getpair 函数）
    getPair(chars, seed, isDecrypt) {
      const gen = this.createRandomGen(seed)
      const pairs = []
      const specialChars = ['"', "'", ' ', ',', '.', '!', '?', ';']
      
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i]
        
        // 特殊字符直接保留
        if (specialChars.includes(char)) {
          const y = gen()
          pairs.push({ char, offset: y })
          continue
        }
        
        // 普通字符进行加密/解密
        const n = this.ctoa(char)
        const y = gen()
        let x
        
        if (isDecrypt) {
          x = n - y
        } else {
          x = n + y
        }
        
        // 调整到 ASCII 字母范围（65-122）
        while (x > 122) {
          x -= 57
        }
        while (x < 65) {
          x += 57
        }
        
        const encryptedChar = this.atoc(x)
        pairs.push({ char: encryptedChar, offset: y })
      }
      
      return pairs
    },
    // 验证密码格式
    validatePassword() {
      this.passwordError = ''
      if (this.password.length === 0) return
      
      const num = parseInt(this.password, 10)
      if (isNaN(num) || this.password.length !== 4 || num < 1000 || num > 9999) {
        this.passwordError = '密码必须是四位数字（1000-9999）'
      }
    },
    // 处理文本（加密或解密）
    processText() {
      if (!this.canProcess) return
      
      const chars = this.inputText.split('')
      const passwordNum = parseInt(this.password, 10)
      const seed = this.code(passwordNum)
      const isDecrypt = this.operation === 1
      
      const pairs = this.getPair(chars, seed, isDecrypt)
      this.result = pairs.map(p => p.char).join('')
      
      // 显示成功消息
      const msg = isDecrypt ? '解密完成！' : '加密完成！'
      ;(this.$message && this.$message.success && this.$message.success(msg)) || alert(msg)
    },
    // 清空所有内容
    clearAll() {
      this.inputText = ''
      this.password = ''
      this.passwordError = ''
      this.result = ''
    },
    // 复制结果到剪贴板
    copyResult() {
      if (!this.result) return
      
      const textarea = document.createElement('textarea')
      textarea.value = this.result
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        ;(this.$message && this.$message.success && this.$message.success('已复制到剪贴板')) || alert('已复制到剪贴板')
      } catch (err) {
        console.error('复制失败:', err)
      }
      document.body.removeChild(textarea)
    }
  }
}
</script>

<style scoped>
.cipher-game {
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

.rule {
  line-height: 1.6;
  color: #e2e8f0;
}

.main-panel {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.operation-selector {
  display: flex;
  justify-content: center;
}

.input-section,
.password-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-weight: 500;
  color: #e2e8f0;
}

.text-input,
.password-input {
  width: 100%;
}

.password-input {
  max-width: 200px;
}

.error-msg {
  color: #f87171;
  font-size: 0.9rem;
  margin: 0;
}

.action-section {
  display: flex;
  gap: 12px;
}

.result-section {
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
}

.result-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #e2e8f0;
}

.result-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  word-break: break-all;
  color: #facc15;
  min-height: 60px;
  white-space: pre-wrap;
}

.tips {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 16px;
  padding: 20px 24px;
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
  backdrop-filter: blur(8px);
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

