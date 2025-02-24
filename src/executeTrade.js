// /Users/apichet/solana-arbitrage-bot/src/executeTrade.js
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
  const connection = new Connection(process.env.RPC_URL, {
    commitment: 'finalized',
    confirmTransactionInitialTimeout: 60000,
  });
  
  // 🔑 โหลด Private Key
  const privateKey = Uint8Array.from(process.env.PRIVATE_KEY.split(',').map(Number));
  const keypair = Keypair.fromSecretKey(privateKey);
  
  // 📂 Path สำหรับบันทึก log
  const logPath = path.join(__dirname, '../logs/trades.log');
  
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
  
  // ✅ ตรวจสอบการยืนยัน Transaction ด้วย retries
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
  async function executeTrade(amountSOL) {
    try {
      console.log('📤 Starting a new trade...');
  
      // ตรวจสอบยอดเงินก่อนทำธุรกรรม
      const initialBalance = await checkBalance();
      console.log(`💰 Initial Balance: ${initialBalance.toFixed(4)} SOL`);
  
      if (initialBalance < amountSOL) {
        console.error('❌ Insufficient SOL balance for trade.');
        return null;
      }
  
      // อัปเดต blockhash ใหม่
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
      // สร้าง Transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: keypair.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: keypair.publicKey,
          lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL),
        })
      );
  
      // ส่ง Transaction และรับ Signature
      const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
      console.log(`📨 Transaction Signature: ${signature}`);
  
      if (signature) {
        console.log(`🔗 View transaction on Solana Explorer: https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`);
      } else {
        console.error("🚫 No Transaction Signature was returned.");
      }
  
      // ยืนยันธุรกรรม
      const isConfirmed = await confirmTransaction(signature);
  
      if (isConfirmed) {
        // รอ 5 วินาทีก่อนตรวจสอบยอดเงิน (เพื่อให้ RPC อัปเดต)
        await new Promise((resolve) => setTimeout(resolve, 5000));
  
        // ตรวจสอบยอดเงินหลังจากทำธุรกรรม
        const finalBalance = await checkBalance();
        const deductedAmount = (initialBalance - finalBalance).toFixed(4);
  
        // บันทึก Log เฉพาะเมื่อธุรกรรมยืนยันแล้ว
        logTrade({
          action: 'Trade Executed',
          amountSOL,
          transaction: signature,
          deductedSOL: deductedAmount,
          initialBalance,
          finalBalance,
          timestamp: new Date().toISOString(),
        });
  
        console.log(`✅ Trade completed! Deducted: ${deductedAmount} SOL`);
        return signature;
      } else {
        console.error('❌ Transaction was not confirmed after multiple retries.');
        return null;
      }
    } catch (error) {
      if (error.message.includes('block height exceeded')) {
        console.error('❌ Transaction expired: Block height exceeded. Retrying...');
      } else {
        console.error('❌ Trade failed:', error);
      }
      return null;
    }
  }
  
  module.exports = { executeTrade };
  