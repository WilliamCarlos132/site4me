<template>
  <div class="markdown-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button size="small" @click="insertSyntax('bold')" title="粗体">
            <b>B</b>
          </el-button>
          <el-button size="small" @click="insertSyntax('italic')" title="斜体">
            <i>I</i>
          </el-button>
          <el-button size="small" @click="insertSyntax('strikethrough')" title="删除线">
            <s>S</s>
          </el-button>
        </el-button-group>
        <el-button-group>
          <el-button size="small" @click="insertSyntax('heading')" title="标题">
            H
          </el-button>
          <el-button size="small" @click="insertSyntax('link')" title="链接">
            🔗
          </el-button>
          <el-button size="small" @click="insertSyntax('image')" title="图片">
            📷
          </el-button>
          <el-button size="small" @click="insertSyntax('code')" title="代码块">
            ```
          </el-button>
        </el-button-group>
        <el-button-group>
          <el-button size="small" @click="insertSyntax('list')" title="无序列表">
            • List
          </el-button>
          <el-button size="small" @click="insertSyntax('orderedList')" title="有序列表">
            1. List
          </el-button>
          <el-button size="small" @click="insertSyntax('quote')" title="引用">
            "
          </el-button>
        </el-button-group>
      </div>
      <div class="toolbar-right">
        <el-button size="small" @click="copyMarkdown" title="复制 Markdown">
          📋 复制源码
        </el-button>
        <el-button size="small" @click="copyHtml" title="复制 HTML">
          📋 复制 HTML
        </el-button>
        <el-button size="small" type="danger" @click="clearContent" title="清空">
          🗑️ 清空
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-container">
      <!-- 左侧输入区 -->
      <div class="editor-input-wrapper">
        <div class="editor-header">
          <span class="editor-title">Markdown 输入</span>
          <span class="editor-stats">{{ markdownText.length }} 字符</span>
        </div>
        <textarea
          ref="textareaRef"
          v-model="markdownText"
          @input="renderMarkdown"
          @scroll="syncScroll('input')"
          placeholder="请输入 Markdown 内容..."
          class="editor-textarea"
        ></textarea>
        <!-- 语法提示 -->
        <div class="syntax-hints">
          <span class="hint-item" @click="insertSyntax('bold')">**粗体**</span>
          <span class="hint-item" @click="insertSyntax('italic')">*斜体*</span>
          <span class="hint-item" @click="insertSyntax('code')">`代码`</span>
          <span class="hint-item" @click="insertSyntax('link')">[链接]()</span>
          <span class="hint-item" @click="insertSyntax('heading')"># 标题</span>
          <span class="hint-item" @click="insertSyntax('list')">- 列表</span>
          <span class="hint-item" @click="insertSyntax('quote')">> 引用</span>
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="editor-preview-wrapper">
        <div class="editor-header">
          <span class="editor-title">实时预览</span>
          <el-switch
            v-model="isDarkTheme"
            active-text="深色"
            inactive-text="浅色"
            size="small"
          />
        </div>
        <div
          ref="previewRef"
          class="editor-preview"
          :class="{ 'dark-theme': isDarkTheme }"
          @scroll="syncScroll('preview')"
          v-html="htmlText"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// 配置 marked，启用代码高亮
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

export default {
  name: 'MarkdownEditor',
  data() {
    return {
      markdownText: '# Markdown 实时预览编辑器\n\n欢迎使用 **Markdown 编辑器**！\n\n## 功能特性\n\n- 📝 实时预览，所见即所得\n- 🎨 代码高亮支持\n- 📋 一键复制功能\n- 💾 自动保存到本地\n\n## 代码示例\n\n```javascript\n// JavaScript 示例\nfunction hello() {\n  console.log("Hello, Markdown!");\n}\n```\n\n```css\n/* CSS 示例 */\n.editor {\n  background: #f5f5f5;\n  padding: 20px;\n}\n```\n\n## 表格示例\n\n| 功能 | 状态 |\n|------|------|\n| 实时预览 | ✅ |\n| 代码高亮 | ✅ |\n| 滚动同步 | ✅ |\n\n> 💡 **提示**：点击上方工具栏按钮快速插入语法',
      htmlText: '',
      isDarkTheme: false,
      isScrolling: false,
      scrollTimer: null
    }
  },
  mounted() {
    this.renderMarkdown()
    // 从本地存储恢复内容
    const savedText = localStorage.getItem('markdownEditorContent')
    if (savedText) {
      this.markdownText = savedText
      this.renderMarkdown()
    }
  },
  methods: {
    renderMarkdown() {
      this.htmlText = marked(this.markdownText)
      // 保存到本地存储
      localStorage.setItem('markdownEditorContent', this.markdownText)
    },
    
    // 滚动同步
    syncScroll(source) {
      if (this.isScrolling) return
      
      this.isScrolling = true
      clearTimeout(this.scrollTimer)
      
      const textarea = this.$refs.textareaRef
      const preview = this.$refs.previewRef
      
      if (source === 'input') {
        const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
        preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight)
      } else {
        const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
        textarea.scrollTop = scrollPercentage * (textarea.scrollHeight - textarea.clientHeight)
      }
      
      this.scrollTimer = setTimeout(() => {
        this.isScrolling = false
      }, 50)
    },
    
    // 插入语法
    insertSyntax(type) {
      const textarea = this.$refs.textareaRef
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = this.markdownText.substring(start, end)
      
      const syntaxMap = {
        bold: { prefix: '**', suffix: '**', placeholder: '粗体文字' },
        italic: { prefix: '*', suffix: '*', placeholder: '斜体文字' },
        strikethrough: { prefix: '~~', suffix: '~~', placeholder: '删除线文字' },
        heading: { prefix: '## ', suffix: '', placeholder: '标题' },
        link: { prefix: '[', suffix: '](https://example.com)', placeholder: '链接文字' },
        image: { prefix: '![', suffix: '](https://example.com/image.png)', placeholder: '图片描述' },
        code: { prefix: '```\n', suffix: '\n```', placeholder: '代码内容' },
        list: { prefix: '- ', suffix: '', placeholder: '列表项' },
        orderedList: { prefix: '1. ', suffix: '', placeholder: '列表项' },
        quote: { prefix: '> ', suffix: '', placeholder: '引用内容' }
      }
      
      const syntax = syntaxMap[type]
      const textToInsert = selectedText || syntax.placeholder
      const newText = syntax.prefix + textToInsert + syntax.suffix
      
      this.markdownText = this.markdownText.substring(0, start) + newText + this.markdownText.substring(end)
      
      this.$nextTick(() => {
        textarea.focus()
        const newCursorPos = start + syntax.prefix.length + textToInsert.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        this.renderMarkdown()
      })
    },
    
    // 复制 Markdown
    copyMarkdown() {
      navigator.clipboard.writeText(this.markdownText).then(() => {
        this.$message.success('Markdown 源码已复制！')
      }).catch(() => {
        this.$message.error('复制失败，请手动复制')
      })
    },
    
    // 复制 HTML
    copyHtml() {
      navigator.clipboard.writeText(this.htmlText).then(() => {
        this.$message.success('HTML 已复制！')
      }).catch(() => {
        this.$message.error('复制失败，请手动复制')
      })
    },
    
    // 清空内容
    clearContent() {
      this.$confirm('确定要清空所有内容吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.markdownText = ''
        this.renderMarkdown()
        localStorage.removeItem('markdownEditorContent')
        this.$message.success('内容已清空！')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  overflow: hidden;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

/* 编辑器主体 */
.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-input-wrapper,
.editor-preview-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-input-wrapper {
  border-right: 1px solid rgba(148, 163, 184, 0.25);
}

/* 编辑器头部 */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.4);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.editor-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #cbd5f5;
}

