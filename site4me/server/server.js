const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { loadData, saveData } = require('./storage');

const app = express();
const port = 3001;

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/theme');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'background-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件 (JPEG, PNG, WebP, GIF)'));
    }
  }
});

// 数据缓存
const dataCache = {};
const cacheExpiry = {};
const CACHE_DURATION = 30000; // 缓存持续时间（毫秒）

// 检查缓存是否有效
function isCacheValid(key) {
  return dataCache[key] && cacheExpiry[key] && Date.now() - cacheExpiry[key] < CACHE_DURATION;
}

// 清除过期缓存
function clearExpiredCache() {
  const now = Date.now();
  Object.keys(cacheExpiry).forEach(key => {
    if (now - cacheExpiry[key] >= CACHE_DURATION) {
      delete dataCache[key];
      delete cacheExpiry[key];
    }
  });
}

// 定期清除过期缓存
setInterval(clearExpiredCache, 60000);

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyB8HAycmID1P7Ztu-ETZfyf_vqrniw_8u4",
  authDomain: "ournote-31a07.firebaseapp.com",
  databaseURL: "https://ournote-31a07-default-rtdb.firebaseio.com",
  projectId: "ournote-31a07",
  storageBucket: "ournote-31a07.firebasestorage.app",
  messagingSenderId: "1060792276650",
  appId: "1:1060792276650:web:23688a868dd51138fb22d3",
  measurementId: "G-S5K4Q3MYXN"
};

// 初始化Firebase应用和数据库实例
let firebaseApp = null;
let firebaseDb = null;

// 初始化Firebase
function initFirebase() {
  if (!firebaseApp) {
    try {
      console.log('Initializing Firebase...');
      const { initializeApp } = require('firebase/app');
      const { getDatabase } = require('firebase/database');
      console.log('Firebase modules loaded successfully');
      firebaseApp = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
      firebaseDb = getDatabase(firebaseApp);
      console.log('Firebase database initialized successfully');
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }
  return firebaseDb;
}

// 同步 Firebase 数据到本地 JSON 文件
async function syncFirebaseToLocal() {
  try {
    console.log('开始同步 Firebase 数据到本地 JSON 文件...');
    
    // 初始化 Firebase
    const db = initFirebase();
    
    // 动态导入 Firebase 方法
    const { ref, get } = require('firebase/database');
    
    // 需要同步的数据键
    const keysToSync = ['siteStats', 'todayStats', 'recentVisits', 'pageStats', 'trendData', 'durationStats', 'knownVisitors'];
    
    let syncCount = 0;
    
    // 同步每个数据键
    for (const key of keysToSync) {
      try {
        console.log(`同步 ${key} 数据...`);
        
        // 从 Firebase 加载数据
        const snapshot = await get(ref(db, key));
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          console.log(`从 Firebase 获取 ${key} 数据:`, firebaseData);
          
          // 从本地加载数据
          const localData = loadData(key);
          console.log(`从本地获取 ${key} 数据:`, localData);
          
          // 比较数据是否不同
          const dataDifferent = JSON.stringify(firebaseData) !== JSON.stringify(localData);
          
          if (dataDifferent) {
            console.log(`${key} 数据不同，更新本地文件...`);
            // 更新本地文件
            saveData(key, firebaseData);
            // 清除缓存
            delete dataCache[key];
            delete cacheExpiry[key];
            syncCount++;
            console.log(`${key} 数据更新成功`);
          } else {
            console.log(`${key} 数据相同，无需更新`);
          }
        } else {
          console.log(`Firebase 中没有 ${key} 数据`);
        }
      } catch (error) {
        console.error(`同步 ${key} 数据失败:`, error);
      }
    }
    
    console.log(`Firebase 同步完成，更新了 ${syncCount} 个数据文件`);
  } catch (error) {
    console.error('Firebase 同步失败:', error);
  }
}

// 设置Firebase实时监听
function setupFirebaseListeners() {
  try {
    console.log('Setting up Firebase real-time listeners...');
    
    // 初始化 Firebase
    const db = initFirebase();
    
    // 动态导入 Firebase 方法
    const { ref, onValue } = require('firebase/database');
    
    // 需要监听的数据键
    const keysToListen = ['siteStats', 'todayStats', 'recentVisits', 'pageStats', 'trendData', 'durationStats', 'knownVisitors'];
    
    // 为每个数据键设置监听
    keysToListen.forEach(key => {
      console.log(`Setting up listener for ${key}...`);
      
      onValue(ref(db, key), (snapshot) => {
        try {
          if (snapshot.exists()) {
            const firebaseData = snapshot.val();
            console.log(`Firebase ${key} data changed:`, firebaseData);
            
            // 从本地加载数据
            const localData = loadData(key);
            
            // 比较数据是否不同
            const dataDifferent = JSON.stringify(firebaseData) !== JSON.stringify(localData);
            
            if (dataDifferent) {
              console.log(`${key} data different, updating local file...`);
              // 更新本地文件
              saveData(key, firebaseData);
              // 清除缓存
              delete dataCache[key];
              delete cacheExpiry[key];
              console.log(`${key} local file updated successfully`);
            }
          }
        } catch (error) {
          console.error(`Error in Firebase listener for ${key}:`, error);
        }
      }, (error) => {
        console.error(`Firebase listener error for ${key}:`, error);
      });
    });
    
    console.log('Firebase real-time listeners setup successfully');
  } catch (error) {
    console.error('Failed to setup Firebase listeners:', error);
  }
}

