<template>
  <div class="music-view">
    <!-- 音乐站台标题 -->
    <div class="music-header">
      <h1>音乐站台</h1>
      <p>: )</p>
      <div class="sync-status" :class="syncStatus">
        {{ syncStatus === 'synced' ? '数据已同步' : 
           syncStatus === 'syncing' ? '正在同步数据...' : 
           syncStatus === 'error' ? '同步失败，使用本地数据' : '准备同步' }}
      </div>
    </div>

    <!-- 音乐播放器 -->
    <div class="music-player">
      <div class="player-info">
        <div class="current-song">
          <h2>{{ currentSong.name }}</h2>
          <p>{{ currentSong.artist }}</p>
        </div>
        <div class="player-controls">
          <button class="control-btn" @click="playPrevious" :disabled="!hasPrevious">
            ⏮️
          </button>
          <button class="control-btn play-btn" @click="togglePlay">
            {{ isPlaying ? '⏸️' : '▶️' }}
          </button>
          <button class="control-btn" @click="playNext" :disabled="!hasNext">
            ⏭️
          </button>
        </div>

        <!-- 播放模式 -->
        <div class="player-modes">
          <button
            class="mode-btn"
            :class="{ active: playMode === 'order' }"
            @click="setPlayMode('order')"
            title="顺序播放"
          >
            顺序
          </button>
          <button
            class="mode-btn"
            :class="{ active: playMode === 'loop' }"
            @click="setPlayMode('loop')"
            title="列表循环"
          >
            循环
          </button>
          <button
            class="mode-btn"
            :class="{ active: playMode === 'single' }"
            @click="setPlayMode('single')"
            title="单曲循环"
          >
            单曲
          </button>
          <button
            class="mode-btn"
            :class="{ active: playMode === 'shuffle' }"
            @click="setPlayMode('shuffle')"
            title="随机播放"
          >
            随机
          </button>
        </div>
        <div class="player-progress">
          <div class="progress-bar">
            <div 
              class="progress-filled" 
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
          <div class="progress-time">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ duration > 0 ? formatTime(duration) : currentSong.duration }}</span>
          </div>
        </div>
        <div class="player-volume">
          <button class="control-btn" @click="toggleMute">
            {{ isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔈' : '🔊' }}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            v-model="volume"
            @input="updateVolume"
            class="volume-slider"
          />
        </div>
        
        <!-- 音频频谱可视化 -->
        <div class="audio-spectrum">
          <div 
            v-for="(value, index) in audioSpectrum" 
            :key="index"
            class="spectrum-bar"
            :style="{
              height: `${value * 100}%`,
              backgroundColor: `rgba(255, 255, 255, ${0.5 + value * 0.5})`
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 音乐列表 -->
    <div class="music-list">
      <h2>音乐列表</h2>
      <div class="list-header">
        <span class="list-title">歌曲</span>
        <span class="list-duration">时长</span>
      </div>
      <div class="song-list">
        <div 
          v-for="(song, index) in musicList" 
          :key="index"
          :class="['song-item', { active: currentSongIndex === index }]"
          @click="playSong(index)"
        >
          <div class="song-info">
            <span class="song-name">{{ song.name }}</span>
            <span class="song-artist">{{ song.artist }}</span>
          </div>
          <span class="song-duration">{{ getSongDuration(index) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db, ref, set, onValue, connectionStatus } from '@/firebase'
import eventBus from '@/eventBus'
import { musicList as defaultMusicList } from '@/assets/music-list.js'

export default {
  data() {
    return {
      musicList: [],
      currentSongIndex: 0,
      isPlaying: false,
      isMuted: false,
      volume: 0.7,
      currentTime: 0,
      duration: 0,
      audioElement: null,
      // 播放模式：order 顺序播放，loop 列表循环，single 单曲循环，shuffle 随机播放
      playMode: 'order',
      // 音频频谱数据
      audioSpectrum: Array(20).fill(0),
      // 同步相关
      isInitialLoad: true, // 首次加载标志
      forceSync: false, // 强制同步标志
      syncStatus: 'idle', // idle, syncing, synced, error
      firebaseStatus: connectionStatus,
      musicListListener: null,
      // 实际歌曲时长数据
      actualDurations: [] // 存储所有歌曲的实际时长
    }
  },
  created() {
    console.log('Firebase connection status:', this.firebaseStatus);
    // 首先初始化音乐列表（如果没有），然后再初始化Firebase数据监听
    this.initDefaultMusicList().then(() => {
      console.log('MusicView initDefaultMusicList completed, musicList:', this.musicList);
      // 然后初始化Firebase数据监听
      this.initFirebaseListeners();
      // 初始化完成后加载第一首歌曲
      if (this.musicList.length > 0) {
        console.log('MusicView loading first song');
        this.loadSong(0);
      }
    });
  },
  methods: {
    // 初始化Firebase数据监听
    initFirebaseListeners() {
      this.syncStatus = 'syncing';
      try {
        // 先清理可能存在的旧监听器
        if (this.musicListListener) {
          this.musicListListener();
          console.log('旧的Firebase监听器已清理');
        }
        
        // 监听音乐列表数据变化
        const musicListRef = ref(db, 'musicList');
        console.log('开始监听Firebase路径:', 'musicList');
        this.musicListListener = onValue(musicListRef, (snapshot) => {
          const data = snapshot.val()
          console.log('收到Firebase数据更新:', data);
          if (data) {
            // 使用Vue的响应式更新方法，确保视图能正确更新
            this.$set(this, 'musicList', data);
            // 无论是否是首次加载，都预加载歌曲时长
            this.preloadAllSongDurations()
            // 首次加载后设置标志
            if (this.isInitialLoad) {
              this.isInitialLoad = false
            }
            this.syncStatus = 'synced';
            console.log('Firebase data synced successfully');
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
          this.syncStatus = 'error';
          // 失败时直接从Firebase加载作为备份
          this.loadMusicListFromFirebase()
          // 加载后也预加载时长
          this.preloadAllSongDurations()
          this.isInitialLoad = false
        })
      } catch (e) {
        console.error('Firebase listener setup failed:', e);
        this.syncStatus = 'error';
        // 失败时直接从Firebase加载作为备份
        this.loadMusicListFromFirebase()
        // 加载后也预加载时长
        this.preloadAllSongDurations()
        this.isInitialLoad = false
      }
    },
    // 初始化默认音乐列表
    async initDefaultMusicList() {
      try {
        console.log('开始检查Firebase音乐列表...')
        // 检查Firebase中是否已有音乐列表数据
        const musicSnapshot = await get(ref(db, 'musicList'))
        
        const musicData = musicSnapshot.val()
        if (!musicData || Object.keys(musicData).length === 0) {
          console.log('Firebase中无音乐列表数据，初始化默认音乐列表到Firebase')
          this.musicList = defaultMusicList
          // 直接保存到Firebase
          await set(ref(db, 'musicList'), defaultMusicList)
        } else {
          console.log('从Firebase获取音乐列表成功')
          this.musicList = musicData
        }
        // 预加载所有歌曲的实际时长
        this.preloadAllSongDurations()
      } catch (e) {
        console.error('Init default music list failed:', e)
        console.error('Firebase同步错误详情:', e.message)
        // 失败时使用默认音乐列表
        console.log('使用默认音乐列表初始化')
        this.musicList = defaultMusicList
        // 直接保存到Firebase
        set(ref(db, 'musicList'), defaultMusicList)
        // 无论是否失败，都预加载时长
        this.preloadAllSongDurations()
      }
      // 初始化完成后设置为非首次加载
      this.isInitialLoad = false
    },
    // 直接从Firebase数据库加载音乐列表
    async loadMusicListFromFirebase() {
      try {
        const snapshot = await get(ref(db, 'musicList'))
        if (snapshot.exists()) {
          this.musicList = snapshot.val()
          console.log('从Firebase加载音乐列表成功')
        } else {
          console.log('Firebase中无音乐列表数据，使用默认音乐列表初始化')
          this.musicList = defaultMusicList
          set(ref(db, 'musicList'), defaultMusicList)
        }
      } catch (e) {
        console.error('Load music list failed:', e)
        this.musicList = defaultMusicList
      }
    },
    createAudioElement() {
      // 如果已经存在音频元素，先清理
      if (this.audioElement) {
        this.audioElement.pause()
        this.audioElement.removeEventListener('timeupdate', this.updateTime)
        this.audioElement.removeEventListener('ended', this.handleEnded)
        this.audioElement.removeEventListener('loadedmetadata', this.updateDuration)
        this.audioElement.removeEventListener('play', this.startAudioAnalysis)
        this.audioElement.removeEventListener('pause', this.stopAudioAnalysis)
        this.audioElement.removeEventListener('error', this.handleAudioError)
        this.audioElement.removeEventListener('canplay', this.handleCanPlay)
      }
      
      this.audioElement = new Audio()
      this.audioElement.volume = this.volume
      
      // 添加事件监听器
      this.audioElement.addEventListener('timeupdate', this.updateTime)
      this.audioElement.addEventListener('ended', this.handleEnded)
      this.audioElement.addEventListener('loadedmetadata', this.updateDuration)
      this.audioElement.addEventListener('play', this.startAudioAnalysis)
      this.audioElement.addEventListener('pause', this.stopAudioAnalysis)
      this.audioElement.addEventListener('error', this.handleAudioError)
      this.audioElement.addEventListener('canplay', this.handleCanPlay)
    },
    
    // 处理音频错误
    handleAudioError(event) {
      console.error('Audio error:', event)
      this.isPlaying = false
      
      // 尝试修复：重置音频元素
      setTimeout(() => {
        this.resetAudioElement()
        if (this.currentSongIndex < this.musicList.length) {
          this.loadSong(this.currentSongIndex)
        }
      }, 500)
    },
    
    // 处理音频可以播放的事件
    handleCanPlay() {
      console.log('Audio can play:', this.currentSong.name)
      // 如果用户已经请求播放，确保播放状态正确
      if (this.isPlaying) {
        this.doPlay()
      }
    },
    
    // 启动音频分析
    startAudioAnalysis() {
      try {
        // 创建音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        // 创建媒体元素源
        this.source = this.audioContext.createMediaElementSource(this.audioElement)
        // 创建分析器
        this.analyzer = this.audioContext.createAnalyser()
        this.analyzer.fftSize = 256
        this.analyzer.smoothingTimeConstant = 0.8
        
        // 连接音频节点
        this.source.connect(this.analyzer)
        this.analyzer.connect(this.audioContext.destination)
        
        // 开始分析音频
        this.analyzeAudio()
      } catch (error) {
        console.warn('Audio analysis not supported:', error)
      }
    },
    
    // 停止音频分析
    stopAudioAnalysis() {
      if (this.audioContext) {
        this.audioContext.close()
        this.audioContext = null
        this.source = null
        this.analyzer = null
      }
    },
    
    // 分析音频并更新频谱数据
    analyzeAudio() {
      if (!this.analyzer) return
      
      // 获取频率数据
      const bufferLength = this.analyzer.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      this.analyzer.getByteFrequencyData(dataArray)
      
      // 更新频谱数据，使用Vue的响应式更新方法
      const spectrumLength = this.audioSpectrum.length
      const newSpectrum = []
      for (let i = 0; i < spectrumLength; i++) {
        const index = Math.floor((i / spectrumLength) * bufferLength)
        newSpectrum.push(dataArray[index] / 255)
      }
      
      // 替换整个数组以触发响应式更新
      this.audioSpectrum = newSpectrum
      
      // 继续分析
      if (!this.audioElement.paused) {
        requestAnimationFrame(this.analyzeAudio)
      }
    },
    
    // 歌曲切换动画
    animateSongChange() {
      const currentSongElement = document.querySelector('.current-song')
      if (!currentSongElement) return
      
      // 歌曲信息淡出
      window.anime({
        targets: currentSongElement,
        opacity: [1, 0],
        translateY: [0, -20],
        duration: 300,
        easing: 'easeOutQuad',
        complete: () => {
          // 歌曲信息淡入
          window.anime({
            targets: currentSongElement,
            opacity: [0, 1],
            translateY: [-20, 0],
            duration: 300,
            easing: 'easeInQuad'
          })
        }
      })
    },
    loadSong(index) {
      const song = this.musicList[index]
      if (!song) return
      
      // 停止当前的音频分析
      this.stopAudioAnalysis()
      
      // 使用正确的相对路径指向public/music目录中的音乐文件
      const audioPath = `/music/${encodeURIComponent(song.file)}`
      console.log('Loading song:', song.name, 'from:', audioPath)
      
      // 重置音频元素状态
      if (this.audioElement) {
        this.audioElement.pause()
        this.audioElement.currentTime = 0
        this.audioElement.removeAttribute('src')
        this.audioElement.load() // 重置音频元素
      }
      
      // 重新创建音频元素以避免可能的问题
      this.createAudioElement()
      
      // 设置新的音频源并加载
      this.audioElement.src = audioPath
      this.audioElement.load() // 显式调用load()方法开始加载音频
      this.currentSongIndex = index
      this.currentTime = 0
      this.duration = 0
      this.isPlaying = false
      
      // 发射音乐切换事件
      eventBus.$emit('music-change', song)
      
      // 触发歌曲切换动画
      this.animateSongChange()
    },
    playSong(index) {
      console.log('MusicView playSong called with index:', index, 'currentSongIndex:', this.currentSongIndex);
      
      // 检查音频元素是否存在以及是否已经加载了正确的歌曲
      const isAudioReady = this.audioElement && this.audioElement.src && this.currentSongIndex === index;
      console.log('MusicView isAudioReady:', isAudioReady);
      
      // 只有当点击的不是当前正在播放的歌曲，或者音频元素还没有加载该歌曲时才加载新歌曲
      if (index !== this.currentSongIndex || !isAudioReady) {
        console.log('MusicView loading song at index:', index);
        this.loadSong(index)
        
        // 等待音频加载完成后再播放
        const playCallback = () => {
          console.log('MusicView Audio canplay event triggered, starting playback');
          this.doPlay();
          this.animatePlaySong();
        };
        
        // 立即检查是否已经可以播放
        if (this.audioElement && this.audioElement.readyState >= 2) {
          playCallback();
        } else {
          // 添加canplay事件监听器
          if (this.audioElement) {
            this.audioElement.addEventListener('canplay', playCallback, { once: true });
            
            // 添加超时处理，避免无限等待
            setTimeout(() => {
              if (!this.isPlaying && this.currentSongIndex === index) {
                console.warn('MusicView Audio load timeout, trying to play anyway');
                this.doPlay();
              }
            }, 3000);
          }
        }
      } else {
        // 如果点击的是当前正在播放的歌曲，且音频元素已经加载了该歌曲，切换播放/暂停状态
        console.log('MusicView toggling play/pause for current song');
        this.togglePlay();
      }
    },
    play() {
      // 尝试播放音频
      if (!this.audioElement) return
      
      // 确保音频元素已经准备就绪
      if (this.audioElement.readyState < 2) {
        // 音频还没有加载完成，等待canplay事件
        console.log('Audio not ready, waiting for canplay...')
        this.audioElement.addEventListener('canplay', () => {
          this.doPlay()
        }, { once: true })
        return
      }
      
      // 音频已经准备就绪，直接播放
      this.doPlay()
    },
    
    // 实际执行播放操作的方法
    doPlay() {
      if (!this.audioElement) return
      
      this.audioElement.play()
        .then(() => {
          // 播放成功
          this.isPlaying = true
          // 发射音乐播放事件
          eventBus.$emit('music-play', this.currentSong)
          console.log('Playback started successfully:', this.currentSong.name)
        })
        .catch((error) => {
          // 播放失败
          console.error('Play failed:', error)
          this.isPlaying = false
          
          // 尝试修复：重置音频元素并重新加载
          setTimeout(() => {
            this.resetAudioElement()
            if (this.currentSongIndex < this.musicList.length) {
              this.loadSong(this.currentSongIndex)
              // 再次尝试播放
              this.audioElement.addEventListener('canplay', () => {
                this.audioElement.play()
                  .then(() => {
                    this.isPlaying = true
                    eventBus.$emit('music-play', this.currentSong)
                  })
                  .catch((err) => {
                    console.error('Play failed again after reset:', err)
                  })
              }, { once: true })
            }
          }, 500)
        })
    },
    
    // 重置音频元素
    resetAudioElement() {
      if (!this.audioElement) return
      
      // 停止当前播放
      this.audioElement.pause()
      this.audioElement.currentTime = 0
      this.isPlaying = false
      this.currentTime = 0
      this.duration = 0
      
      console.log('Audio element reset')
    },
    pause() {
      this.audioElement.pause()
      this.isPlaying = false
      // 发射音乐暂停事件
      eventBus.$emit('music-pause')
    },
    togglePlay() {
      if (this.isPlaying) {
        this.pause()
      } else {
        this.play()
      }
      
      // 播放/暂停按钮动画
      this.animatePlayPauseButton()
    },
    
    // 播放/暂停按钮动画
    animatePlayPauseButton() {
      const playButton = document.querySelector('.play-btn')
      if (!playButton) return
      
      // 按钮缩放动画
      window.anime({
        targets: playButton,
        scale: [1, 1.1, 1],
        duration: 300,
        easing: 'easeInOutQuad'
      })
      
      // 按钮旋转动画
      window.anime({
        targets: playButton,
        rotate: [0, this.isPlaying ? -10 : 10, 0],
        duration: 300,
        easing: 'easeInOutQuad'
      })
    },
    playPrevious() {
      if (!this.musicList.length) return

      if (this.playMode === 'shuffle') {
        this.playRandom()
        return
      }

      if (this.playMode === 'order') {
        if (this.currentSongIndex > 0) {
          this.playSong(this.currentSongIndex - 1)
        }
        return
      }

      // 列表循环 / 其它模式：从头/尾循环
      if (this.currentSongIndex > 0) {
        this.playSong(this.currentSongIndex - 1)
      } else {
        this.playSong(this.musicList.length - 1)
      }
    },
    playNext() {
      if (!this.musicList.length) return

      if (this.playMode === 'shuffle') {
        this.playRandom()
        return
      }

      if (this.playMode === 'order') {
        if (this.currentSongIndex < this.musicList.length - 1) {
          this.playSong(this.currentSongIndex + 1)
        }
        return
      }

      // 列表循环 / 其它模式：从尾回到头
      if (this.currentSongIndex < this.musicList.length - 1) {
        this.playSong(this.currentSongIndex + 1)
      } else {
        this.playSong(0)
      }
    },
    toggleMute() {
      this.isMuted = !this.isMuted
      this.audioElement.muted = this.isMuted
    },
    updateVolume() {
      this.audioElement.volume = this.volume
      this.isMuted = this.volume === 0
      // 音量变化动画
      this.animateVolumeChange()
    },
    updateTime() {
      this.currentTime = this.audioElement.currentTime
      // 进度条动画
      this.animateProgress()
    },
    updateDuration() {
      this.duration = this.audioElement.duration
    },
    handleEnded() {
      // 根据播放模式决定下一首
      if (this.playMode === 'single') {
        // 单曲循环
        this.playSong(this.currentSongIndex)
        return
      }

      if (this.playMode === 'shuffle') {
        this.playRandom()
        return
      }

      // 顺序/列表循环
      if (this.currentSongIndex < this.musicList.length - 1) {
        this.playSong(this.currentSongIndex + 1)
      } else if (this.playMode === 'loop' && this.musicList.length > 0) {
        this.playSong(0)
      } else {
        this.isPlaying = false
      }
    },
    // 设置播放模式
    setPlayMode(mode) {
      this.playMode = mode
      
      // 播放模式切换动画
      this.animatePlayModeChange()
    },
    
    // 播放模式切换动画
    animatePlayModeChange() {
      const modeButtons = document.querySelectorAll('.mode-btn')
      if (!modeButtons.length) return
      
      // 为当前选中的模式按钮添加动画
      modeButtons.forEach(button => {
        if (button.classList.contains('active')) {
          window.anime({
            targets: button,
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
            duration: 500,
            easing: 'easeInOutQuad'
          })
        }
      })
    },
    // 随机播放一首（避免重复当前曲目，如果列表长度大于1）
    playRandom() {
      if (this.musicList.length === 0) return
      if (this.musicList.length === 1) {
        this.playSong(0)
        return
      }
      let nextIndex = this.currentSongIndex
      while (nextIndex === this.currentSongIndex) {
        nextIndex = Math.floor(Math.random() * this.musicList.length)
      }
      this.playSong(nextIndex)
    },
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '00:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },
    
    // 初始化动画效果
    initAnimations() {
      if (!window.anime) {
        console.log('Anime is not loaded, skipping animations')
        return
      }
      
      console.log('Initializing animations...')
      
      // 确保DOM元素已渲染
      this.$nextTick(() => {
        // 检查目标元素是否存在
        const musicPlayer = document.querySelector('.music-player')
        const musicList = document.querySelector('.music-list')
        const controlButtons = document.querySelectorAll('.control-btn')
        
        console.log('DOM elements found:', {
          musicPlayer: !!musicPlayer,
          musicList: !!musicList,
          controlButtons: controlButtons.length
        })
        
        // 音乐播放器进入动画
        if (musicPlayer) {
          window.anime({
            targets: musicPlayer,
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 800,
            easing: 'easeOutElastic(1, 0.5)'
          })
        }
        
        // 音乐列表进入动画
        if (musicList) {
          window.anime({
            targets: musicList,
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 600,
            delay: 300,
            easing: 'easeOutQuad'
          })
        }
        
        // 控制按钮呼吸动画
        if (controlButtons.length > 0) {
          this.animateControlButtons()
        }
      })
    },
    
    // 控制按钮呼吸动画
    animateControlButtons() {
      if (!window.anime) {
        console.log('Anime is not loaded, skipping control button animations')
        return
      }
      
      console.log('Animating control buttons...')
      
      const controlButtons = document.querySelectorAll('.control-btn')
      if (controlButtons.length > 0) {
        // 为每个按钮添加呼吸动画
        controlButtons.forEach((button, index) => {
          window.anime({
            targets: button,
            scale: [1, 1.1, 1], // 增加缩放范围，使效果更明显
            opacity: [0.8, 1, 0.8], // 添加透明度变化
            duration: 2000,
            easing: 'easeInOutSine',
            loop: true,
            delay: index * 100 // 为每个按钮添加不同的延迟
          })
        })
        console.log('Control button animation started for', controlButtons.length, 'buttons')
      } else {
        console.log('No control buttons found, skipping animation')
      }
    },
    
    // 播放歌曲时的动画
    animatePlaySong() {
      if (!window.anime) return
      
      // 移除所有歌曲项的高亮状态，只保留当前选中的
      const songItems = document.querySelectorAll('.song-item')
      songItems.forEach((item, index) => {
        if (index !== this.currentSongIndex) {
          item.classList.remove('active')
        } else {
          item.classList.add('active')
        }
      })
      
      // 当前歌曲高亮动画
      const currentSongItem = songItems[this.currentSongIndex]
      if (currentSongItem) {
        window.anime({
          targets: currentSongItem,
          backgroundColor: ['rgba(102, 126, 234, 0.1)', 'rgba(102, 126, 234, 0.2)', 'rgba(102, 126, 234, 0.1)'],
          duration: 1000,
          easing: 'easeInOutQuad'
        })
      }
      
      // 播放器信息动画
      window.anime({
        targets: '.current-song',
        opacity: [0.7, 1],
        scale: [0.98, 1],
        duration: 500,
        easing: 'easeOutCubic'
      })
    },
    
    // 进度条动画
    animateProgress() {
      if (!window.anime || !this.audioElement) return
      
      // 进度条填充动画
      const progressFilled = document.querySelector('.progress-filled')
      if (progressFilled) {
        // 添加发光效果
        progressFilled.style.boxShadow = `0 0 10px ${this.getVolumeColor()}`
        
        // 进度条填充动画
        window.anime({
          targets: progressFilled,
          width: `${this.progressPercentage}%`,
          duration: 200,
          easing: 'linear'
        })
      }
    },
    
    // 根据音量获取颜色
    getVolumeColor() {
      // 色相：从蓝色(220)过渡到橙色(30)
      const hue = 220 - (this.volume * 190)
      // 饱和度：从40%过渡到90%
      const saturation = 40 + (this.volume * 50)
      // 亮度：从60%过渡到70%
      const lightness = 60 + (this.volume * 10)
      
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    },
    
    // 音量变化动画
    animateVolumeChange() {
      if (!window.anime) return
      
      // 为音量滑块添加动画效果
      const volumeSlider = document.querySelector('.volume-slider')
      if (volumeSlider) {
        // 动画滑块的不透明度和缩放
        window.anime({
          targets: volumeSlider,
          opacity: [0.7, 1, 0.7],
          scale: [0.98, 1.02, 0.98],
          duration: 300,
          easing: 'easeOutQuad'
        })
        
        // 直接设置滑块的样式
        volumeSlider.style.accentColor = this.volume === 0 ? '#64748b' : this.volume < 0.5 ? '#94a3b8' : '#667eea'
      }
      
      // 根据音量大小变化播放器背景色
      this.animatePlayerBackground()
    },
    
    // 根据音量大小变化播放器背景色
    animatePlayerBackground() {
      const musicPlayer = document.querySelector('.music-player')
      if (!musicPlayer) return
      
      // 直接设置背景色，不使用动画，确保颜色即时更新
      // 根据音量大小计算HSL颜色值
      // 音量为0时：冷色调（蓝色系），低饱和度
      // 音量为1时：暖色调（橙红色系），高饱和度
      
      // 色相：从蓝色(220)过渡到橙色(30)
      const hue = 220 - (this.volume * 190)
      // 饱和度：从40%过渡到90%
      const saturation = 40 + (this.volume * 50)
      // 亮度：从60%过渡到70%
      const lightness = 60 + (this.volume * 10)
      
      // 计算渐变的两种颜色
      const color1 = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      const color2 = `hsl(${(hue + 30) % 360}, ${saturation + 10}%, ${lightness - 5}%)`
      
      // 直接设置背景色，避免动画延迟
      musicPlayer.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
    },
    // 强制同步本地数据到Firebase
    forceSyncData() {
      try {
        this.forceSync = true
        // 先获取Firebase中的最新数据
        get(ref(db, 'musicList')).then((snapshot) => {
          const firebaseData = snapshot.val()
          if (firebaseData && Object.keys(firebaseData).length > 0) {
            // 如果Firebase中有数据，合并本地数据和Firebase数据
            console.log('Firebase中有数据，合并数据后同步')
            // 这里可以根据实际需求实现合并逻辑
            // 例如：如果本地有新歌曲，添加到Firebase数据中
          }
          // 保存本地数据到Firebase
          set(ref(db, 'musicList'), this.musicList)
          console.log('本地音乐数据已强制同步到Firebase')
        })
        // 移除alert弹窗
      } catch (e) {
        console.error('Force sync data failed:', e)
        // 移除alert弹窗
      }
    },
    // 同步本地数据到Firebase
    syncToFirebase() {
      try {
        console.log('同步本地数据到Firebase...')
        // 先获取Firebase中的最新数据
        get(ref(db, 'musicList')).then((snapshot) => {
          const firebaseData = snapshot.val()
          if (firebaseData && Object.keys(firebaseData).length > 0) {
            // 如果Firebase中有数据，合并本地数据和Firebase数据
            console.log('Firebase中有数据，合并数据后同步')
            // 这里可以根据实际需求实现合并逻辑
            // 例如：如果本地有新歌曲，添加到Firebase数据中
          }
          // 保存本地音乐列表到Firebase
          set(ref(db, 'musicList'), this.musicList)
          console.log('本地数据同步到Firebase成功')
          this.syncStatus = 'synced'
        })
      } catch (e) {
        console.error('Sync to Firebase failed:', e)
        this.syncStatus = 'error'
      }
    },
    // 获取歌曲的实际播放时长
    getSongDuration(index) {
      // 如果已经加载了实际时长，返回实际时长
      if (this.actualDurations[index] && this.actualDurations[index] > 0) {
        return this.formatTime(this.actualDurations[index])
      }
      // 如果是当前正在播放的歌曲，且已经加载了实际时长，返回实际时长
      if (index === this.currentSongIndex && this.duration > 0) {
        return this.formatTime(this.duration)
      }
      // 否则返回音乐列表中的时长
      return this.musicList[index].duration || '00:00'
    },
    // 预加载所有歌曲的实际时长（优化版）
    preloadAllSongDurations() {
      if (!this.musicList.length) return
      
      // 分批加载，每批处理5首歌曲，避免同时创建太多音频元素
      const batchSize = 5
      const totalSongs = this.musicList.length
      
      // 分批处理函数
      const processBatch = (startIndex) => {
        const endIndex = Math.min(startIndex + batchSize, totalSongs)
        
        // 处理当前批次
        for (let i = startIndex; i < endIndex; i++) {
          this.loadSongDuration(i)
        }
        
        // 处理下一批
        if (endIndex < totalSongs) {
          // 延迟1秒处理下一批，给浏览器时间处理
          setTimeout(() => {
            processBatch(endIndex)
          }, 1000)
        }
      }
      
      // 开始处理第一批
      processBatch(0)
    },
    // 加载单首歌曲的时长
    loadSongDuration(index) {
      const song = this.musicList[index]
      if (!song) return
      
      const tempAudio = new Audio()
      const audioPath = `/music/${encodeURIComponent(song.file)}`
      
      console.log('Loading duration for song:', song.name, 'from:', audioPath)
      tempAudio.src = audioPath
      tempAudio.preload = 'metadata' // 只预加载元数据，不加载整个音频
      
      // 加载元数据完成后获取时长
      tempAudio.addEventListener('loadedmetadata', () => {
        if (tempAudio.duration > 0) {
          console.log('Got duration for song:', song.name, ':', tempAudio.duration)
          this.$set(this.actualDurations, index, tempAudio.duration)
        }
        // 清理资源
        tempAudio.remove()
      })
      
      // 处理错误
      tempAudio.addEventListener('error', (e) => {
        console.warn('Error loading duration for song:', song.name, 'Error:', e)
        // 清理资源
        tempAudio.remove()
      })
      
      // 超时处理
      setTimeout(() => {
        tempAudio.remove()
      }, 5000) // 5秒后自动清理，避免资源泄漏
    },

  },
  computed: {
    currentSong() {
      return this.musicList[this.currentSongIndex] || { name: '未选择歌曲', artist: '', duration: '00:00' }
    },
    hasPrevious() {
      // 顺序模式下首曲目没有上一首，其它模式允许循环
      if (this.playMode === 'order') {
        return this.currentSongIndex > 0
      }
      return this.musicList.length > 1
    },
    hasNext() {
      // 顺序模式下尾曲目没有下一首，其它模式允许循环/随机
      if (this.playMode === 'order') {
        return this.currentSongIndex < this.musicList.length - 1
      }
      return this.musicList.length > 1
    },
    progressPercentage() {
      if (!this.duration) return 0
      return (this.currentTime / this.duration) * 100
    }
  },
  mounted() {
    console.log('MusicView mounted');
    // 创建音频元素
    this.createAudioElement();
    // 初始化动画效果
    this.initAnimations();
    // 预加载所有歌曲的实际时长
    this.preloadAllSongDurations();
    console.log('MusicView mounted completed');
  },
  beforeDestroy() {
    // 清理Firebase监听器
    if (this.musicListListener) {
      this.musicListListener();
    }
    // 销毁音频元素
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.removeEventListener('timeupdate', this.updateTime)
      this.audioElement.removeEventListener('ended', this.handleEnded)
      this.audioElement.removeEventListener('loadedmetadata', this.updateDuration)
      this.audioElement.removeEventListener('play', this.startAudioAnalysis)
      this.audioElement.removeEventListener('pause', this.stopAudioAnalysis)
      this.audioElement.removeEventListener('error', this.handleAudioError)
      this.audioElement.removeEventListener('canplay', this.handleCanPlay)
    }
  }
}
</script>

<style scoped>
.music-view {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.16);
  padding: 32px;
  backdrop-filter: saturate(140%) blur(6px);
}

/* 音乐站台标题 */
.music-header {
  text-align: center;
  margin-bottom: 48px;
}

.music-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.music-header p {
  font-size: 1.125rem;
  color: #64748b;
}

/* 同步状态指示器 */
.sync-status {
  font-size: 0.8rem;
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

.sync-status.synced {
  background: rgba(16, 185, 129, 0.2);
  color: #059669;
}

.sync-status.syncing {
  background: rgba(59, 130, 246, 0.2);
  color: #2563eb;
}

.sync-status.error {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.sync-status.idle {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

/* 音乐播放器 */
.music-player {
  background: #008C8C;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 48px;
  box-shadow: 0 12px 24px rgba(0, 140, 140, 0.3);
  color: white;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.current-song {
  text-align: center;
}

.current-song h2 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.current-song p {
  font-size: 1.125rem;
  opacity: 0.9;
}

.player-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.player-modes {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mode-btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
  color: #e5e7eb;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.mode-btn.active {
  background: #fbbf24;
  border-color: #fbbf24;
  color: #1f2933;
  font-weight: 600;
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-btn {
  width: 72px;
  height: 72px;
  font-size: 28px;
  background: rgba(255, 255, 255, 0.3);
}

.player-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.progress-filled {
  height: 100%;
  background: white;
  border-radius: 4px;
  transition: width 0.1s linear;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  opacity: 0.9;
}

.player-volume {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 300px;
  margin: 0 auto;
}

/* 重置所有range输入的默认样式 */
input[type="range"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: transparent;
  outline: none;
  border: none;
  box-shadow: none;
  cursor: pointer;
}

/* 音量滑块样式 */
.volume-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  outline: none;
  transition: all 0.3s ease;
}

/* WebKit浏览器 */
.volume-slider::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.3s ease;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  margin-top: -5px; /* 调整thumb位置 */
  background: white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: rgba(255, 255, 255, 0.9);
}

.volume-slider::-webkit-slider-thumb:active {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

/* Firefox浏览器 */
.volume-slider::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  box-shadow: none;
  transition: background 0.3s ease;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.volume-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  background: rgba(255, 255, 255, 0.9);
}

.volume-slider::-moz-range-thumb:active {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

/* 禁用所有focus状态的outline */
.volume-slider:focus,
.volume-slider:focus::-webkit-slider-runnable-track,
.volume-slider:focus::-moz-range-track {
  outline: none;
  box-shadow: none;
}

/* 确保滑块在所有状态下都能正常显示 */
.volume-slider:active,
.volume-slider:focus {
  outline: none;
  box-shadow: none;
}

/* 音频频谱可视化样式 */
.audio-spectrum {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 80px;
  margin-top: 20px;
  padding: 0 20px;
}

.spectrum-bar {
  width: 4px;
  min-height: 2px;
  border-radius: 2px;
  transition: height 0.1s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .audio-spectrum {
    height: 60px;
    gap: 3px;
    margin-top: 16px;
    padding: 0 10px;
  }
  
  .spectrum-bar {
    width: 3px;
  }
}

/* 音乐列表 */
.music-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.music-list h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.list-header {
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
}

.list-title {
  flex: 1;
}

.list-duration {
  width: 80px;
  text-align: right;
}

.song-list {
  max-height: 400px;
  overflow-y: auto;
}

.song-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.song-item:hover {
  background: #f8fafc;
}

.song-item.active {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.song-info {
  flex: 1;
}

.song-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.song-artist {
  font-size: 0.875rem;
  color: #64748b;
}

.song-item.active .song-artist {
  color: #667eea;
  opacity: 0.8;
}

.song-duration {
  width: 80px;
  text-align: right;
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-view {
    padding: 24px 16px;
  }
  
  .music-header h1 {
    font-size: 2rem;
  }
  
  .music-player {
    padding: 24px;
  }
  
  .current-song h2 {
    font-size: 1.5rem;
  }
  
  .control-btn {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .play-btn {
    width: 64px;
    height: 64px;
    font-size: 24px;
  }
  
  .list-header,
  .song-item {
    padding: 12px 16px;
  }
  
  .song-name {
    font-size: 0.875rem;
  }
  
  .song-artist {
    font-size: 0.75rem;
  }
  
  .song-duration {
    font-size: 0.75rem;
    width: 70px;
  }
}
</style>