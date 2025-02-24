const fs = require('fs');
const path = require('path');

// 📂 สร้างเส้นทางสำหรับ log
const logDir = path.join(__dirname, '../logs');
const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-'); // รูปแบบเวลาให้ไม่มีตัวอักษรต้องห้าม
const newLogFile = `trades_${dateSuffix}.log`;
const logPath = path.join(logDir, newLogFile);

// ตรวจสอบว่ามีโฟลเดอร์ logs หรือไม่ ถ้าไม่มีให้สร้างขึ้นมา
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log('📂 Logs directory created.');
}

// ✏️ สร้าง log ใหม่และบันทึก trade ใหม่ในไฟล์แยก
function logTrade(tradeData) {
  const logEntry = `[${new Date().toLocaleString()}] - ${JSON.stringify(tradeData)}\n`;

  try {
    fs.appendFileSync(logPath, logEntry);
    console.log(`📝 Trade logged in ${newLogFile}: ${tradeData.action} at price ${tradeData.price}`);
  } catch (error) {
    console.error('❌ Error writing to log file:', error);
  }
}

// 🔥 บันทึก Error log โดยไม่ลบของเก่า
function logError(errorMessage) {
  const errorLogPath = path.join(logDir, 'error.log');
  const errorEntry = `[${new Date().toLocaleString()}] - ERROR: ${errorMessage}\n`;

  try {
    fs.appendFileSync(errorLogPath, errorEntry);
    console.error(`🚨 Error logged: ${errorMessage}`);
  } catch (error) {
    console.error('🚫 Failed to write error log:', error);
  }
}

module.exports = { logTrade, logError };