// 启动时同步一次
setTimeout(syncFirebaseToLocal, 5000);

// 设置Firebase实时监听
setTimeout(setupFirebaseListeners, 10000);

// 定期同步（每5分钟）- 作为备份机制
setInterval(syncFirebaseToLocal, 5 * 60 * 1000);

// API路由

// 获取统计数据
app.get('/api/stats/:key', (req, res) => {
  const { key } = req.params;
  
  // 检查缓存
  if (isCacheValid(key)) {
    console.log(`Cache hit for ${key}`);
    return res.json(dataCache[key]);
  }
  
  // 缓存未命中，从文件加载
  const data = loadData(key);
  if (data !== null) {
    // 更新缓存
    dataCache[key] = data;
    cacheExpiry[key] = Date.now();
    console.log(`Cache miss for ${key}, loaded from file`);
    res.json(data);
  } else {
    res.status(404).json({ error: 'Data not found' });
  }
});

// 保存统计数据
app.post('/api/stats/:key', (req, res) => {
  const { key } = req.params;
  const data = req.body;
  const success = saveData(key, data);
  if (success) {
    // 清除对应缓存，确保下次请求能获取最新数据
    delete dataCache[key];
    delete cacheExpiry[key];
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// 获取所有统计数据
app.get('/api/stats', (req, res) => {
  const keys = ['siteStats', 'todayStats', 'recentVisits', 'pageStats', 'trendData', 'durationStats'];
  const allData = {};
  let cacheHits = 0;
  let cacheMisses = 0;
  
  keys.forEach(key => {
    // 检查缓存
    if (isCacheValid(key)) {
      allData[key] = dataCache[key];
      cacheHits++;
    } else {
      // 缓存未命中，从文件加载
      allData[key] = loadData(key) || {};
      // 更新缓存
      dataCache[key] = allData[key];
      cacheExpiry[key] = Date.now();
      cacheMisses++;
    }
  });
  
  console.log(`Cache hits: ${cacheHits}, Cache misses: ${cacheMisses}`);
  res.json(allData);
});

// 处理前端发送的页面访问数据
app.post('/api/analytics/pageview', async (req, res) => {
  try {
    console.log('Received page view request:', req.body);
    const { visitorId, pagePath, duration, timestamp, referrer, port } = req.body;
    
    // 获取访客IP地址
    let clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    console.log('Client IP:', clientIp);
    
    // 将IPv6本地回环地址替换为更友好的localhost:端口号
    if (clientIp === '::1' || clientIp === 'localhost' || clientIp.includes('::1')) {
      if (port) {
        clientIp = `localhost:${port}`;
      } else {
        clientIp = 'localhost';
      }
    }
    
    // 加载现有数据
    console.log('Loading existing data...');
    const siteStats = loadData('siteStats') || {
      pageViews: 0,
      uniqueVisitors: 0,
      averageTime: '--:--',
      pageCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      todayViews: 0
    };
    
    const pageStats = loadData('pageStats') || {};
    const recentVisits = loadData('recentVisits') || [];
    const durationStats = loadData('durationStats') || {
      totalSeconds: 0,
      visits: 0
    };
    const knownVisitors = loadData('knownVisitors') || [];
    const todayStats = loadData('todayStats') || {
      date: new Date().toISOString().split('T')[0],
      views: 0
    };
    
    console.log('Existing data loaded successfully:', {
      siteStats,
      pageStats,
      recentVisits,
      durationStats,
      knownVisitors,
      todayStats
    });
    
    // 更新PV统计
    siteStats.pageViews += 1;
    
    // 更新今日访问量
    const today = new Date().toISOString().split('T')[0];
    if (todayStats.date === today) {
      todayStats.views += 1;
    } else {
      todayStats.date = today;
      todayStats.views = 1;
    }
    
    // 更新UV统计（去重）
    if (!knownVisitors.includes(visitorId)) {
      knownVisitors.push(visitorId);
      siteStats.uniqueVisitors = knownVisitors.length;
    }
    
    // 更新页面统计
    // 将页面路径中的斜杠替换为下划线，以便Firebase能够接受这些键名
    const safePagePath = pagePath.replace(/\//g, '_');
    if (!pageStats[safePagePath]) {
      pageStats[safePagePath] = {
        name: pagePath,
        path: pagePath,
        views: 1
      };
    } else {
      pageStats[safePagePath].views += 1;
    }
    
    // 更新停留时长统计
    durationStats.totalSeconds += duration;
    durationStats.visits += 1;
    
    // 计算平均停留时间
    const avgSeconds = durationStats.visits > 0 ? durationStats.totalSeconds / durationStats.visits : 0;
    const avgMinutes = Math.floor(avgSeconds / 60);
    const avgSecs = Math.floor(avgSeconds % 60);
    siteStats.averageTime = `${avgMinutes.toString().padStart(2, '0')}:${avgSecs.toString().padStart(2, '0')}`;
    
    // 路径到中文标题的映射
    function getPageTitleFromPath(path) {
      const pathTitleMap = {
        '/': '首页',
        '/home': '首页',
        '/blog': '博客',
        '/music': '音乐站台',
        '/news': '网站资讯',
        '/updates': '更新动态',
        '/guestbook': '留言板',
        '/quotes': '幸运曲奇',
        '/vote': '投票广场',
        '/admin': '后台管理',
        '/havefun': 'havefun',
        '/havefun/lights': '熄灯游戏',
        '/havefun/cipher': '文字加密与解密器',
        '/havefun/monty': '三门问题',
        '/havefun/boring': '无聊字符串',
        '/havefun/minesweeper': '扫雷'
      };
      return pathTitleMap[path] || path;
    }

    // 更新最近访问记录
    const visit = {
      time: new Date(timestamp).toLocaleString(),
      page: getPageTitleFromPath(pagePath),
      duration: `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`,
      referrer: referrer,
      visitorId: visitorId.substring(0, 8), // 只显示部分ID以保护隐私
      location: clientIp // 添加访客IP地址作为位置信息
    };
    recentVisits.unshift(visit);
    if (recentVisits.length > 30) {
      recentVisits.splice(30);
    }
    
    // 保存所有数据到本地文件
    console.log('Saving data to local files...');
    saveData('siteStats', siteStats);
    saveData('pageStats', pageStats);
    saveData('recentVisits', recentVisits);
    saveData('durationStats', durationStats);
    saveData('knownVisitors', knownVisitors);
    saveData('todayStats', todayStats);
    console.log('Data saved to local files successfully');
    
    // 同步数据到Firebase（异步执行，不阻塞响应）
    console.log('Starting to sync data to Firebase...');
    console.log('Data to sync:', {
      siteStats,
      pageStats,
      recentVisits,
      durationStats,
      knownVisitors,
      todayStats
    });
    try {
      await syncDataToFirebase(siteStats, pageStats, recentVisits, durationStats, knownVisitors, todayStats);
      console.log('Data sync to Firebase completed successfully');
    } catch (error) {
      console.error('Failed to sync data to Firebase:', error);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing analytics data:', error);
    res.status(500).json({ error: 'Failed to process analytics data' });
  }
});

// 全局Firebase应用和数据库实例已在文件顶部定义

// 同步数据到Firebase
async function syncDataToFirebase(siteStats, pageStats, recentVisits, durationStats, knownVisitors, todayStats) {
  try {
    const { ref, update } = require('firebase/database');
    
    // 初始化Firebase
    const db = initFirebase();
    
    // 准备要更新的数据
    const updates = {};
    
    // 更新站点统计
    updates['siteStats'] = siteStats;
    
    // 更新页面统计
    updates['pageStats'] = pageStats;
    
    // 更新最近访问记录
    updates['recentVisits'] = recentVisits;
    
    // 更新停留时长统计
    updates['durationStats'] = durationStats;
    
    // 更新已知访客
    updates['knownVisitors'] = knownVisitors;
    
    // 更新今日统计
    updates['todayStats'] = todayStats;
    
    // 执行更新
    await update(ref(db), updates);
    console.log('Data synced to Firebase successfully');
  } catch (error) {
    console.error('Failed to sync data to Firebase:', error);
    throw error;
  }
}

// 上传背景图片
app.post('/api/upload/background', upload.single('background'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }
    
    // 构建文件的访问URL
    const fileUrl = `/theme/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      message: '背景图片上传成功',
      fileUrl: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ 
      error: `上传失败: ${error.message || '未知错误'}` 
    });
  }
});

// 获取背景图片列表
app.get('/api/backgrounds', (req, res) => {
  try {
    const themeDir = path.join(__dirname, '../public/theme');
    
    // 读取目录下的所有文件
    const files = fs.readdirSync(themeDir);
    
    // 过滤出图片文件
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });
    
    // 构建图片URL列表
    const imageUrls = imageFiles.map(file => `/theme/${file}`);
    
    res.json(imageUrls);
  } catch (error) {
    console.error('获取背景图片列表失败:', error);
    res.status(500).json({ error: '获取背景图片列表失败' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
