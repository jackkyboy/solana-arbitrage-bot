// /Users/apichet/solana-arbitrage-bot/src/arbitrage.js
const axios = require('axios');
const { TRANSACTION_FEE } = require('./config');
const { executeTrade } = require('./executeTrade');
const { checkBalance } = require('./checkWallet');

// 📊 การตั้งค่าใหม่
const MIN_SPREAD = 1.2; // เพิ่มขั้นต่ำให้เทรดเฉพาะช่วงที่คุ้มค่า
const MAX_SPREAD = 1.5;
const MAX_RETRIES = 3;

const MIN_BALANCE_REQUIRED = 0.05;
const SLIPPAGE_TOLERANCE = 0.02; // Slippage เข้มขึ้น
const MAX_TRADE_AMOUNT = 0.015; // ลดการเทรดลง
const DELAY_BETWEEN_TRADES = 20000; // รอ 20 วินาที
const MAX_TRADES_PER_HOUR = 2; // จำกัดครั้งเทรด
const STOP_LOSS_THRESHOLD = 0.002; // 0.2% Stop-Loss

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// 🎯 ตัวแปรติดตามสถานะ
let tradeCount = 0;
let cumulativeLoss = 0;
let lastTradeTimestamp = Date.now();

// 📩 ส่งการแจ้งเตือน
async function sendNotification(message) {
  try {
    await axios.post(DISCORD_WEBHOOK_URL, { content: message });
  } catch (error) {
    console.error("❌ Failed to send notification:", error.message);
  }
}

// 🔍 ตรวจสอบค่าธรรมเนียมจริง
async function getActualTransactionFee() {
  try {
    const response = await axios.get('https://api.solscan.io/txs?limit=1');
    const fee = response.data.data[0]?.fee || 0.000005; // fallback
    return fee / 1e9; // แปลงจาก lamports → SOL
  } catch (error) {
    console.error("❌ Failed to fetch actual fee:", error.message);
    return TRANSACTION_FEE;
  }
}

// 🔍 ตรวจสอบ Arbitrage
async function checkArbitrage() {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const walletBalance = await checkBalance();
      if (walletBalance < MIN_BALANCE_REQUIRED) {
        console.warn(`⚠️ Balance too low: ${walletBalance.toFixed(4)} SOL`);
        return false;
      }

      // 🔄 รีเซ็ตการเทรดใหม่ทุก 1 ชั่วโมง
      if (Date.now() - lastTradeTimestamp > 3600000) {
        tradeCount = 0;
        lastTradeTimestamp = Date.now();
      }

      if (tradeCount >= MAX_TRADES_PER_HOUR) {
        console.log("⏸️ Max trades per hour reached.");
        return false;
      }

      const TRADE_AMOUNT = Math.min(walletBalance * 0.1, MAX_TRADE_AMOUNT);
      const amountInLamports = Math.floor(TRADE_AMOUNT * 1e9);

      // 🌐 เรียก API ราคาจาก Jupiter Aggregator
      const response = await axios.get(`https://quote-api.jup.ag/v6/quote`, {
        params: {
          inputMint: 'So11111111111111111111111111111111111111112',
          outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amount: amountInLamports,
        },
      });

      const data = response.data;

      if (data && data.outAmount && data.swapUsdValue) {
        const buyPrice = parseFloat(data.swapUsdValue);
        const sellPrice = parseFloat(data.outAmount) / 1e6;
        const actualFee = await getActualTransactionFee();

        console.log(`💰 Buy: ${buyPrice.toFixed(4)} USD | 💵 Sell: ${sellPrice.toFixed(4)} USDC`);

        const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
        console.log(`📊 Spread: ${spread.toFixed(2)}%`);

        // ✅ ตรวจสอบเงื่อนไขเทรด
        if (!isNaN(buyPrice) && !isNaN(sellPrice)) {
          const netProfit = sellPrice - buyPrice - actualFee;
          console.log(`📈 Net Profit: ${netProfit.toFixed(4)} USDC`);

          if (spread >= MIN_SPREAD && spread <= MAX_SPREAD && netProfit > 0) {
            console.log("🚀 Executing Trade...");

            const transactionSignature = await executeTrade(TRADE_AMOUNT);
            if (transactionSignature) {
              tradeCount++;
              await sendNotification(`🚨 **Trade Executed!**\n💰 Amount: ${TRADE_AMOUNT} SOL\n📈 Net Profit: ${netProfit.toFixed(4)} USDC`);
              console.log(`🔗 View on Explorer: https://explorer.solana.com/tx/${transactionSignature}?cluster=mainnet-beta`);
            } else {
              console.error("❌ Trade execution failed.");
            }

            await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_TRADES));
            return true;
          } else {
            console.warn("⚠️ Skipping trade: low spread or negative profit.");
            cumulativeLoss += netProfit < 0 ? Math.abs(netProfit) : 0;

            if (cumulativeLoss >= walletBalance * STOP_LOSS_THRESHOLD) {
              console.log("🛑 Stop-loss activated.");
              await sendNotification(`❌ **Stop-Loss Triggered!**\nCumulative Loss: ${cumulativeLoss.toFixed(4)} USDC`);
              return false;
            }
          }
        } else {
          console.warn("⚠️ Invalid price data, skipping.");
        }

        return false;
      } else {
        console.error("❌ Invalid response from API.");
        return false;
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        const delay = Math.pow(2, retries) * 300;
        console.warn(`⚠️ Too Many Requests. Retrying in ${delay} ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries++;
      } else {
        console.error("❌ Error:", error.message);
        return false;
      }
    }
  }

  console.error("❌ Max retries reached.");
  return false;
}

module.exports = { checkArbitrage };
