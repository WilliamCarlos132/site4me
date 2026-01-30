<!-- eslint-disable vue/no-unused-components -->
<template>
  <div class="home-view">
    <!-- 首页横幅 -->
    <section class="hero">
      <div class="hero-content">
        <h1>这是Eryan Mei的个人网站</h1>
        <p>OurNote</p>
        <h4>既然死亡是一切的终点，那更说明人生的意义在于体验</h4>
        <div class="hero-buttons">
          <router-link to="/blog" class="btn btn-primary">浏览博客</router-link>
          <router-link to="/music" class="btn btn-secondary">聆听音乐</router-link>
          <router-link to="/havefun" class="btn btn-accent">探索游戏</router-link>
        </div>
      </div>
    </section>

    <!-- 特色功能 -->
<!--    <section class="features">-->
<!--      <h2>特色功能</h2>-->
<!--      <div class="features-grid">-->
<!--        <div class="feature-card">-->
<!--          <div class="feature-icon">-->
<!--            <icon-edit />-->
<!--          </div>-->
<!--          <h3>博客系统</h3>-->
<!--          <p>记录生活点滴，分享技术心得，支持文章分类和标签管理</p>-->
<!--          <router-link to="/blog" class="btn btn-link">了解更多</router-link>-->
<!--        </div>-->

<!--        <div class="feature-card">-->
<!--          <div class="feature-icon">-->
<!--            <icon-music />-->
<!--          </div>-->
<!--          <h3>音乐站台</h3>-->
<!--          <p>精心收集的音乐合集，支持在线播放和音乐列表管理</p>-->
<!--          <router-link to="/music" class="btn btn-link">聆听音乐</router-link>-->
<!--        </div>-->

<!--        <div class="feature-card">-->
<!--          <div class="feature-icon">-->
<!--            <icon-game />-->
<!--          </div>-->
<!--          <h3>游戏天地</h3>-->
<!--          <p>多种趣味小游戏，包括扫雷、三门问题、熄灯游戏等</p>-->
<!--          <router-link to="/havefun" class="btn btn-link">开始游戏</router-link>-->
<!--        </div>-->

<!--        <div class="feature-card">-->
<!--          <div class="feature-icon">-->
<!--            <icon-chart-line />-->
<!--          </div>-->
<!--          <h3>网站资讯</h3>-->
<!--          <p>实时统计网站访问数据，包括访问量、访问人数等</p>-->
<!--          <router-link to="/news" class="btn btn-link">查看资讯</router-link>-->
<!--        </div>-->
<!--      </div>-->
<!--    </section>-->

<!--    &lt;!&ndash; 最新动态入口 &ndash;&gt;-->
<!--    <section class="latest-updates">-->
<!--      <h2>网站更新动态</h2>-->
<!--      <div class="updates-list">-->
<!--        <div class="update-item">-->
<!--          <div class="update-date">集中查看</div>-->
<!--          <div class="update-content">-->
<!--            <h3>前往查看网站更新记录</h3>-->
<!--            <p>有关功能上线、样式调整和小修小补的说明，会统一整理在「更新动态」页面中，方便日后回顾。</p>-->
<!--            <router-link to="/updates" class="btn btn-primary" style="margin-top: 12px;">-->
<!--              查看更新动态-->
<!--            </router-link>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
<!--    </section>-->

    <!-- 网站统计 -->
    <section class="site-stats">
      <h2>网站统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ stats.pageViews }}</div>
          <div class="stat-label">总访问量</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.uniqueVisitors }}</div>
          <div class="stat-label">访问人数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.averageTime }}</div>
          <div class="stat-label">平均访问时长</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.pageCount }}</div>
          <div class="stat-label">页面数量</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import {Edit, Music, Game, ChartLine} from '@icon-park/vue'