.editor-stats {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* 输入区 */
.editor-textarea {
  flex: 1;
  width: 100%;
  padding: 16px;
  border: none;
  outline: none;
  resize: none;
  background: rgba(15, 23, 42, 0.2);
  color: #f8fafc;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-y: auto;
}

.editor-textarea::placeholder {
  color: #64748b;
}

/* 语法提示 */
.syntax-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.4);
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.hint-item {
  font-size: 0.75rem;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.15);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.hint-item:hover {
  background: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

/* 预览区 */
.editor-preview {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #ffffff;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.6;
}

.editor-preview.dark-theme {
  background: #1e1e1e;
  color: #d4d4d4;
}

/* Markdown 样式 */
.editor-preview :deep(h1),
.editor-preview :deep(h2),
.editor-preview :deep(h3),
.editor-preview :deep(h4),
.editor-preview :deep(h5),
.editor-preview :deep(h6) {
  margin-top: 16px;
  margin-bottom: 12px;
  font-weight: 600;
  line-height: 1.25;
}

.editor-preview :deep(h1) { font-size: 1.5em; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
.editor-preview :deep(h2) { font-size: 1.3em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
.editor-preview :deep(h3) { font-size: 1.15em; }

.editor-preview.dark-theme :deep(h1),
.editor-preview.dark-theme :deep(h2) {
  border-color: #404040;
}

.editor-preview :deep(p) {
  margin-bottom: 12px;
}

.editor-preview :deep(strong) {
  font-weight: 600;
}

.editor-preview :deep(em) {
  font-style: italic;
}

.editor-preview :deep(del) {
  text-decoration: line-through;
}

.editor-preview :deep(code) {
  background: rgba(148, 163, 184, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.editor-preview.dark-theme :deep(code) {
  background: rgba(255, 255, 255, 0.1);
}

.editor-preview :deep(pre) {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.editor-preview.dark-theme :deep(pre) {
  background: #2d2d2d;
}

.editor-preview :deep(pre code) {
  background: none;
  padding: 0;
}

.editor-preview :deep(blockquote) {
  border-left: 4px solid #38bdf8;
  padding-left: 16px;
  margin: 16px 0;
  color: #64748b;
}

.editor-preview.dark-theme :deep(blockquote) {
  color: #a0a0a0;
}

.editor-preview :deep(ul),
.editor-preview :deep(ol) {
  margin-bottom: 12px;
  padding-left: 24px;
}

.editor-preview :deep(li) {
  margin-bottom: 4px;
}

.editor-preview :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.editor-preview :deep(a:hover) {
  text-decoration: underline;
}

.editor-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.editor-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.editor-preview :deep(th),
.editor-preview :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  text-align: left;
}

.editor-preview :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
}

.editor-preview.dark-theme :deep(th),
.editor-preview.dark-theme :deep(td) {
  border-color: #404040;
}

.editor-preview.dark-theme :deep(th) {
  background: #2d2d2d;
}

.editor-preview :deep(hr) {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 16px 0;
}

.editor-preview.dark-theme :deep(hr) {
  border-color: #404040;
}

.editor-preview :deep(input[type="checkbox"]) {
  margin-right: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
  }
  
  .editor-input-wrapper {
    border-right: none;
    border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  }
  
  .editor-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
}
</style>
