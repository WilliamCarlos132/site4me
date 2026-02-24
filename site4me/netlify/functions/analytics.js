const fs = require('fs');
const path = require('path');

// 数据存储路径
const dataDir = path.join(__dirname, '..', '..', 'server', 'data');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
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
async function syncToFirebase(data) {
  try {
    // 尝试加载Firebase配置
    const firebaseConfig = {
      // 这里需要填入你的Firebase配置
      apiKey: "AIzaSyC4vVqLqC3xG0G4eFv8s0X4eFv8s0X4eFv",
      authDomain: "ournote-31a07.firebaseapp.com",
      databaseURL: "https://ournote-31a07-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "ournote-31a07",
      storageBucket: "ournote-31a07.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:1234567890"
    };

    // 动态导入Firebase（避免在函数冷启动时加载）
    const { initializeApp } = await import('firebase/app');
    const { getDatabase, ref, set, update } = await import('firebase/database');

    // 初始化Firebase应用
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    // 准备要同步的数据
    const updates = {};
    
    // 同步最近访问记录
    const visitKey = `recentVisits/${Date.now()}`;
    updates[visitKey] = {
      time: new Date(data.timestamp).toLocaleString(),
      page: data.pagePath,
      duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60).toString().padStart(2, '0')}`,
      referrer: data.referrer,
      visitorId: data.visitorId.substring(0, 8)
    };

    // 同步访客ID（用于UV统计）
    updates[`knownVisitors/${data.visitorId}`] = true;

    // 执行更新
    await update(ref(db), updates);
    console.log('Data synced to Firebase:', data);
  } catch (error) {
    console.error('Failed to sync data to Firebase:', error);
  }
}

// 处理页面访问数据
exports.handler = async (event, context) => {
  try {
    const { visitorId, pagePath, duration, timestamp, referrer } = JSON.parse(event.body);
    
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

    // 获取访客IP地址
    const clientIp = event.headers['x-nf-client-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    
    // 更新最近访问记录
    const visit = {
      time: new Date(timestamp).toLocaleString(),
      page: getPageTitleFromPath(pagePath),
      duration: `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`,
      referrer: referrer,
      visitorId: visitorId.substring(0, 8), // 只显示部分ID以保护隐私
      location: clientIp, // 添加访客IP地址作为位置信息
      ip: clientIp // 单独存储访客IP地址
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
    syncToFirebase({ visitorId, pagePath, duration, timestamp, referrer });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Error processing analytics data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process analytics data' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};
