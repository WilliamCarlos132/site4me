<template>
  <div class="teleport-view">
    <transition name="loader-fade">
      <div v-if="isLoading" class="page-loader">
        <div class="loader-logo">ERYANMEI-OURNOTE</div>
        <div class="loader-subtitle">正在连接传送舱...</div>
      </div>
    </transition>

    <div class="teleport-header">
      <h1>传送舱</h1>
      <p>发现互联网上那些有趣、有用、甚至有些奇妙的角落</p>
    </div>

    <div class="teleport-container">
      <div v-for="(links, category) in groupedLinks" :key="category" class="category-section">
        <h2 class="category-title">{{ category }}</h2>
        <div class="links-grid">
          <a 
            v-for="link in links" 
            :key="link.id" 
            :href="link.url" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="link-card"
          >
            <div class="link-icon">{{ link.icon || '🌐' }}</div>
            <div class="link-info">
              <h3 class="link-name">{{ link.name }}</h3>
              <p class="link-desc">{{ link.description || '点击探索更多精彩...' }}</p>
            </div>
            <div class="link-external">
              <span>🚀</span>
            </div>
          </a>
        </div>
      </div>
      
      <div v-if="Object.keys(groupedLinks).length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">🛸</div>
        <p>传送舱目前空空如也，请联系管理员添加链接</p>
      </div>
    </div>
  </div>
</template>

<script>
import { db, ref, onValue } from '@/firebase'

export default {
  name: 'TeleportView',
  data() {
    return {
      links: [],
      isLoading: true
    }
  },
  computed: {
    groupedLinks() {
      const groups = {}
      this.links.forEach(link => {
        const category = link.category || '未分类'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(link)
      })
      return groups
    }
  },
  mounted() {
    this.fetchLinks()
  },
  methods: {
    fetchLinks() {
      const linksRef = ref(db, 'teleportLinks')
      onValue(linksRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          if (Array.isArray(data)) {
            this.links = data.filter(link => link && link.url)
          } else if (typeof data === 'object') {
            this.links = Object.values(data).filter(link => link && link.url)
          }
        } else {
          this.links = []
        }
        this.isLoading = false
      }, (error) => {
        console.error('Failed to fetch teleport links:', error)
        this.isLoading = false
      })
    }
  }
}
</script>

<style scoped>
.teleport-view {
  min-height: 80vh;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  margin: 20px auto;
  max-width: 1300px;
  position: relative;
  z-index: 1;
}

.teleport-header {
  text-align: center;
  margin-bottom: 60px;
}

.teleport-header h1 {
  font-size: 3rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #008c8c 0%, #00d2d2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.teleport-header p {
  font-size: 1.25rem;
  color: #64748b;
  max-width: 600px;
  margin: 0 auto;
}

.teleport-container {
  max-width: 1200px;
  margin: 0 auto;
}

.category-section {
  margin-bottom: 50px;
}

.category-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 24px;
  padding-left: 16px;
  border-left: 6px solid #008c8c;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.link-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.link-card:hover {
  transform: translateY(-8px);
  background: white;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 140, 140, 0.3);
}

.link-icon {
  font-size: 2.5rem;
  margin-right: 20px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.link-card:hover .link-icon {
  transform: scale(1.2) rotate(10deg);
}

.link-info {
  flex-grow: 1;
}

.link-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.link-desc {
  font-size: 0.9rem;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.link-external {
  font-size: 1.25rem;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
}

.link-card:hover .link-external {
  opacity: 1;
  transform: translateX(0);
}

.empty-state {
  text-align: center;
  padding: 100px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* 页面加载动画 */
.page-loader {
  position: fixed;
  inset: 0;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: #e5e7eb;
}

.loader-logo {
  font-size: 2.4rem;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  font-weight: 600;
  color: #e5e7eb;
  animation: loader-glow 1.8s ease-in-out infinite;
}

.loader-subtitle {
  margin-top: 16px;
  font-size: 0.95rem;
  color: #9ca3af;
}

.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.4s ease;
}

.loader-fade-enter,
.loader-fade-leave-to {
  opacity: 0;
}

@keyframes loader-glow {
  0% {
    opacity: 0.3;
    transform: translateY(4px);
  }
  50% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0.3;
    transform: translateY(4px);
  }
}

@media (max-width: 768px) {
  .teleport-header h1 {
    font-size: 2.25rem;
  }
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>
