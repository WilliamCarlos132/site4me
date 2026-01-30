<template>
  <div class="quotes-container">
    <div class="quotes-header">
      <h1>幸运曲奇</h1>
      <p>emmm,这里没有曲奇，但是有幸运字条</p>
      <p>我们都应该成为更棒的人，获取一些建议或鼓励吧</p>
    </div>
    
    <!-- 粒子效果区域 -->
    <div class="particle-container" ref="particleContainer">
      <canvas ref="particleCanvas" class="particle-canvas"></canvas>
      <div class="particle-words">
        <div 
          v-for="(category, index) in categories" 
          :key="category.id"
          class="particle-word" 
          :style="getParticleWordStyle(index)"
          :data-category="category.id"
          :ref="`particleWord${index}`"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </div>
      </div>
    </div>
    
    <!-- 控制按钮 -->
    <div class="control-buttons">
      <button class="btn btn-primary main-btn" @click="jumpQuote" ref="jumpBtn">
        点击获取
      </button>
      <button class="btn btn-secondary" @click="resetParticles" ref="resetBtn">
        重置粒子
      </button>
    </div>
    
    <!-- 格言卡片 -->
    <div class="quote-card" ref="quoteCard" :class="{ active: showQuoteCard }">
      <div class="quote-content" ref="quoteContent">
        <div class="quote-text" ref="quoteText">{{ currentQuote.text }}</div>
        <div class="quote-author" ref="quoteAuthor">{{ currentQuote.author }}</div>
      </div>
      <div class="quote-actions">
        <button class="btn btn-primary" @click="nextQuote" ref="nextBtn">
          下一句
        </button>
        <button class="btn btn-secondary" @click="shareQuote" ref="shareBtn">
          分享
        </button>
      </div>
    </div>
    
    <div class="quote-stats">
      <div class="stat-item">
        <span class="stat-number">{{ quoteCount }}</span>
        <span class="stat-label">颗曲奇</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ viewCount }}</span>
        <span class="stat-label">次浏览</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ favoriteCount }}</span>
        <span class="stat-label">次分享</span>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-undef */
import { db, ref, set, onValue, get } from '@/firebase'

