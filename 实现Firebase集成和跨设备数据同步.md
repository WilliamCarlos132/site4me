# 实现Firebase集成和跨设备数据同步

## 项目分析
当前项目使用本地Node.js服务器（http://localhost:3001/api）存储和获取统计数据，使用localStorage作为备份，使用BroadcastChannel实现标签页间通信。但当网站部署到静态托管时，本地服务器将不可用，需要替换为Firebase等BaaS服务。

## 实现计划

### 1. 创建Firebase配置文件
- **文件**：`src/firebase.js`
- **内容**：使用用户提供的Firebase配置，初始化Firebase应用和实时数据库
- **功能**：导出数据库引用和相关方法

### 2. 修改路由文件
- **文件**：`src/router/index.js`
- **修改点**：
  - 导入Firebase配置和方法
  - 替换`apiRequest`函数为Firebase数据库操作
  - 修改`saveJSON`函数，使用Firebase存储数据
  - 修改`loadJSONFromAPI`函数，使用Firebase加载数据
  - 修改`initServerData`函数，从Firebase加载初始数据

### 3. 修改新闻视图文件
- **文件**：`src/views/NewsView.vue`
- **修改点**：
  - 导入Firebase配置和方法
  - 替换`apiRequest`函数为Firebase数据库操作
  - 替换`loadAllStats`方法，使用Firebase加载数据
  - 替换`initLocalStorageListeners`方法为`initFirebaseListeners`，使用Firebase实时监听
  - 修改`loadStats`、`loadRecentVisits`、`loadTrendData`和`loadPageRanking`方法，使用Firebase加载数据
  - 移除数据轮询，使用Firebase实时监听

### 4. 安装Firebase依赖
- **命令**：`npm install firebase`
- **目的**：添加Firebase SDK到项目

### 5. 测试和部署
- **测试**：启动本地开发服务器，在多个设备上测试数据同步
- **部署**：构建项目并部署到静态托管服务

## 技术要点
- 使用Firebase实时数据库作为中央数据存储
- 保留localStorage作为备份，确保在Firebase不可用时仍能工作
- 使用Firebase的`onValue`方法实现实时数据同步
- 使用Firebase的`set`和`get`方法实现数据存储和加载

## 预期结果
- 网站部署到静态托管后，所有访客都能看到相同的实时访问统计数据
- 不同设备、不同浏览器、不同IP地址的用户都能看到同步的统计数据
- 数据更新实时显示，无需手动刷新页面