const express = require('express');
const cors = require('cors');
const { loadData, saveData } = require('./storage');

const app = express();
const port = 3001;

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体

// API路由

// 获取统计数据
app.get('/api/stats/:key', (req, res) => {
  const { key } = req.params;
  const data = loadData(key);
  if (data !== null) {
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
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// 获取所有统计数据
app.get('/api/stats', (req, res) => {
  const keys = ['siteStats', 'todayStats', 'recentVisits', 'pageStats', 'trendData', 'durationStats'];
  const allData = {};
  
  keys.forEach(key => {
    allData[key] = loadData(key) || {};
  });
  
  res.json(allData);
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
