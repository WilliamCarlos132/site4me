# OurNote 个人网站系统

## 系统概述

OurNote 是一个功能完整的个人网站系统，集成了访客跟踪、数据统计、内容管理等功能，支持部署到 Netlify。

### 主要功能

- **访客跟踪**：使用 FingerprintJS 识别访客身份，记录停留时长
- **数据统计**：实时统计网站访问数据，包括总访问量、访问人数、平均访问时长等
- **页面统计**：记录每个页面的访问次数，生成页面访问计数条形图
- **访问趋势**：展示最近几天的访问趋势图表
- **最近访问**：显示最近的访问记录，包括访问时间、页面、停留时长等
- **数据同步**：自动同步数据到 Firebase 数据库，确保数据安全
- **响应式设计**：适配不同设备尺寸，提供良好的用户体验

## 技术栈

### 前端
- Vue.js 2.x
- Vue Router
- FingerprintJS
- IconPark（图标库）

### 后端
- Express.js
- Node.js
- Firebase Realtime Database
- Netlify Functions（部署时使用）

### 数据存储
- 本地 JSON 文件（开发环境）
- Firebase Realtime Database（生产环境）

## 安装和部署

### 开发环境

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ournote-website
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动后端服务器**
   ```bash
   cd server
   node server.js
   ```

4. **启动前端开发服务器**
   ```bash
   npm run serve
   ```

5. **访问网站**
   打开浏览器，访问 http://localhost:8080

### 部署到 Netlify

1. **准备工作**
   - 确保项目中包含 `netlify.toml` 配置文件
   - 确保 `netlify/functions/analytics.js` 函数存在且配置正确

2. **部署步骤**
   - 登录 Netlify 账号
   - 点击 "New site from Git"
   - 选择项目仓库
   - 配置构建命令：`npm run build`
   - 配置发布目录：`dist`
   - 点击 "Deploy site"

3. **环境变量**
   如果需要配置环境变量，在 Netlify 控制台的 "Site settings" > "Build & deploy" > "Environment" 中设置

## 数据同步机制

### 前端数据发送

前端会在以下情况下发送页面访问数据：
- 页面失去焦点时
- 页面卸载前
- 页面卸载时

数据包括：访客ID、页面路径、停留时长、时间戳、来源等信息

### 后端数据处理

后端服务器收到数据后，会：
1. 更新本地 JSON 文件（开发和生产环境）
2. 同步数据到 Firebase 数据库
3. 处理 Firebase 密钥命名限制，将页面路径中的斜杠替换为下划线
4. 返回成功响应

### 数据获取

前端在加载页面时，会：
1. 优先从本地 JSON 文件加载数据（通过后端 API）
2. 如果本地数据与 Firebase 数据库不同，则使用 Firebase 数据更新本地文件
3. 显示数据到页面上

## 项目结构

```
├── netlify/            # Netlify 配置和函数
│   └── functions/      # Netlify Functions
├── public/             # 静态资源
│   ├── music/          # 音乐文件
│   └── theme/          # 主题相关文件
├── server/             # 后端服务器
│   ├── data/           # 本地数据存储
│   ├── server.js       # 后端服务器入口
│   └── storage.js      # 数据存储模块
├── src/                # 前端源代码
│   ├── api/            # API 调用
│   ├── assets/         # 静态资源
│   ├── components/     # 组件
│   ├── router/         # 路由配置
│   ├── views/          # 页面视图
│   ├── App.vue         # 根组件
│   └── main.js         # 前端入口
├── .eslintrc.js        # ESLint 配置
├── babel.config.js     # Babel 配置
├── netlify.toml        # Netlify 配置
├── package.json        # 项目配置和依赖
└── README.md           # 项目说明
```

## 核心模块

### AnalyticsTracker

`src/api/analytics.js` 实现了访客跟踪功能：
- 使用 FingerprintJS 识别访客身份
- 记录页面停留时长
- 发送页面访问数据到后端

### 数据存储

`server/storage.js` 实现了数据存储功能：
- 加载本地 JSON 文件
- 保存数据到本地 JSON 文件

### 后端 API

`server/server.js` 实现了后端 API：
- 处理页面访问数据
- 同步数据到 Firebase
- 提供数据查询接口

### 数据可视化

`src/views/NewsView.vue` 实现了数据可视化功能：
- 显示网站统计概览
- 展示访问趋势图表
- 显示最近访问记录
- 展示页面访问计数条形图

## 常见问题和解决方案

### 1. 数据不同步

**问题**：本地数据与 Firebase 数据不同步

**解决方案**：
- 检查后端服务器是否运行正常
- 检查 Firebase 配置是否正确
- 检查网络连接是否正常
- 确保 `storage.js` 中同时导出了 `loadData` 和 `saveData` 函数

### 2. 页面访问数据不显示

**问题**：页面访问计数条形图显示空白

**解决方案**：
- 检查 `pageStats` 数据是否存在
- 检查后端服务器是否正确处理页面访问数据
- 检查前端是否正确加载 `pageStats` 数据
- 确保 Firebase 密钥命名限制已正确处理（斜杠替换为下划线）

### 3. 部署到 Netlify 后数据不更新

**问题**：部署到 Netlify 后，数据不更新或显示空白

**解决方案**：
- 检查 Netlify Functions 是否正确配置
- 检查 Firebase 配置是否正确
- 检查前端 API 请求路径是否正确
- 确保 Netlify Functions 有足够的执行时间处理数据同步

### 4. 访客跟踪不工作

**问题**：访客跟踪功能不工作，无法记录访客信息

**解决方案**：
- 检查 FingerprintJS 是否正确初始化
- 检查前端是否正确发送页面访问数据
- 检查后端是否正确处理页面访问数据

### 5. 最新的更新内容没有自动实现在数据库中

**问题**：网站内容更新后，数据库中的数据没有相应更新

**解决方案**：
- 检查后端服务器是否正确配置了 Firebase 同步
- 确保 `syncDataToFirebase` 函数正确实现
- 检查 Firebase 数据库权限设置是否正确
- 确保页面路径中的特殊字符已正确处理

## 开发和维护

### 开发流程

1. **安装依赖**：`npm install`
2. **启动后端服务器**：`cd server && node server.js`
3. **启动前端开发服务器**：`npm run serve`
4. **构建生产版本**：`npm run build`

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 Vue.js 代码规范
- 保持代码风格一致

### 数据备份

定期备份 Firebase 数据，以防数据丢失：
1. 登录 Firebase 控制台
2. 进入项目设置
3. 点击 "导出数据"
4. 下载数据备份

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎联系：
- Email: [your-email@example.com]
- GitHub: [your-github-username]