export default {
  components: {
    IconEdit: Edit, // eslint-disable-line vue/no-unused-components
    IconMusic: Music, // eslint-disable-line vue/no-unused-components
    IconGame: Game, // eslint-disable-line vue/no-unused-components
    IconChartLine: ChartLine // eslint-disable-line vue/no-unused-components
  },
  data() {
    return {
      stats: {
        pageViews: 0,
        uniqueVisitors: 0,
        averageTime: '00:00',
        pageCount: 8
      }
    }
  },
  mounted() {
    // 从 localStorage 加载统计数据
    this.loadStats()
    // 更新访问统计
    this.updateStats()
    
    // 延迟执行动画，确保数据加载完成
    setTimeout(() => {
      // 初始化动画效果
      this.initAnimations()
    }, 200)
    
    // 开始实时更新统计数据
    this.startRealTimeUpdates()
  },
  beforeUnmount() {
    // 停止实时更新
    this.stopRealTimeUpdates()
  },
  methods: {
    // 初始化动画效果
    initAnimations() {
      // 首页横幅进入动画
      this.animateHeroSection()
      
      // 网站统计数字增长动画
      this.animateStatsNumbers()
      
      // 按钮交互效果
      this.animateButtons()
    },
    
    // 首页横幅进入动画
    animateHeroSection() {
      // 标题动画
      if (window.anime) {
        window.anime({
          targets: '.hero h1',
          opacity: [0, 1],
          translateY: [-30, 0],
          duration: 1000,
          easing: 'easeOutElastic(1, 0.5)'
        })
        
        // 副标题动画
        window.anime({
          targets: '.hero p',
          opacity: [0, 1],
          translateY: [-20, 0],
          duration: 800,
          delay: 300,
          easing: 'easeOutQuad'
        })
        
        // 按钮容器动画
        window.anime({
          targets: '.hero-buttons',
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 800,
          delay: 600,
          easing: 'easeOutQuad'
        })
        
        // 按钮依次动画
        window.anime({
          targets: '.hero-buttons .btn',
          opacity: [0, 1],
          translateX: [-20, 0],
          duration: 500,
          delay: window.anime.stagger(100),
          easing: 'easeOutQuad'
        })
      }
    },
    
    // 网站统计数字增长动画
    animateStatsNumbers() {
      if (!window.anime) return
      
      // 数字增长动画
      const statNumbers = document.querySelectorAll('.stat-number')
      const statValues = [
        this.stats.pageViews || 0,
        this.stats.uniqueVisitors || 0,
        0, // 平均时长不做数字增长动画
        this.stats.pageCount || 0
      ]
      
      statNumbers.forEach((element, index) => {
        if (index === 2) return
        const target = statValues[index]
        window.anime({
          targets: element,
          innerHTML: [0, target],
          duration: 2000,
          delay: index * 200,
          easing: 'easeOutExpo',
          round: 1,
          update: function(anim) {
            element.textContent = Math.round(anim.animatables[0].target.innerHTML)
          }
        })
      })
    },
    
    // 按钮交互效果
    animateButtons() {
      if (!window.anime) return
      
      const buttons = document.querySelectorAll('.btn')
      buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
          window.anime({
            targets: this,
            scale: [1, 1.05],
            duration: 200,
            easing: 'easeOutQuad'
          })
        })
        
        button.addEventListener('mouseleave', function() {
          window.anime({
            targets: this,
            scale: [1.05, 1],
            duration: 200,
            easing: 'easeOutQuad'
          })
        })
        
        button.addEventListener('click', function() {
          window.anime({
            targets: this,
            scale: [1, 0.95, 1],
            duration: 300,
            easing: 'easeInOutQuad'
          })
        })
      })
    },
    loadStats() {
      const savedStats = localStorage.getItem('siteStats')
      if (savedStats) {
        this.stats = JSON.parse(savedStats)
      }
    },
    updateStats() {
      // 确保加载最新的统计数据
      this.loadStats()
      
      // 强制延迟一下，确保router中的统计逻辑已经执行完成
      setTimeout(() => {
        this.loadStats()
      }, 100)
    },
    // 实时更新统计数据
    startRealTimeUpdates() {
      // 每30秒更新一次统计数据
      this.statsUpdateInterval = setInterval(() => {
        this.loadStats()
      }, 30000)
    },
    // 停止实时更新
    stopRealTimeUpdates() {
      if (this.statsUpdateInterval) {
        clearInterval(this.statsUpdateInterval)
      }
    }
  }
}
</script>

<style scoped>
.home-view {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.16);
  padding: 32px;
  backdrop-filter: saturate(140%) blur(6px);
}

/* 首页横幅 */
.hero {
  background: linear-gradient(135deg, rgba(0, 140, 140, 0.1) 0%, rgba(0, 120, 120, 0.1) 100%);
  border-radius: 12px;
  padding: 80px 40px;
  text-align: center;
  margin-bottom: 48px;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('@/assets/首页插图.png') no-repeat center center;
  background-size: 550px;
  opacity: 0.65;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.hero p {
  font-size: 1.25rem;
  color: #64748b;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: #81D8CF;
  color: white;
}

.btn-primary:hover {
  background: #66c8be;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(129, 216, 207, 0.4);
}

.btn-secondary {
  background: #94a3b8;
  color: white;
}

.btn-secondary:hover {
  background: #64748b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.3);
}

.btn-accent {
  background: #ec4899;
  color: white;
}

.btn-accent:hover {
  background: #db2777;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.btn-link {
  color: #81D8CF;
  background: transparent;
  padding: 8px 16px;
  font-size: 0.875rem;
}

.btn-link:hover {
  text-decoration: underline;
}

/* 特色功能 */
.features {
  margin-bottom: 48px;
}

.features h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 32px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  width: 64px;
  height: 64px;
  background: #81D8CF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 16px rgba(129, 216, 207, 0.3);
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.feature-card p {
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.6;
}

/* 最新动态 */
.latest-updates {
  margin-bottom: 48px;
}

.latest-updates h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 32px;
}

.updates-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.update-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.update-item:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.update-date {
  min-width: 120px;
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
  padding-top: 4px;
}

.update-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.update-content p {
  color: #64748b;
  line-height: 1.6;
}

/* 网站统计 */
.site-stats {
  margin-bottom: 32px;
}

.site-stats h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #008C8C;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero {
    padding: 48px 24px;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 200px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .update-item {
    flex-direction: column;
    gap: 12px;
  }

  .update-date {
    min-width: auto;
    font-size: 0.75rem;
  }
}
</style>
