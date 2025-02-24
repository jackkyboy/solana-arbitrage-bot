const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ เปิดใช้งาน CORS
app.use(cors());

// 📂 Path ของไฟล์ log
const logPath = path.join(__dirname, '../logs/trades.log');

// 🔍 อ่าน log การเทรดจากไฟล์
app.get('/api/trades', (req, res) => {
  // ตรวจสอบว่ามีไฟล์หรือไม่
  if (!fs.existsSync(logPath)) {
    return res.status(404).json({ error: 'Log file not found' });
  }

  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Cannot read log file:', err);
      return res.status(500).json({ error: 'Cannot read log file' });
    }

    const trades = data
      .trim()
      .split('\n')
      .map((line) => {
        try {
          return JSON.parse(line.split(' - ')[1]);
        } catch (parseError) {
          console.error('❌ Error parsing log entry:', parseError);
          return null;
        }
      })
      .filter((entry) => entry !== null); // ลบ log ที่พังออก

    res.json(trades);
  });
});

// 🔥 ตรวจสอบสถานะของบอท
app.get('/api/status', (req, res) => {
  res.json({
    status: '🤖 Bot is running!',
    uptime: `${Math.floor(process.uptime() / 60)} mins`,
    lastChecked: new Date().toISOString(),
  });
});

// 🌍 เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`🌐 API server running at http://localhost:${PORT}`);
});
