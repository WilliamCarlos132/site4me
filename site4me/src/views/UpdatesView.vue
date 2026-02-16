<template>
  <div class="updates-view">
    <div class="updates-header">
      <h1>网站更新动态</h1>
      <p>记录这个小站一步步长大的过程。</p>
    </div>

    <section class="updates-timeline">
      <div v-if="updates.length" class="timeline-container">
        <!-- 时间线连接线 -->
        <div class="timeline-line"></div>
        
        <div class="timeline-list">
          <div
            v-for="(item, index) in updates"
            :key="index"
            class="timeline-item"
            :class="{ 'expanded': expandedItem === index }"
            @click="toggleExpand(index)"
          >
            <!-- 时间线圆点 -->
            <div class="timeline-dot"></div>
            
            <div class="timeline-date">
              {{ item.date }}
            </div>
            <div class="timeline-content">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <!-- 展开内容 -->
              <div class="expand-content" v-show="expandedItem === index">
                <div v-if="item.tags && item.tags.length" class="tags">
                  <span
                    v-for="tag in item.tags"
                    :key="tag"
                    class="tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              <!-- 展开/收起指示器 -->
              <div class="expand-indicator">
                <span class="indicator-icon" :class="{ 'rotated': expandedItem === index }">▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>目前还没有公开记录的更新条目。</p>
        <p>后续有比较重要的功能上线或改版时，会在这里留下简短的说明。</p>
      </div>
    </section>
  </div>
</template>

<script>
import { db, ref, set, onValue } from '@/firebase'

