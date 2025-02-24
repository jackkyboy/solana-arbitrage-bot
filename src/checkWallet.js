// /Users/apichet/solana-arbitrage-bot/src/checkWallet.js
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config({ path: './config/.env' });

// 🌐 สร้างการเชื่อมต่อกับ Solana RPC
const connection = new Connection(process.env.RPC_URL, 'confirmed');
const publicKey = new PublicKey(process.env.PUBLIC_KEY);

// ✅ ตรวจสอบยอดเงินคงเหลือของกระเป๋าเงิน
async function checkBalance() {
  try {
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / 1e9;
    console.log(`💰 Balance: ${solBalance.toFixed(6)} SOL`);
    return solBalance;
  } catch (error) {
    console.error('❌ Failed to check balance:', error);
    return 0;
  }
}

// ✅ ตรวจสอบการเชื่อมต่อและยอดเงิน
async function checkWallet() {
  try {
    // ตรวจสอบสถานะ RPC
    const version = await connection.getVersion();
    console.log('✅ Connected to Solana RPC Version:', version);

    // ตรวจสอบยอดเงิน
    const balance = await checkBalance();
    console.log(`👜 Wallet Address: ${publicKey.toBase58()}`);
    console.log(`💰 Balance: ${balance.toFixed(6)} SOL`);
  } catch (error) {
    console.error('❌ Failed to connect wallet:', error);
  }
}

// 🌟 ตรวจสอบว่าถูกเรียกโดยตรง หรือเป็นโมดูล
if (require.main === module) {
  checkWallet();
}

// 📤 Export สำหรับการใช้งานในไฟล์อื่น
module.exports = { checkBalance, connection, publicKey };
