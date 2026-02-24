<template>
  <div class="global-music-player" :class="{ 'is-expanded': isExpanded }">
    <!-- 迷你模式：旋转唱片 -->
    <div class="mini-player" @click="toggleExpand" v-if="!isExpanded">
      <div class="disc-container" :class="{ 'is-playing': isPlaying }">
        <img src="@/assets/音乐旋转.png" alt="Music" class="disc-cover">
      </div>
    </div>

    <!-- 展开模式：播放器面板 -->
    <div class="expanded-player" v-else>
      <div class="player-header">
        <span class="player-title">Music Player</span>
        <i class="el-icon-close close-btn" @click="toggleExpand"></i>
      </div>
      
      <div class="player-content">
        <div class="song-info">
          <div class="song-name">{{ currentSong.name || 'No Song Playing' }}</div>
          <div class="artist-name">{{ currentSong.artist || 'Unknown Artist' }}</div>
        </div>
        
        <div class="controls">
          <i class="el-icon-caret-left control-btn" @click="prevSong"></i>
          <i :class="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'" class="control-btn play-btn" @click="togglePlay"></i>
          <i class="el-icon-caret-right control-btn" @click="nextSong"></i>
        </div>
        
        <div class="progress-bar" @click="seek">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
      
      <!-- 隐藏的音频元素 -->
      <audio ref="audioPlayer" :src="currentSongUrl" @timeupdate="updateProgress" @ended="nextSong"></audio>
    </div>
  </div>
</template>

<script>
import { musicList } from '@/assets/music-list.js'
import eventBus from '@/eventBus'

export default {
  name: 'GlobalMusicPlayer',
  data() {
    return {
      isExpanded: false,
      isPlaying: false,
      currentIndex: 0,
      progress: 0,
      musicList: musicList,
      currentSong: {}
    }
  },
  created() {
    // 初始化时随机选择一首歌曲，避免第一次点击播放时出现错误
    if (this.musicList.length > 0 && !this.currentSong.file) {
      this.randomSong()
    }
    // 监听来自MusicView的播放状态变化
    eventBus.$on('music-play', this.handleMusicPlay)
    eventBus.$on('music-pause', this.handleMusicPause)
    eventBus.$on('music-change', this.handleMusicChange)
  },
  beforeDestroy() {
    // 移除事件监听
    eventBus.$off('music-play', this.handleMusicPlay)
    eventBus.$off('music-pause', this.handleMusicPause)
    eventBus.$off('music-change', this.handleMusicChange)
  },
  computed: {
    currentSongUrl() {
      if (!this.currentSong.file) return ''
      return `/music/${this.currentSong.file}`
    }
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded
    },
    togglePlay() {
      const audio = this.$refs.audioPlayer
      if (this.isPlaying) {
        audio.pause()
        // 发送暂停事件到音乐站台
        eventBus.$emit('global-player-pause')
        this.isPlaying = false
      } else {
        // 若无正在播放歌曲，随机选择一首
        if (!this.currentSong.file) {
          this.randomSong()
          // 等待歌曲加载完成后再播放
          this.$nextTick(() => {
            if (this.currentSong.file) {
              audio.play().catch(error => {
                console.warn('Playback failed:', error)
              })
              this.isPlaying = true
            }
          })
        } else {
          audio.play().catch(error => {
            console.warn('Playback failed:', error)
          })
          this.isPlaying = true
        }
      }
    },
    // 随机选择一首歌曲
    randomSong() {
      const randomIndex = Math.floor(Math.random() * this.musicList.length)
      this.currentIndex = randomIndex
      this.currentSong = this.musicList[randomIndex]
      // 发送播放事件到音乐站台
      eventBus.$emit('global-player-play', this.currentSong)
    },
    prevSong() {
      this.currentIndex = (this.currentIndex - 1 + this.musicList.length) % this.musicList.length
      this.playNewSong()
    },
    nextSong() {
      this.currentIndex = (this.currentIndex + 1) % this.musicList.length
      this.playNewSong()
    },
    playNewSong() {
      this.isPlaying = true
      this.currentSong = this.musicList[this.currentIndex]
      // 发送播放事件到音乐站台
      eventBus.$emit('global-player-play', this.currentSong)
      this.$nextTick(() => {
        const audio = this.$refs.audioPlayer
        audio.play()
      })
    },
    updateProgress(e) {
      const { currentTime, duration } = e.target
      if (duration) {
        this.progress = (currentTime / duration) * 100
      }
    },
    seek(e) {
      const progressBar = e.currentTarget
      const clickPosition = e.offsetX
      const totalWidth = progressBar.clientWidth
      const percentage = clickPosition / totalWidth
      
      const audio = this.$refs.audioPlayer
      if (audio.duration) {
        audio.currentTime = audio.duration * percentage
      }
    },
    // 处理音乐播放事件
    handleMusicPlay(song) {
      this.isPlaying = true
      this.currentSong = song
    },
    // 处理音乐暂停事件
    handleMusicPause() {
      this.isPlaying = false
    },
    // 处理音乐切换事件
    handleMusicChange(song) {
      this.currentSong = song
    }
  }
}
</script>

<style scoped>
.global-music-player {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 9999;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.mini-player {
  width: 50px;
  height: 50px;
  cursor: pointer;
  transition: transform 0.3s;
}

.mini-player:hover {
  transform: scale(1.1);
}

.disc-container {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  animation: rotate 10s linear infinite;
  animation-play-state: paused;
  background: #fff;
}

.disc-container.is-playing {
  animation-play-state: running;
}

.disc-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.expanded-player {
  width: 280px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(0,0,0,0.05);
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.player-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.close-btn {
  cursor: pointer;
  color: #666;
  font-size: 16px;
}

.player-content {
  padding: 15px;
}

.song-info {
  margin-bottom: 15px;
  text-align: center;
}

.song-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.artist-name {
  font-size: 12px;
  color: #7f8c8d;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
}

.control-btn {
  font-size: 24px;
  cursor: pointer;
  color: #2c3e50;
  transition: color 0.2s;
}

.control-btn:hover {
  color: #42b983;
}

.play-btn {
  font-size: 36px;
  color: #42b983;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #42b983;
  border-radius: 2px;
  width: 0%;
  transition: width 0.1s linear;
}

@media (max-width: 768px) {
  .global-music-player {
    bottom: 10px;
    left: 10px;
  }
  
  .mini-player {
    width: 40px;
    height: 40px;
  }
  
  .expanded-player {
    width: 240px;
  }
  
  .play-btn {
    font-size: 30px;
  }
  
  .control-btn {
    font-size: 20px;
  }
}
</style>