export default {
  name: 'UpdatesView',
  data() {
    return {
      updates: [
        {
          date:'2026-02-16',
          title:'加入加载动画，页面访问数据问题修复',
          description:'在数据完全加载之前加载动画，修复页面访问数据仅显示最近10条的问题',
          tags: ['数据同步'],
          affectedPages: ['首页','网站资讯']
        },
        {
          date: '2026-01-31',
          title: '解决了一些bug',
          description: '解决了音乐站台默认音乐无法直接播放的问题，优化了游戏排行榜',
          tags: ['优化', '数据同步'],
          affectedPages: ['havefun','音乐站台']
        },
        {
          date: '2026-01-31',
          title: '实现数据同步与部署',
          description: '借助FireBase实现数据同步，使用域名部署',
          tags: ['数据同步','部署'],
          affectedPages:['博客', '音乐站台','首页','网站资讯','更新动态']
        },
        {
          date: '2026-01-30',
          title: '基本完成个人网站搭建',
          description: '对个人网站进行了完善，购买了域名',
          tags: ['域名'],
          affectedPages:null
        },
        {
          date: '2026-01-29',
          title: '音乐播放器特效升级',
          description: '为音乐播放器添加了音频频谱可视化、音量滑块颜色变化、播放/暂停按钮动画等多种特效，提升用户体验。',
          tags: ['音乐播放器', '动画特效', '用户体验'],
          affectedPages: ['音乐站台']
        },
        {
          date: '2026-01-27',
          title: '首页交互效果优化',
          description: '为首页添加了页面加载动画、按钮交互效果和统计数字增长动画。',
          tags: ['首页', '交互效果', '动画'],
          affectedPages: ['首页']
        },
        {
          date: '2026-01-26',
          title: '音乐站台功能完善',
          description: '完成了音乐站台的基本功能，包括音乐列表、播放控制、音量调节等，支持多种播放模式。',
          tags: ['音乐播放器', '功能完善'],
          affectedPages: ['音乐站台']
        },
        {
          date: '2026-01-25',
          title: '网站基本框架搭建',
          description: '在以前写的ournote1.0基础上，搭建了网站的基本框架，包括首页、博客、音乐站台、havefun等页面的路由和布局。',
          tags: ['网站框架', '路由', '布局'],
          affectedPages: ['首页', '博客', '音乐站台', 'havefun']
        }
      ],
      expandedItem: null,
      isInitialLoad: true, // 首次加载标志
      forceSync: false // 强制同步标志
    }
  },
  created() {
    // 初始化Firebase数据监听
    this.initFirebaseListeners()
    // 初始化默认更新数据
    this.initDefaultUpdates()
  },
  mounted() {
    // 初始化动画效果
    this.initAnimations()
    
    // 添加滚动监听
    this.addScrollListeners()
  },
  beforeUnmount() {
    // 移除滚动监听
    window.removeEventListener('scroll', this.handleScroll)
  },
  methods: {
    // 初始化Firebase数据监听
    initFirebaseListeners() {
      try {
        // 监听更新动态数据变化
        onValue(ref(db, 'updates'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 首次加载时才从Firebase更新，避免本地修改被覆盖
            if (this.isInitialLoad) {
              this.updates = data
              this.isInitialLoad = false
            }
          }
        })
      } catch (e) {
        console.error('Firebase listener error:', e)
        this.isInitialLoad = false
      }
    },
    
    // 初始化默认更新数据
    async initDefaultUpdates() {
      try {
        // 无论Firebase中是否已有更新数据，都将本地代码中的默认更新同步到Firebase
        // 这样确保本地代码的修改能够覆盖Firebase中的数据
        await set(ref(db, 'updates'), this.updates)
        console.log('本地更新动态数据已成功同步到Firebase')
      } catch (e) {
        console.error('Init default updates failed:', e)
      }
    },
    
    // 保存更新数据到Firebase
    saveUpdates() {
      try {
        set(ref(db, 'updates'), this.updates)
      } catch (e) {
        console.error('Save updates failed:', e)
      }
    },
    
    // 强制同步本地数据到Firebase
    forceSyncData() {
      try {
        this.forceSync = true
        // 保存本地数据到Firebase
        set(ref(db, 'updates'), this.updates)
        console.log('本地更新动态数据已强制同步到Firebase')
        alert('本地更新动态数据已成功同步到Firebase，所有访客将看到更新后的内容')
      } catch (e) {
        console.error('Force sync data failed:', e)
        alert('同步失败，请稍后重试')
      }
    },
    

    
    // 切换展开/收起状态
    toggleExpand(index) {
      if (this.expandedItem === index) {
        this.expandedItem = null
      } else {
        this.expandedItem = index
        // 添加增强的展开动画
        this.enhancedExpandAnimation(index)
      }
    },
    
    // 初始化动画效果
    initAnimations() {
      // 页面标题进入动画
      this.animateHeader()
      
      // 时间线连接线动画
      this.animateTimelineLine()
      
      // 时间线项目进入动画
      this.animateTimelineItems()
      
      // 标签交互效果
      this.animateTags()
      
      // 时间线圆点动画
      this.animateTimelineDots()
      
      // 展开指示器动画
      this.animateExpandIndicators()
      
      // 页面背景动画
      this.animateBackground()
    },
    
    // 页面标题进入动画
    animateHeader() {
      if (!window.anime) return
      
      // 标题动画
      window.anime({
        targets: '.updates-header h1',
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 1000,
        easing: 'easeOutElastic(1, 0.5)'
      })
      
      // 描述动画
      window.anime({
        targets: '.updates-header p',
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
        delay: 300,
        easing: 'easeOutQuad'
      })
    },
    
    // 时间线连接线动画
    animateTimelineLine() {
      if (!window.anime) return
      
      const timelineLine = document.querySelector('.timeline-line')
      if (!timelineLine) return
      
      // 设置初始状态
      timelineLine.style.height = '0'
      timelineLine.style.opacity = '0'
      
      // 连接线动画
      setTimeout(() => {
        window.anime({
          targets: timelineLine,
          height: ['0', '100%'],
          opacity: [0, 1],
          duration: 1500,
          delay: 500,
          easing: 'easeOutQuart'
        })
      }, 300)
    },
    
    // 时间线项目进入动画
    animateTimelineItems() {
      if (!window.anime) return
      
      const timelineItems = document.querySelectorAll('.timeline-item')
      if (!timelineItems.length) return
      
      // 只对初始视口中的项目添加进入动画
      const windowHeight = window.innerHeight
      const initialItems = []
      const scrollItems = []
      
      timelineItems.forEach(item => {
        const itemTop = item.getBoundingClientRect().top
        if (itemTop < windowHeight * 1.5) {
          initialItems.push(item)
        } else {
          scrollItems.push(item)
          // 为视口外的项目设置初始状态
          item.style.opacity = '0'
          item.style.transform = 'translateY(30px)'
        }
      })
      
      // 为初始视口中的项目添加依次进入的动画
      if (initialItems.length) {
        window.anime({
          targets: initialItems,
          opacity: [0, 1],
          translateX: [-50, 0],
          duration: 800,
          delay: window.anime.stagger(200, { start: 500 }),
          easing: 'easeOutQuad',
          complete: function() {
            // 为初始动画完成的项目添加animated类
            initialItems.forEach(item => {
              item.classList.add('animated')
            })
          }
        })
      }
    },
    
    // 时间线圆点动画
    animateTimelineDots() {
      if (!window.anime) return
      
      const dots = document.querySelectorAll('.timeline-dot')
      if (!dots.length) return
      
      // 圆点脉冲动画
      dots.forEach((dot, index) => {
        setTimeout(() => {
          window.anime({
            targets: dot,
            scale: [0, 1, 1.2, 1],
            opacity: [0, 1],
            duration: 1000,
            delay: index * 200,
            easing: 'easeOutElastic(1, 0.5)'
          })
        }, 500)
      })
    },
    
    // 展开动画
    animateExpand(index) {
      if (!window.anime) return
      
      const item = document.querySelectorAll('.timeline-item')[index]
      if (!item) return
      
      window.anime({
        targets: item,
        scale: [1, 1.02, 1],
        duration: 300,
        easing: 'easeOutQuad'
      })
    },
    
    // 标签交互效果
    animateTags() {
      if (!window.anime) return
      
      const tags = document.querySelectorAll('.tag')
      tags.forEach(tag => {
        tag.addEventListener('mouseenter', function() {
          window.anime({
            targets: this,
            scale: [1, 1.05],
            backgroundColor: ['#eef2ff', '#ddd6fe'],
            duration: 200,
            easing: 'easeOutQuad'
          })
        })
        
        tag.addEventListener('mouseleave', function() {
          window.anime({
            targets: this,
            scale: [1.05, 1],
            backgroundColor: ['#ddd6fe', '#eef2ff'],
            duration: 200,
            easing: 'easeOutQuad'
          })
        })
      })
    },
    
    // 添加滚动监听
    addScrollListeners() {
      window.addEventListener('scroll', this.handleScroll)
    },
    
    // 处理滚动事件
    handleScroll() {
      // 滚动时的视差效果
      this.parallaxEffect()
      
      // 滚动触发的动画
      this.scrollTriggeredAnimations()
    },
    
    // 视差效果
    parallaxEffect() {
      const scrolled = window.pageYOffset
      const header = document.querySelector('.updates-header')
      if (header) {
        header.style.transform = `translateY(${scrolled * 0.2}px)`
      }
    },
    
    // 滚动触发的动画
    scrollTriggeredAnimations() {
      const items = document.querySelectorAll('.timeline-item')
      const windowHeight = window.innerHeight
      
      items.forEach(item => {
        const itemTop = item.getBoundingClientRect().top
        // 当项目进入视口85%时触发动画
        if (itemTop < windowHeight * 0.85 && !item.classList.contains('animated')) {
          item.classList.add('animated')
          // 使用Anime.js的基本动画功能
          window.anime({
            targets: item,
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            easing: 'easeOutQuad'
          })
        }
      })
    },
    
    // 展开指示器动画
    animateExpandIndicators() {
      if (!window.anime) return
      
      const indicators = document.querySelectorAll('.expand-indicator')
      indicators.forEach((indicator, index) => {
        setTimeout(() => {
          window.anime({
            targets: indicator,
            opacity: [0, 1],
            scale: [0.5, 1],
            duration: 500,
            delay: index * 100,
            easing: 'easeOutElastic(1, 0.5)'
          })
        }, 1000)
      })
    },
    
    // 页面背景动画
    animateBackground() {
      if (!window.anime) return
      
      // 创建背景装饰元素
      this.createBackgroundElements()
      
      // 背景元素动画
      const backgroundElements = document.querySelectorAll('.bg-element')
      backgroundElements.forEach((element, index) => {
        window.anime({
          targets: element,
          opacity: [0, 0.5, 0],
          scale: [0, 1, 1.5],
          translateX: [Math.random() * 100 - 50, Math.random() * 200 - 100],
          translateY: [Math.random() * 100 - 50, Math.random() * 200 - 100],
          duration: Math.random() * 5000 + 5000,
          easing: 'easeInOutSine',
          loop: true,
          delay: index * 1000
        })
      })
    },
    
    // 创建背景装饰元素
    createBackgroundElements() {
      const container = document.querySelector('.updates-view')
      if (!container) return
      
      // 清除现有背景元素
      const existingElements = document.querySelectorAll('.bg-element')
      existingElements.forEach(el => el.remove())
      
      // 创建新的背景元素
      for (let i = 0; i < 5; i++) {
        const element = document.createElement('div')
        element.className = 'bg-element'
        element.style.position = 'absolute'
        element.style.width = `${Math.random() * 100 + 50}px`
        element.style.height = element.style.width
        element.style.borderRadius = '50%'
        element.style.background = `rgba(${Math.random() * 99 + 156}, ${Math.random() * 102 + 154}, ${Math.random() * 241 + 0}, 0.1)`
        element.style.left = `${Math.random() * 100}%`
        element.style.top = `${Math.random() * 100}%`
        element.style.zIndex = '-1'
        container.appendChild(element)
      }
    },
    
    // 增强的展开动画
    enhancedExpandAnimation(index) {
      if (!window.anime) return
      
      const item = document.querySelectorAll('.timeline-item')[index]
      if (!item) return
      
      // 项目缩放动画
      window.anime({
        targets: item,
        scale: [1, 1.02, 1],
        duration: 300,
        easing: 'easeOutQuad'
      })
      
      // 展开内容动画
      const expandContent = item.querySelector('.expand-content')
      if (expandContent) {
        window.anime({
          targets: expandContent,
          opacity: [0, 1],
          height: [0, 'auto'],
          duration: 300,
          easing: 'easeOutQuad'
        })
      }
    }
  }
}
</script>

