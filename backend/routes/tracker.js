const express = require('express');
const router = express.Router();

router.post('/location', (req, res) => {
  try {
    let rawData;
    
    // 检查请求体类型
    const contentType = req.get('Content-Type');
    console.log('Content-Type:', contentType);
    console.log('Request body:', req.body);
    
    if (contentType && contentType.includes('application/json')) {
      // JSON 格式
      rawData = req.body.data || req.body;
      console.log('Processing JSON format');
    } else {
      // 纯文本格式（嵌入式设备发送的格式）
      rawData = req.body;
      console.log('Processing plain text format');
    }
    
    // 确保数据是字符串
    const dataString = rawData.toString().trim();
    console.log('Raw data string:', dataString);
    
    // 解析数据：格式为 "IMEI&经度&高度&纬度"
    const fields = dataString.split('&');
    
    if (fields.length < 4) {
      console.error('Invalid data format. Expected 4 fields, got:', fields.length);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected: IMEI&longitude&height&latitude',
        received: dataString
      });
    }
    
    const locationData = {
      imei: fields[0].trim(),
      longitude: parseFloat(fields[1].trim()),
      height: parseFloat(fields[2].trim()),
      latitude: parseFloat(fields[3].trim()),
      timestamp: new Date().toISOString()
    };
    
    // 数据验证
    if (isNaN(locationData.longitude) || isNaN(locationData.latitude)) {
      console.error('Invalid coordinates:', locationData);
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
        data: locationData
      });
    }
    
    console.log('Parsed location data:', locationData);
    
    // 这里可以添加数据库存储逻辑
    // saveToDatabase(locationData);
    
    res.json({
      success: true,
      message: 'Location data received successfully',
      data: locationData
    });
    
  } catch (error) {
    console.error('Error processing location data:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing location data',
      error: error.message
    });
  }
});

module.exports = router;