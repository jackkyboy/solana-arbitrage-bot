// /Users/apichet/solana-arbitrage-bot/src/transactionChecker.js
const { Connection } = require('@solana/web3.js');
require('dotenv').config({ path: './config/.env' });

// 🌐 สร้างการเชื่อมต่อกับ Solana RPC
const connection = new Connection(process.env.RPC_URL, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000, // เพิ่ม timeout เป็น 60 วินาที
});

async function confirmTransactionWithRetry(signature) {
  let attempts = 0;
  const maxAttempts = 10;
  const delay = 3000; // รอ 3 วินาทีก่อน retry

  while (attempts < maxAttempts) {
    try {
      // ตรวจสอบบล็อกล่าสุด
      const blockHeight = await connection.getBlockHeight();
      console.log(`🟢 Current block height: ${blockHeight}`);

      // ตรวจสอบธุรกรรม
      const result = await connection.getTransaction(signature, {
        encoding: 'jsonParsed'
      });

      if (result && result.meta && result.meta.err === null) {
        console.log(`✅ Transaction Confirmed: ${signature}`);
        return true;
      }

      console.log(`🔄 Retry attempt ${attempts + 1}/${maxAttempts}...`);

      // รอ 3 วินาทีก่อน retry
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    } catch (error) {
      console.error(`❌ Error confirming transaction (Attempt ${attempts + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, delay)); // รอให้แน่ใจก่อน retry
    }
  }

  console.error(`❌ Transaction not confirmed after ${maxAttempts} attempts.`);
  return false;
}

module.exports = { confirmTransactionWithRetry };