export default {
  name: 'QuotesView',
  data() {
    return {
      categories: [
        { id: 'love', name: 'love', color: '#3498db' },
        { id: 'future', name: 'future', color: '#27ae60' },
        { id: 'brave', name: 'brave', color: '#e74c3c' },
        { id: 'knowledge', name: 'knowledge', color: '#9b59b6' },
        { id: 'time', name: 'time', color: '#f39c12' },
        { id: 'luck', name: 'luck', color: '#1abc9c' },
        { id: 'attitude', name: 'attitude', color: '#e67ea0' },
        { id: 'perseverance', name: 'perseverance', color: '#34495e' }
      ],
      quotes: [],
      currentQuote: {
        text: "坏情绪不能像歌一样分享给他人。",
        author: null,
      },
      selectedCategory: null,
      showQuoteCard: false,
      recentQuotes: [],
      quoteCount: 0,
      viewCount: 0,
      favoriteCount: 0,
      animationDuration: 800,
      // 粒子系统相关
      particles: [],
      particleCount: 200,
      animationId: null,
      canvasWidth: 0,
      canvasHeight: 0,
      particleRadius: 2,
      // 词语动态位置相关
      wordOffsets: [],
      // 同步相关
      isInitialLoad: true, // 首次加载标志
      forceSync: false // 强制同步标志
    }
  },
  created() {
    // 初始化Firebase数据监听
    this.initFirebaseListeners()
    // 初始化默认格言数据（如果没有）
    this.initDefaultQuotes()
    this.loadStats();
    this.updateRecentQuotes();
  },
  mounted() {
    this.animateIn();
    this.incrementViewCount();
    this.initParticles();
  },
  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },
  methods: {
    // 初始化Firebase数据监听
    initFirebaseListeners() {
      try {
        // 监听格言数据变化
        onValue(ref(db, 'quotes'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 首次加载时才从Firebase更新，避免本地修改被覆盖
            if (this.isInitialLoad) {
              this.quotes = data
              this.quoteCount = data.length
            }
          }
        })
        
        // 监听统计数据变化
        onValue(ref(db, 'quotesStats'), (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 首次加载时才从Firebase更新，避免本地修改被覆盖
            if (this.isInitialLoad) {
              this.viewCount = data.viewCount || 0
              this.favoriteCount = data.favoriteCount || 0
            }
          }
        })
      } catch (e) {
        console.error('Firebase listener error:', e)
        this.loadQuotesFromLocalStorage()
        this.loadStats()
        this.isInitialLoad = false
      }
    },
    
    // 初始化默认格言数据
    async initDefaultQuotes() {
      try {
        // 无论Firebase中是否已有格言数据，都将本地代码中的默认格言同步到Firebase
        // 这样确保本地代码的修改能够覆盖Firebase中的数据
        const defaultQuotes = [
          {
            text: "你太过沉着冷静，我都忘了你正在承受痛苦。",
            author: null
          },
          {
            text: "一切都是轻的，但不是无足轻重的。",
            author: "米兰·昆德拉《生命不能承受之轻》"
          },
          {
            text: "二十年后，你会因为没做某些事而失望，而不是因为做过。",
            author: "马克·吐温"
          },
          {
            text: "命运就像一艘行驶在海面上的大船，将你稳稳地托住。你的自由意志，一会儿走到船头，一会儿走到船尾。",
            author: null
          },
          {
            text: "🌼这世界不停开花，何不放进你心里一朵",
            author: null
          },
          {
            text: "未完成的课题会重复出现，直到你选择不再绕路的那刻",
            author: null
          },
          {
            text: "对自己好一点，一定要给自己留点时间。",
            author: null
          },
          {
            text: "事情应当恰当地结束，这在生活中很重要。",
            author: null
          },
          {
            text: "一扇不愿意开的门，一直敲是不礼貌的",
            author: null
          },
          {
            text: "耐心一点，好事多磨",
            author: null
          },
          {
            text: "你不可能去要求一个没有风暴的海洋，那不是海，是泥塘",
            author: "毕淑敏《一个人就是一支骑兵》"
          },
          {
            text: "面面俱到，诸事未了",
            author: null
          },
          {
            text: "只要你还活着，就轻松愉快一些吧。让你的一切都无忧无虑，生命太短暂了，时间使它消亡。",
            author: "刻在泥板上的目前已知世界上最古老的歌的歌词"
          },
          {
            text: "人一旦迷醉于自身的软弱之中，便会一味软弱下去，会在众人的目光下倒在街头，倒在地上，倒在比地面更低的地方。",
            author: "米兰·昆德拉"
          },
          {
            text: "落在一个人生命中的雪，别人不能全部看见。",
            author: null
          }
        ]
        
        this.quotes = defaultQuotes
        this.quoteCount = defaultQuotes.length
        this.saveQuotes()
        console.log('本地格言数据已同步到Firebase')
      } catch (e) {
        console.error('Init default quotes failed:', e)
        this.loadQuotesFromLocalStorage()
        if (this.quotes.length === 0) {
          const defaultQuotes = [
            {
              text: "你太过沉着冷静，我都忘了你正在承受痛苦。",
              author: null
            },
            {
              text: "一切都是轻的，但不是无足轻重的。",
              author: "米兰·昆德拉《生命不能承受之轻》"
            },
            {
              text: "二十年后，你会因为没做某些事而失望，而不是因为做过。",
              author: "马克·吐温"
            },
            {
              text: "命运就像一艘行驶在海面上的大船，将你稳稳地托住。你的自由意志，一会儿走到船头，一会儿走到船尾。",
              author: null
            },
            {
              text: "🌼这世界不停开花，何不放进你心里一朵",
              author: null
            },
            {
              text: "未完成的课题会重复出现，直到你选择不再绕路的那刻",
              author: null
            },
            {
              text: "对自己好一点，一定要给自己留点时间。",
              author: null
            },
            {
              text: "事情应当恰当地结束，这在生活中很重要。",
              author: null
            },
            {
              text: "一扇不愿意开的门，一直敲是不礼貌的",
              author: null
            },
            {
              text: "耐心一点，好事多磨",
              author: null
            },
            {
              text: "你不可能去要求一个没有风暴的海洋，那不是海，是泥塘",
              author: "毕淑敏《一个人就是一支骑兵》"
            },
            {
              text: "面面俱到，诸事未了",
              author: null
            },
            {
              text: "只要你还活着，就轻松愉快一些吧。让你的一切都无忧无虑，生命太短暂了，时间使它消亡。",
              author: "刻在泥板上的目前已知世界上最古老的歌的歌词"
            },
            {
              text: "人一旦迷醉于自身的软弱之中，便会一味软弱下去，会在众人的目光下倒在街头，倒在地上，倒在比地面更低的地方。",
              author: "米兰·昆德拉"
            },
            {
              text: "落在一个人生命中的雪，别人不能全部看见。",
              author: null
            }
          ]
          this.quotes = defaultQuotes
          this.quoteCount = defaultQuotes.length
          this.saveQuotesToLocalStorage()
        }
      }
      // 初始化完成后设置为非首次加载
      this.isInitialLoad = false
    },
    
    // 从localStorage加载格言数据
    loadQuotesFromLocalStorage() {
      const savedQuotes = localStorage.getItem('quotes')
      if (savedQuotes) {
        this.quotes = JSON.parse(savedQuotes)
        this.quoteCount = this.quotes.length
      }
    },
    
    // 保存格言数据到localStorage
    saveQuotesToLocalStorage() {
      localStorage.setItem('quotes', JSON.stringify(this.quotes))
    },
    
    // 保存格言数据到Firebase
    saveQuotes() {
      try {
        set(ref(db, 'quotes'), this.quotes)
        // 同时保存到localStorage作为备份
        this.saveQuotesToLocalStorage()
      } catch (e) {
        console.error('Save quotes failed:', e)
        // 失败时至少保存到localStorage
        this.saveQuotesToLocalStorage()
      }
    },
    
    // 保存统计数据到Firebase
    saveStats() {
      const stats = {
        viewCount: this.viewCount,
        favoriteCount: this.favoriteCount
      };
      try {
        set(ref(db, 'quotesStats'), stats)
        // 同时保存到localStorage作为备份
        localStorage.setItem('quotesStats', JSON.stringify(stats))
      } catch (e) {
        console.error('Save stats failed:', e)
        // 失败时至少保存到localStorage
        localStorage.setItem('quotesStats', JSON.stringify(stats))
      }
    },
    
    // 加载统计数据
    loadStats() {
      try {
        // 先尝试从Firebase加载
        get(ref(db, 'quotesStats')).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            this.viewCount = data.viewCount || 0
            this.favoriteCount = data.favoriteCount || 0
          } else {
            // 从localStorage加载作为备份
            const stats = localStorage.getItem('quotesStats')
            if (stats) {
              const parsedStats = JSON.parse(stats)
              this.viewCount = parsedStats.viewCount || 0
              this.favoriteCount = parsedStats.favoriteCount || 0
            }
          }
        })
      } catch (e) {
        console.error('Load stats failed:', e)
        // 失败时从localStorage加载
        const stats = localStorage.getItem('quotesStats')
        if (stats) {
          const parsedStats = JSON.parse(stats)
          this.viewCount = parsedStats.viewCount || 0
          this.favoriteCount = parsedStats.favoriteCount || 0
        }
      }
    },
    
    // 增加浏览次数
    incrementViewCount() {
      this.viewCount++
      this.saveStats()
    },
    
    // 增加分享次数
    incrementFavoriteCount() {
      this.favoriteCount++
      this.saveStats()
    },
    getCategoryColor(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.color : '#3498db';
    },
    // 初始化粒子系统
    initParticles() {
      const canvas = this.$refs.particleCanvas;
      if (!canvas) return;
      
      const container = this.$refs.particleContainer;
      this.canvasWidth = container.offsetWidth;
      this.canvasHeight = container.offsetHeight;
      
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      
      // 创建粒子
      this.particles = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
          radius: Math.random() * this.particleRadius + 1,
          color: this.getRandomColor(),
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: (Math.random() - 0.5) * 0.8,
          opacity: Math.random() * 0.8 + 0.2
        });
      }
      
      // 初始化词语偏移量
      this.wordOffsets = [];
      for (let i = 0; i < this.categories.length; i++) {
        this.wordOffsets.push({
          offsetX: 0,
          offsetY: 0,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          maxOffset: 20
        });
      }
      
      // 开始动画循环
      this.animateParticles();
    },
    // 获取随机颜色
    getRandomColor() {
      const category = this.categories[Math.floor(Math.random() * this.categories.length)];
      return category.color;
    },
    // 粒子动画循环
    animateParticles() {
      const canvas = this.$refs.particleCanvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      
      // 清空画布
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      // 更新和绘制粒子
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        
        // 更新爆炸粒子的生命周期
        if (particle.isExplosion) {
          particle.life--;
          if (particle.life <= 0) {
            this.particles.splice(i, 1);
            continue;
          }
          // 爆炸粒子减速
          particle.speedX *= 0.98;
          particle.speedY *= 0.98;
          // 爆炸粒子淡出
          particle.opacity = particle.life / 200;
        }
        
        // 更新位置
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // 边界检测
        if (particle.x < 0 || particle.x > this.canvasWidth) {
          particle.speedX = -particle.speedX;
        }
        if (particle.y < 0 || particle.y > this.canvasHeight) {
          particle.speedY = -particle.speedY;
        }
        
        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // 绘制粒子之间的连接线
        for (let j = i + 1; j < this.particles.length; j++) {
          const otherParticle = this.particles[j];
          const distance = Math.sqrt(
            Math.pow(particle.x - otherParticle.x, 2) + 
            Math.pow(particle.y - otherParticle.y, 2)
          );
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = (150 - distance) / 150 * 0.2;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      
      // 更新词语动态位置
      this.updateWordPositions();
      
      // 限制粒子总数，避免性能问题
      if (this.particles.length > this.particleCount + 100) {
        this.particles = this.particles.slice(-(this.particleCount + 100));
      }
      
      // 继续动画循环
      this.animationId = requestAnimationFrame(() => this.animateParticles());
    },
    // 计算粒子效果中词语的位置
    getParticleWordStyle(index) {
      const total = this.categories.length;
      const angle = (index / total) * Math.PI * 2;
      const radius = 180;
      
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      
      const x = Math.cos(angle) * radius + centerX;
      const y = Math.sin(angle) * radius + centerY;
      
      // 添加动态偏移
      const offset = this.wordOffsets[index] || { offsetX: 0, offsetY: 0 };
      const finalX = x + offset.offsetX;
      const finalY = y + offset.offsetY;
      
      const category = this.categories[index];
      
      return {
        position: 'absolute',
        left: `${finalX}px`,
        top: `${finalY}px`,
        color: category.color,
        transform: 'translate(-50%, -50%)',
        zIndex: finalY > centerY ? 1 : 0
      };
    },
    // 选择类别
    selectCategory(categoryId) {
      this.selectedCategory = categoryId;
      this.jumpQuote();
      
      // 选中动画
      anime({
        targets: `.particle-word[data-category="${categoryId}"]`,
        scale: [1, 1.2, 1],
        color: this.getCategoryColor(categoryId),
        textShadow: [`0 0 5px ${this.getCategoryColor(categoryId)}`, `0 0 15px ${this.getCategoryColor(categoryId)}`, `0 0 5px ${this.getCategoryColor(categoryId)}`],
        duration: 500,
        easing: 'easeInOutQuad'
      });
    },
    // 点击按钮跳出格言
    jumpQuote() {
      try {
        // 随机选择一个类别
        const randomCategoryIndex = Math.floor(Math.random() * this.categories.length);
        const selectedCategory = this.categories[randomCategoryIndex].id;
        this.selectedCategory = selectedCategory;
        
        // 显示格言卡片
        this.showQuoteCard = true;
        
        // 粒子爆炸效果
        this.createParticleExplosion();
        
        // 延迟显示格言
        setTimeout(() => {
          this.nextQuote();
        }, 1000);
      } catch (error) {
        console.error('Error in jumpQuote:', error);
        // 确保即使出错也能显示格言
        this.showQuoteCard = true;
        this.nextQuote();
      }
    },
    // 创建粒子爆炸效果
    createParticleExplosion() {
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      
      // 添加爆炸粒子
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        
        this.particles.push({
          x: centerX,
          y: centerY,
          radius: Math.random() * 2 + 1,
          color: this.getCategoryColor(this.selectedCategory),
          speedX: Math.cos(angle) * speed,
          speedY: Math.sin(angle) * speed,
          opacity: Math.random() * 0.8 + 0.2,
          isExplosion: true,
          life: 200
        });
      }
    },
    // 重置粒子
    resetParticles() {
      this.initParticles();
      
      // 重置动画
      anime({
        targets: '.particle-word',
        scale: [1.2, 1],
        opacity: [0.5, 1],
        duration: 500,
        easing: 'easeInOutQuad'
      });
    },
    // 更新词语动态位置
    updateWordPositions() {
      for (let i = 0; i < this.wordOffsets.length; i++) {
        const offset = this.wordOffsets[i];
        
        // 更新偏移量
        offset.offsetX += offset.speedX;
        offset.offsetY += offset.speedY;
        
        // 边界检测，确保词语不会偏离太远
        if (Math.abs(offset.offsetX) > offset.maxOffset) {
          offset.speedX = -offset.speedX;
          offset.offsetX = Math.sign(offset.offsetX) * offset.maxOffset;
        }
        if (Math.abs(offset.offsetY) > offset.maxOffset) {
          offset.speedY = -offset.speedY;
          offset.offsetY = Math.sign(offset.offsetY) * offset.maxOffset;
        }
      }
      
      // 强制Vue重新渲染词语位置
      this.$forceUpdate();
    },
    nextQuote() {
      this.animateOut(() => {
        // 根据选中的类别筛选格言
        const filteredQuotes = this.selectedCategory 
          ? this.quotes.filter(quote => quote.category === this.selectedCategory)
          : this.quotes;
        
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        this.currentQuote = filteredQuotes[randomIndex];
        this.updateRecentQuotes();
        this.animateIn();
      });
    },
    updateRecentQuotes() {
      // 保持最近浏览的5条格言
      const quoteExists = this.recentQuotes.some(q => q.text === this.currentQuote.text);
      if (!quoteExists) {
        this.recentQuotes.unshift({ ...this.currentQuote });
        if (this.recentQuotes.length > 5) {
          this.recentQuotes.pop();
        }
      }
    },
    shareQuote() {
      const quoteText = `${this.currentQuote.text} - ${this.currentQuote.author}`;
      if (navigator.share) {
        navigator.share({
          title: '幸运曲奇',
          text: quoteText
        }).then(() => {
          this.incrementFavoriteCount();
        });
      } else {
        navigator.clipboard.writeText(quoteText).then(() => {
          alert('幸运字条已复制到剪贴板');
          this.incrementFavoriteCount();
        });
      }
    },
    animateIn() {
      // 粒子容器入场动画
      if (this.$refs.particleContainer) {
        anime({
          targets: this.$refs.particleContainer,
          opacity: [0, 1],
          scale: [0.8, 1],
          duration: this.animationDuration,
          easing: 'easeOutElastic(1, 0.5)'
        });
        
        // 粒子词语入场动画
        anime({
          targets: '.particle-word',
          opacity: [0, 1],
          scale: [0, 1],
          duration: this.animationDuration,
          delay: anime.stagger(100),
          easing: 'easeOutElastic(1, 0.5)'
        });
      }
      
      // 按钮入场动画
      anime({
        targets: [this.$refs.jumpBtn, this.$refs.resetBtn],
        opacity: [0, 1],
        translateY: [20, 0],
        duration: this.animationDuration,
        delay: 300,
        stagger: 100
      });
      
      // 卡片入场动画
      if (this.showQuoteCard && this.$refs.quoteCard) {
        anime({
          targets: this.$refs.quoteCard,
          opacity: [0, 1],
          translateY: [50, 0],
          scale: [0.9, 1],
          duration: this.animationDuration,
          easing: 'easeOutElastic(1, 0.5)',
          delay: 500
        });
        
        // 内容入场动画
        anime({
          targets: this.$refs.quoteContent,
          opacity: [0, 1],
          duration: this.animationDuration,
          delay: 700
        });
        
        // 文字渐入动画
        anime({
          targets: this.$refs.quoteText,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: this.animationDuration,
          delay: 800
        });
        
        // 作者渐入动画
        anime({
          targets: this.$refs.quoteAuthor,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: this.animationDuration,
          delay: 1000
        });
        
        // 按钮入场动画
        anime({
          targets: [this.$refs.nextBtn, this.$refs.shareBtn],
          opacity: [0, 1],
          scale: [0.8, 1],
          duration: this.animationDuration,
          delay: 1100,
          stagger: 100
        });
      }
    },
    animateOut(callback) {
      // 卡片退场动画
      if (this.$refs.quoteCard) {
        anime({
          targets: this.$refs.quoteCard,
          opacity: [1, 0],
          translateY: [0, -50],
          scale: [1, 0.9],
          duration: this.animationDuration / 2,
          easing: 'easeInOutQuad',
          complete: callback
        });
      } else {
        callback();
      }
    },
    truncateText(text, maxLength) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    // 强制同步本地数据到Firebase
    forceSyncData() {
      try {
        this.forceSync = true
        // 保存本地数据到Firebase
        set(ref(db, 'quotes'), this.quotes)
        set(ref(db, 'quotesStats'), {
          viewCount: this.viewCount,
          favoriteCount: this.favoriteCount
        })
        console.log('本地幸运曲奇数据已强制同步到Firebase')
        alert('本地幸运曲奇数据已成功同步到Firebase，所有访客将看到更新后的内容')
      } catch (e) {
        console.error('Force sync data failed:', e)
        alert('同步失败，请稍后重试')
      }
    }
  }
}
</script>