<style scoped>
.updates-view {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.16);
  padding: 32px;
  backdrop-filter: saturate(140%) blur(6px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 背景装饰元素 */
.bg-element {
  position: absolute;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.1);
  z-index: -1;
  pointer-events: none;
}

.updates-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.updates-header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  position: relative;
}

.updates-header p {
  font-size: 1rem;
  color: #64748b;
  position: relative;
}

.updates-timeline {
  margin-top: 16px;
}

.timeline-container {
  position: relative;
}

/* 时间线连接线 */
.timeline-line {
  position: absolute;
  left: 22px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #81D8CF;
  z-index: 0;
  transition: all 0.3s ease;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.timeline-item {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  border-left: 4px solid #81D8CF;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.timeline-item:hover {
  transform: translateX(8px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.timeline-item.expanded {
  border-left-color: #81D8CF;
  background: #f8faff;
}

/* 时间线圆点 */
.timeline-dot {
  position: absolute;
  left: -9px;
  top: 24px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 3px solid #81D8CF;
  box-shadow: 0 2px 8px rgba(129, 216, 207, 0.3);
  z-index: 2;
  transition: all 0.3s ease;
}

.timeline-item:hover .timeline-dot {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(129, 216, 207, 0.4);
}

.timeline-item.expanded .timeline-dot {
  background: #81D8CF;
  border-color: #66c8be;
}

.timeline-date {
  min-width: 110px;
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
  padding-top: 4px;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
  position: relative;
}

.timeline-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
  transition: color 0.3s ease;
}

.timeline-item:hover .timeline-content h3 {
  color: #81D8CF;
}

.timeline-content p {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 12px;
}

.tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(0, 140, 140, 0.1);
  color: #008C8C;
  font-size: 0.75rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tag:hover {
  transform: translateY(-2px);
}

/* 展开内容 */
.expand-content {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  animation: fadeIn 0.3s ease forwards;
}

/* 展开指示器 */
.expand-indicator {
  position: absolute;
  right: 16px;
  bottom: 16px;
  transition: all 0.3s ease;
}

.indicator-icon {
  font-size: 0.8rem;
  color: #94a3b8;
  transition: all 0.3s ease;
  display: inline-block;
}

.indicator-icon.rotated {
  transform: rotate(180deg);
  color: #81D8CF;
}

/* 时间轴对齐调整 */
.timeline-item {
  padding-left: 28px;
}

.timeline-dot {
  left: 11px;
}

.timeline-line {
  left: 19px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.7;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  margin: 24px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .updates-view {
    padding: 24px 16px;
  }

  .timeline-item {
    flex-direction: column;
    padding-left: 28px;
  }

  .timeline-date {
    min-width: auto;
    font-size: 0.8rem;
    margin-bottom: 8px;
  }

  .timeline-line {
    left: 16px;
  }

  .timeline-dot {
    left: -10px;
  }

  .expand-indicator {
    right: 12px;
    bottom: 12px;
  }
}

/* 动画效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-item.animated {
  animation: fadeInUp 0.8s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

