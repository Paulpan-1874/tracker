const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 允许跨域请求
app.use(cors());

// 解析 JSON 请求体
app.use(bodyParser.json());

// 解析 URL 编码的请求体
app.use(bodyParser.urlencoded({ extended: true }));

// 解析纯文本请求体（关键：适配嵌入式设备）
app.use(bodyParser.text({ type: '*/*' }));

// 导入路由
const trackerRoutes = require('./routes/tracker');
app.use('/api/tracker', trackerRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tracker backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/tracker/location`);
});