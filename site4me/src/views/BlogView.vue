<template>
  <div class="blog-view">
    <!-- 博客页面标题 -->
    <div class="blog-header">
      <h1>博客</h1>
      <p>记录生活点滴和技术心得</p>
    </div>

    <!-- 分类筛选 -->
    <div class="category-filter">
      <button 
        v-for="category in categories" 
        :key="category.id"
        class="category-btn"
        :class="{ active: activeCategory === category.id }"
        @click="filterByCategory(category.id)"
      >
        {{ category.name }}
        <span class="category-count">({{ category.count }})</span>
      </button>
    </div>

    <!-- 文章列表 -->
    <div class="article-list">
      <div 
        v-for="article in filteredArticles" 
        :key="article.id"
        class="article-card"
        @click="viewArticle(article)"
      >
        <div class="article-meta">
          <span class="article-category">{{ getCategoryName(article.category) }}</span>
          <span class="article-date">{{ article.date }}</span>
        </div>
        <h3 class="article-title">{{ article.title }}</h3>
        <p class="article-excerpt">{{ article.excerpt }}</p>
        <div class="article-footer">
          <span class="article-author">{{ article.author }}</span>
          <span class="article-views">{{ article.views }} 阅读</span>
        </div>
      </div>
    </div>

    <!-- 文章详情模态框 -->
    <div v-if="selectedArticle" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ selectedArticle.title }}</h2>
        <div class="modal-meta">
          <span>{{ selectedArticle.date }}</span>
          <span>{{ selectedArticle.author }}</span>
          <span>{{ selectedArticle.views }} 阅读</span>
        </div>
        <div class="modal-body" v-html="selectedArticle.content"></div>
        <button class="modal-close" @click="closeModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
import { db, ref, set, onValue, get } from '@/firebase'

