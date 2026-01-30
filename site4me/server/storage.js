const fs = require('fs');
const path = require('path');

// 数据存储目录
const dataDir = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据文件路径
const dataFiles = {
  siteStats: path.join(dataDir, 'siteStats.json'),
  todayStats: path.join(dataDir, 'todayStats.json'),
  recentVisits: path.join(dataDir, 'recentVisits.json'),
  pageStats: path.join(dataDir, 'pageStats.json'),
  trendData: path.join(dataDir, 'trendData.json'),
  durationStats: path.join(dataDir, 'durationStats.json')
};

// 加载数据
function loadData(key) {
  try {
    const filePath = dataFiles[key];
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
    return null;
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
    return null;
  }
}

// 保存数据
function saveData(key, value) {
  try {
    const filePath = dataFiles[key];
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
    return false;
  }
}

// 初始化默认数据
function initDefaultData() {
  const defaultData = {
    siteStats: {
      pageViews: 0,
      uniqueVisitors: 0,
      averageTime: '--:--',
      pageCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      todayViews: 0
    },
    todayStats: {
      date: new Date().toISOString().split('T')[0],
      views: 0
    },
    recentVisits: [],
    pageStats: {},
    trendData: [],
    durationStats: {
      totalSeconds: 0,
      visits: 0
    }
  };

  // 初始化不存在的数据文件
  Object.keys(dataFiles).forEach(key => {
    if (!fs.existsSync(dataFiles[key])) {
      saveData(key, defaultData[key]);
    }
  });
}

// 初始化默认数据
initDefaultData();

module.exports = {
  loadData,
  saveData
};
