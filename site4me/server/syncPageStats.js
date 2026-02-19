const fs = require('fs');
const path = require('path');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyC4vVqLqC3xG0G4eFv8s0X4eFv8s0X4eFv",
  authDomain: "ournote-31a07.firebaseapp.com",
  databaseURL: "https://ournote-31a07-default-rtdb.firebaseio.com",
  projectId: "ournote-31a07",
  storageBucket: "ournote-31a07.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:1234567890"
};

// 加载本地 pageStats 数据
function loadLocalPageStats() {
  try {
    const filePath = path.join(__dirname, 'data', 'pageStats.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load local pageStats:', error);
    return {};
  }
}

// 转换 pageStats 数据，将键名中的斜杠替换为下划线
function convertPageStatsKeys(pageStats) {
  const convertedPageStats = {};
  
  Object.keys(pageStats).forEach(key => {
    // 将键名中的斜杠替换为下划线
    const safeKey = key.replace(/\//g, '_');
    convertedPageStats[safeKey] = pageStats[key];
  });
  
  return convertedPageStats;
}

// 同步 pageStats 数据到 Firebase
async function syncPageStatsToFirebase() {
  try {
    console.log('Starting to sync pageStats to Firebase...');
    
    // 加载本地数据
    const originalPageStats = loadLocalPageStats();
    console.log('Original pageStats data:', originalPageStats);
    
    // 转换键名
    const convertedPageStats = convertPageStatsKeys(originalPageStats);
    console.log('Converted pageStats data:', convertedPageStats);
    
    // 加载 Firebase 模块
    const { initializeApp } = require('firebase/app');
    const { getDatabase, ref, set } = require('firebase/database');
    
    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    console.log('Firebase initialized successfully');
    
    // 同步数据到 Firebase
    await set(ref(db, 'pageStats'), convertedPageStats);
    console.log('pageStats synced to Firebase successfully!');
    
  } catch (error) {
    console.error('Failed to sync pageStats to Firebase:', error);
  }
}

// 执行同步
syncPageStatsToFirebase();