<style scoped>
.quotes-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.quotes-header {
  text-align: center;
  margin-bottom: 3rem;
  animation: fadeInUp 1s ease-out;
}

.quotes-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, #3498db, #9b59b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.quotes-header p {
  font-size: 1.2rem;
  color: #7f8c8d;
}

/* 粒子效果区域 */
.particle-container {
  position: relative;
  margin-bottom: 3rem;
  height: 500px;
  width: 100%;
  max-width: 1000px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 0 50px rgba(52, 152, 219, 0.1);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.particle-words {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.particle-word {
  position: absolute;
  width: 60px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  z-index: 1;
}

.particle-word:hover {
  transform: translate(-50%, -50%) scale(1.2);
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5), 0 0 15px currentColor;
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.main-btn {
  font-size: 1.1rem;
  padding: 1rem 2.5rem;
}

/* 格言卡片 */
.quote-card {
  opacity: 0;
  transform: translateY(50px) scale(0.9);
  transition: all 0.6s ease;
  pointer-events: none;
}

.quote-card.active {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .particle-container {
    height: 300px;
  }
  
  .particle-word {
    width: 50px;
    height: 35px;
    font-size: 0.9rem;
  }
  
  .control-buttons {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .main-btn {
    width: 100%;
    max-width: 250px;
  }
}

/* 格言卡片样式 */
.quote-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 800px;
  width: 100%;
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
}

.quote-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #9b59b6, #e74c3c, #f39c12);
}

.quote-content {
  margin-bottom: 2rem;
}

.quote-text {
  font-size: 1.8rem;
  font-weight: 500;
  color: #2c3e50;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  position: relative;
}

.quote-text::before,
.quote-text::after {
  content: '"';
  font-size: 3rem;
  color: #3498db;
  font-family: Georgia, serif;
}

.quote-text::before {
  position: absolute;
  top: -1rem;
  left: -2rem;
}

.quote-text::after {
  position: absolute;
  bottom: -2rem;
  right: -2rem;
}

.quote-author {
  font-size: 1.2rem;
  color: #7f8c8d;
  font-style: italic;
}

.quote-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.btn-secondary {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn:active {
  transform: translateY(0);
}

.quote-stats {
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
  background: white;
  padding: 1.5rem 3rem;
  border-radius: 50px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: #3498db;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: 0.25rem;
}

.quote-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  max-width: 1000px;
  width: 100%;
}

.quote-grid-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #3498db;
}

.quote-grid-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-left-color: #9b59b6;
}

.grid-quote-text {
  font-size: 1rem;
  color: #2c3e50;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.grid-quote-author {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-style: italic;
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

@media (max-width: 768px) {
  .quotes-container {
    padding: 1rem;
  }
  
  .quotes-header h1 {
    font-size: 2rem;
  }
  
  .quote-card {
    padding: 2rem;
  }
  
  .quote-text {
    font-size: 1.4rem;
  }
  
  .quote-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 200px;
  }
  
  .quote-stats {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
  }
  
  .quote-grid {
    grid-template-columns: 1fr;
  }
}
</style>