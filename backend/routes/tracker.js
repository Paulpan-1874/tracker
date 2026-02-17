const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// POST /api/tracker/location - 接收并保存定位数据
router.post('/location', async (req, res) => {
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
    
    // 保存到数据库
    const savedLocation = await prisma.location.create({
      data: {
        imei: locationData.imei,
        longitude: locationData.longitude,
        height: locationData.height,
        latitude: locationData.latitude,
        timestamp: new Date(locationData.timestamp)
      }
    });
    
    console.log('Location saved to database:', savedLocation);
    
    res.json({
      success: true,
      message: 'Location data received and saved successfully',
      data: savedLocation
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

// GET /api/tracker/locations - 获取所有定位记录
router.get('/locations', async (req, res) => {
  try {
    const { imei, limit = 100 } = req.query;
    
    const where = imei ? { imei } : {};
    
    const locations = await prisma.location.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });
    
    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
    
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
});

// GET /api/tracker/latest/:imei - 获取单个设备的最新位置
router.get('/latest/:imei', async (req, res) => {
  try {
    const { imei } = req.params;
    
    const latestLocation = await prisma.location.findFirst({
      where: { imei },
      orderBy: { timestamp: 'desc' }
    });
    
    if (!latestLocation) {
      return res.status(404).json({
        success: false,
        message: 'No location data found for this device'
      });
    }
    
    res.json({
      success: true,
      data: latestLocation
    });
    
  } catch (error) {
    console.error('Error fetching latest location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest location',
      error: error.message
    });
  }
});

// GET /api/tracker/stats/:imei - 获取设备统计信息
router.get('/stats/:imei', async (req, res) => {
  try {
    const { imei } = req.params;
    
    const totalLocations = await prisma.location.count({
      where: { imei }
    });
    
    const latestLocation = await prisma.location.findFirst({
      where: { imei },
      orderBy: { timestamp: 'desc' }
    });
    
    const oldestLocation = await prisma.location.findFirst({
      where: { imei },
      orderBy: { timestamp: 'asc' }
    });
    
    res.json({
      success: true,
      data: {
        imei,
        totalLocations,
        latestLocation,
        oldestLocation,
        firstRecordTime: oldestLocation?.timestamp,
        lastRecordTime: latestLocation?.timestamp
      }
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

module.exports = router;