export default {
  data() {
    return {
      articles: [],
      categories: [
        { id: 'all', name: '全部', count: 0 },
        { id: 'tech', name: '技术', count: 0 },
        { id: 'life', name: '生活', count: 0 }
      ],
      activeCategory: 'all',
      selectedArticle: null,
      articlesListener: null
    }
  },
  created() {
    this.safeInitArticles().then(() => {
      this.initFirebaseListeners()
    })
  },
  beforeDestroy() {
    // 清理Firebase监听器
    if (this.articlesListener) {
      this.articlesListener();
      console.log('BlogView Firebase监听器已清理');
    }
  },
  computed: {
    filteredArticles() {
      if (this.activeCategory === 'all') {
        return this.articles
      }
      return this.articles.filter(article => article.category === this.activeCategory)
    }
  },
  methods: {
    // 安全初始化文章数据
    async safeInitArticles() {
      try {
        const snapshot = await get(ref(db, 'blogArticles'))
        if (!snapshot.exists()) {
          // 只有当Firebase中没有文章时，才初始化默认文章
          const defaultArticles = [
            {
              id: 'article-' + Date.now(),
              title: '基本完成了网站开发',
              content: `<p>在以前所做的ournote1.0版的基础上，改进和优化了一些内容，完成了该网站的开发</p>

<p>网站现在包含以下功能：</p>

<h3>1. 博客系统</h3>
<p>支持文章分类、标签管理，记录生活点滴和技术心得。</p>

<h3>2. 音乐站台</h3>
<p>收集的一些音乐合集，支持在线播放和音乐列表管理。</p>

<h3>3. havefun</h3>
<p>多种趣味小游戏，包括扫雷、三门问题、熄灯游戏等。</p>

<h3>4. 网站资讯</h3>
<p>实时统计网站访问数据，包括访问量、访问人数、最近访问记录等。</p>

<h3>5. 更新动态</h3>
<p>记录网站的更新历史和功能变更。</p>

<h3>6. 留言板</h3>
<p>记录访客留下的宝贵意见和建议。</p>

<h3>7. 幸运曲奇</h3>
<p>就是用来分享一些不错的句子</p>

<p>网站采用了现代化的设计风格，响应式布局，在不同设备上都能良好显示。使用了Vue.js框架进行开发，确保了良好的用户体验和性能。</p>
<br>
<p>最后，感谢一下以下网络资源或网站，它们给予了我一定程度上的灵感或技术支持帮助：
<ul>
<li>animejs.com - Anime.js </li>
<li>element.eleme.io - Element UI 组件库</li>
<li>iconpark.oceanengine.com - Icon Park 图标库</li>
<li>github.com/ - Vue Clock 2 时钟组件github仓库</li>
<li>ipify.org - 获取访客IP地址</li>
<li>firebase.google.com - Firebase Realtime Database</li>
<li>zhuxxr.top - 苎夏星染的个人博客（作为网站资讯功能的参考）</li>
</ul>
</p>
`,
              excerpt: '个人网站已经基本完成，包含博客系统、音乐站台等多个功能模块。',
              date: new Date().toISOString().split('T')[0],
              category: 'tech',
              author: 'Eryan Mei',
              views: 0,
              tags: ['网站开发', 'Vue.js', '个人项目']
            }
          ]
          
          this.articles = defaultArticles
          this.saveArticles()
          console.log('Firebase中无文章数据，已初始化默认文章')
        } else {
          // 如果Firebase中已有文章，加载现有数据
          this.articles = snapshot.val()
          console.log('已加载Firebase中的现有文章数据')
        }
        this.updateCategoryCounts()
      } catch (e) {
        console.error('Init default articles failed:', e)
        // 失败时使用默认数据
        if (this.articles.length === 0) {
          const defaultArticles = [
            {
              id: 'article-' + Date.now(),
              title: '基本完成了网站开发',
              content: `<p>在以前所做的ournote1.0版的基础上，改进和优化了一些内容，完成了该网站的开发</p>`,
              excerpt: '个人网站已经基本完成，包含博客系统、音乐站台等多个功能模块。',
              date: new Date().toISOString().split('T')[0],
              category: 'tech',
              author: 'Eryan Mei',
              views: 0,
              tags: ['网站开发', 'Vue.js', '个人项目']
            }
          ]
          this.articles = defaultArticles
          this.saveArticles()
        }
        this.updateCategoryCounts()
      }
    },
    
    // 初始化Firebase数据监听
    initFirebaseListeners() {
      try {
        // 先清理可能存在的旧监听器
        if (this.articlesListener) {
          this.articlesListener();
          console.log('旧的Firebase监听器已清理');
        }
        
        // 监听文章数据变化
        const articlesRef = ref(db, 'blogArticles');
        console.log('开始监听Firebase路径:', 'blogArticles');
        this.articlesListener = onValue(articlesRef, (snapshot) => {
          const data = snapshot.val()
          console.log('收到Firebase数据更新:', data);
          if (data) {
            this.articles = data;
            this.updateCategoryCounts();
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
        })
      } catch (e) {
        console.error('Firebase listener setup failed:', e);
      }
    },
    
    // 保存博客文章数据到Firebase
    saveArticles() {
      try {
        // 直接保存到Firebase
        set(ref(db, 'blogArticles'), this.articles);
        console.log('博客文章数据已保存到Firebase');
      } catch (e) {
        console.error('Save articles failed:', e);
      }
    },
    
    // 更新分类计数
    updateCategoryCounts() {
      // 重置计数
      this.categories.forEach(category => {
        if (category.id === 'all') {
          category.count = this.articles.length;
        } else {
          category.count = this.articles.filter(article => article.category === category.id).length;
        }
      });
    },
    
    // 增加阅读量并保存到Firebase
    incrementArticleViews(articleId) {
      const article = this.articles.find(a => a.id === articleId);
      if (article) {
        article.views++;
        this.saveArticles();
      }
    },
    
    // 根据分类筛选文章
    filterByCategory(categoryId) {
      this.activeCategory = categoryId;
    },
    
    // 获取分类名称
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '未知分类';
    },
    
    // 查看文章详情
    viewArticle(article) {
      // 增加阅读量
      this.incrementArticleViews(article.id);
      this.selectedArticle = article;
    },
    
    // 关闭模态框
    closeModal() {
      this.selectedArticle = null;
    }
  }
}
</script>

<style scoped>
.blog-view {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.16);
  padding: 32px;
  backdrop-filter: saturate(140%) blur(6px);
}

/* 博客标题 */
.blog-header {
  text-align: center;
  margin-bottom: 48px;
}

.blog-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.blog-header p {
  font-size: 1.125rem;
  color: #64748b;
}

/* 分类筛选 */
.category-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-btn:hover {
  border-color: #81D8CF;
  color: #81D8CF;
}

.category-btn.active {
  background: #81D8CF;
  color: white;
  border-color: #81D8CF;
}

.category-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* 文章列表 */
.article-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.article-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.article-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 0.875rem;
  color: #94a3b8;
}

.article-category {
  background: rgba(129, 216, 207, 0.1);
  color: #81D8CF;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.article-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  line-height: 1.4;
}

.article-excerpt {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 20px;
}

.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #94a3b8;
}

.article-author {
  font-weight: 500;
}

.article-views {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-content h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.modal-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  font-size: 0.875rem;
  color: #94a3b8;
  flex-wrap: wrap;
}

.modal-body {
  color: #334155;
  line-height: 1.8;
}

.modal-body h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-size: 1.25rem;
  color: #1e293b;
}

.modal-body p {
  margin-bottom: 16px;
}

.modal-body ul {
  margin-bottom: 16px;
  padding-left: 20px;
}

.modal-body li {
  margin-bottom: 8px;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #ef4444;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .blog-view {
    padding: 24px 16px;
  }
  
  .blog-header h1 {
    font-size: 2rem;
  }
  
  .category-filter {
    justify-content: center;
  }
  
  .article-title {
    font-size: 1.25rem;
  }
  
  .modal-content {
    margin: 16px;
    padding: 24px;
  }
}
</style>