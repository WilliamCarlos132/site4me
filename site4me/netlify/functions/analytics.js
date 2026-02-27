const fs = require('fs');
const path = require('path');

// 数据存储路径
const dataDir = path.join(__dirname, '..', '..', 'server', 'data');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 统一的时间格式化函数，确保时间戳格式一致
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  
  // 格式：YYYY/M/D HH:MM:SS（与预期格式一致）
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// 加载数据
function loadData(key) {
  try {
    const filePath = path.join(dataDir, `${key}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to load data:', error);
    return null;
  }
}

// 保存数据
function saveData(key, data) {
  try {
    const filePath = path.join(dataDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
}

// 同步数据到Firebase
async function syncToFirebase(data, clientIp) {
  try {
    // 尝试加载Firebase配置
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

    // 动态导入Firebase（避免在函数冷启动时加载）
    const { initializeApp } = await import('firebase/app');
    const { getDatabase, ref, set, update, get } = await import('firebase/database');

    // 初始化Firebase应用
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    // 获取现有的最近访问记录
    const recentVisitsRef = ref(db, 'recentVisits');
    
    // 准备新的访问记录
    const newVisit = {
      time: new Date(data.timestamp).toLocaleString(),
      page: getPageTitleFromPath(data.pagePath),
      duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60).toString().padStart(2, '0')}`,
      referrer: data.referrer,
      visitorId: data.visitorId.substring(0, 8),
      location: clientIp
    };

    // 先获取现有记录
    try {
      const snapshot = await get(recentVisitsRef);
      let recentVisits = [];
      if (snapshot.exists()) {
        recentVisits = Array.isArray(snapshot.val()) ? snapshot.val() : [];
      }
      
      // 添加新记录到开头
      recentVisits.unshift(newVisit);
      
      // 保持最多30条记录
      if (recentVisits.length > 30) {
        recentVisits = recentVisits.slice(0, 30);
      }
      
      // 更新整个最近访问记录数组
      await set(recentVisitsRef, recentVisits);
      console.log('Recent visits updated in Firebase:', recentVisits.length, 'records');
    } catch (error) {
      console.error('Failed to update recent visits:', error);
      // 备用方案：直接添加新记录
      const newVisitRef = ref(db, `recentVisits/${Date.now()}`);
      await set(newVisitRef, newVisit);
    }

    // 同步访客ID（用于UV统计）
    const knownVisitorsRef = ref(db, `knownVisitors/${data.visitorId}`);
    await set(knownVisitorsRef, true);

    console.log('Data synced to Firebase:', data);
  } catch (error) {
    console.error('Failed to sync data to Firebase:', error);
  }
}

// 处理数据查询和页面访问数据
exports.handler = async (event, context) => {
  try {
    // 处理GET请求 - 返回统计数据
    if (event.httpMethod === 'GET') {
      // 提取请求的数据类型（来自URL路径）
      const pathParts = event.path.split('/').filter(p => p);
      const dataType = pathParts[pathParts.length - 1]; // 获取最后一个路径段
      
      console.log('GET request for:', dataType);
      
      // 根据请求类型返回相应的数据
      let data = null;
      switch (dataType) {
        case 'siteStats':
          data = loadData('siteStats');
          break;
        case 'recentVisits':
          data = loadData('recentVisits');
          break;
        case 'pageStats':
          data = loadData('pageStats');
          break;
        case 'trendData':
          data = loadData('trendData');
          break;
        case 'durationStats':
          data = loadData('durationStats');
          break;
        case 'todayStats':
          data = loadData('todayStats');
          break;
        default:
          // 如果是列表请求，返回所有可用的数据
          const keys = ['siteStats', 'recentVisits', 'pageStats', 'trendData', 'durationStats', 'todayStats'];
          data = {};
          keys.forEach(key => {
            data[key] = loadData(key);
          });
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      };
    }
    
    // 处理POST请求 - 保存页面访问数据
    if (event.httpMethod === 'POST') {
      const { visitorId, pagePath, duration, timestamp, referrer } = JSON.parse(event.body);
      
      // 获取访客IP地址
      let clientIp = event.headers['x-nf-client-ip'] || event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    console.log('Client IP:', clientIp);
    
    // 处理IP地址格式
    if (clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }
    
    // 加载现有数据
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
    if (!pageStats[pagePath]) {
      pageStats[pagePath] = {
        name: pagePath,
        path: pagePath,
        views: 1
      };
    } else {
      pageStats[pagePath].views += 1;
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
      time: formatTimestamp(timestamp),
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
    
    // 保存所有数据
    saveData('siteStats', siteStats);
    saveData('pageStats', pageStats);
    saveData('recentVisits', recentVisits);
    saveData('durationStats', durationStats);
    saveData('knownVisitors', knownVisitors);
    saveData('todayStats', todayStats);
    
    // 同步数据到Firebase（异步执行，不阻塞响应）
    syncToFirebase({ visitorId, pagePath, duration, timestamp, referrer }, clientIp);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    }
    
    // 不支持的HTTP方法
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};
