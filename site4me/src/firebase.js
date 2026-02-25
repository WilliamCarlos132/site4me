// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, runTransaction, remove, update } from 'firebase/database';

// Your web app's Firebase configuration
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

// Initialize Firebase
let db;
let firebaseApp;
let connectionStatus = 'disconnected';

try {
  console.log('开始初始化Firebase...');
  console.log('Firebase配置:', {
    apiKey: firebaseConfig.apiKey ? '***' : '缺失',
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId
  });
  
  firebaseApp = initializeApp(firebaseConfig);
  console.log('Firebase应用初始化成功');
  
  db = getDatabase(firebaseApp);
  console.log('Firebase数据库初始化成功');
  
  connectionStatus = 'connected';
  console.log('Firebase初始化成功，连接状态:', connectionStatus);
} catch (error) {
  console.error('Firebase初始化失败:', error);
  console.error('Firebase错误详情:', error.message);
  console.error('Firebase错误堆栈:', error.stack);
  
  // 不再使用mock实现，而是抛出错误，确保开发者知道Firebase初始化失败
  throw new Error(`Firebase初始化失败: ${error.message}`);
}

// Export database references and connection status
export { db, ref, set, onValue, get, runTransaction, remove, update, connectionStatus };
