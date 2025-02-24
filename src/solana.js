const {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config/.env' });

// 🌐 สร้างการเชื่อมต่อกับ Solana RPC
const connection = new Connection(process.env.RPC_URL, 'finalized');

// 🔑 โหลด Private Key
const privateKey = Uint8Array.from(process.env.PRIVATE_KEY.split(',').map(Number));
const keypair = Keypair.fromSecretKey(privateKey);

// 📂 Path สำหรับบันทึก log
const logPath = path.join(__dirname, '../logs/trades.log');

// 🔍 ตรวจสอบการเชื่อมต่อ RPC
async function checkRPCConnection() {
  try {
    const version = await connection.getVersion();
    console.log(`✅ Connected to Solana RPC Version:`, version);
  } catch (error) {
    console.error('❌ Failed to connect to Solana RPC:', error);
  }
}

// 🔍 เช็คยอดเงินคงเหลือใน Wallet
async function checkBalance() {
  try {
    const balance = await connection.getBalance(keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('❌ Failed to check balance:', error);
    return 0;
  }
}

// 📝 บันทึกธุรกรรมในไฟล์ log
function logTrade(tradeData) {
  const logEntry = `${new Date().toISOString()} - ${JSON.stringify(tradeData)}\n`;
  try {
    fs.appendFileSync(logPath, logEntry);
    console.log('📝 Trade logged:', logEntry);
  } catch (error) {
    console.error('❌ Error writing to log:', error);
  }
}

// ✅ ตรวจสอบการยืนยัน Transaction ด้วย `getTransaction()` และเพิ่ม Retry
async function confirmTransaction(signature) {
  try {
    console.log(`🔍 Checking confirmation for Transaction: ${signature}`);
    let attempt = 0;
    let confirmed = false;

    while (attempt < 5 && !confirmed) {
      const result = await connection.getTransaction(signature, { encoding: 'jsonParsed' });

      if (result && result.meta && result.meta.err === null) {
        console.log(`✅ Transaction Confirmed on Blockchain: ${signature}`);
        confirmed = true;
        break;
      }

      attempt++;
      console.log(`🔄 Retry attempt ${attempt}/5`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // รอ 5 วินาทีก่อน retry
    }

    if (!confirmed) {
      console.error(`❌ Transaction Failed or Not Confirmed after retries: ${signature}`);
    }

    return confirmed;
  } catch (error) {
    console.error('🚨 Error confirming transaction:', error);
    return false;
  }
}

// 🚀 ฟังก์ชันสำหรับการซื้อขาย SOL จริง
async function executeTrade(amountSOL, sellPriceUSDC) {
  try {
    console.log('📤 Starting a new trade...');

    // ตรวจสอบยอดเงินก่อนทำธุรกรรม
    const initialBalance = await checkBalance();
    console.log(`💰 Initial Balance: ${initialBalance.toFixed(4)} SOL`);

    // ตรวจสอบยอดเงินก่อน ถ้ายอดเงินไม่พอให้หยุด
    if (initialBalance < amountSOL) {
      console.error('❌ Insufficient SOL balance for trade.');
      return null;
    }

    // สร้าง Transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: keypair.publicKey, // เปลี่ยนเป็น Address ปลายทางจริง
        lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL),
      })
    );

    // ส่ง Transaction และรับ Signature
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    console.log(`📨 Transaction Signature: ${signature}`);
    console.log(`🔗 View transaction on Solana Explorer: https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`);

    // ยืนยันธุรกรรม
    const isConfirmed = await confirmTransaction(signature);

    if (isConfirmed) {
      // ตรวจสอบยอดเงินหลังจากทำธุรกรรม
      const finalBalance = await checkBalance();
      const deductedAmount = (initialBalance - finalBalance).toFixed(4);

      // คำนวณกำไร (Net Profit)
      const buyPrice = amountSOL; // ในหน่วย SOL
      const netProfit = (sellPriceUSDC - buyPrice).toFixed(4);

      // บันทึก Log เฉพาะเมื่อธุรกรรมยืนยันแล้ว
      logTrade({
        action: 'Trade Executed',
        amountSOL,
        transaction: signature,
        deductedSOL: deductedAmount,
        initialBalance,
        finalBalance,
        netProfit,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Trade completed! Deducted: ${deductedAmount} SOL`);
      console.log(`📊 Net Profit: ${netProfit} USDC`);
      return signature;
    } else {
      console.error('❌ Transaction was not confirmed after multiple retries.');
      return null;
    }
  } catch (error) {
    console.error('❌ Trade failed:', error);
    return null;
  }
}

module.exports = { executeTrade, checkRPCConnection };
