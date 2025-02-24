require('dotenv').config({ path: './config/.env' });
const { checkArbitrage } = require('./arbitrage');
const { shouldStopLoss, shouldTakeProfit } = require('./riskManagement');
const { executeTrade } = require('./executeTrade'); // ✅ นำเข้าแค่ครั้งเดียว
const { logTrade } = require('./logger');

let entryPrice = null;
let inTrade = false;

// ⚡️ HFT Variables
let lastPrice = null;

// 📉 Grid Trading Variables
const gridLevels = [17.0, 17.1, 17.2, 17.3, 17.4]; // เพิ่มความถี่ของ Grid Level
let gridTrades = {};

async function startBot() {
  console.log("🤖 Starting Solana Arbitrage Bot...");

  setInterval(async () => {
    try {
      const priceData = await checkArbitrage();
      const currentPrice = priceData.currentPrice;

      // 🔍 Arbitrage Opportunity
      if (priceData.isOpportunity && !inTrade) {
        console.log("🚀 Executing Arbitrage Trade...");
        entryPrice = currentPrice;
        inTrade = true;

        // ✅ Execute Trade (0.1 SOL)
        const tradeResult = await executeTrade(0.1);

        if (tradeResult) {
          console.log(`✅ Trade Successful! Transaction: ${tradeResult}`);
          logTrade({
            action: 'Buy (Arbitrage)',
            price: entryPrice,
            transaction: tradeResult,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log("❌ Trade failed!");
          inTrade = false;
        }
      }

      // 🔒 Stop-Loss / Take-Profit
      if (inTrade && entryPrice) {
        if (shouldTakeProfit(entryPrice, currentPrice, 1)) {
          console.log("💰 Take Profit Triggered! Closing trade.");
          inTrade = false;

          const tradeResult = await executeTrade(0.1);
          if (tradeResult) {
            logTrade({
              action: 'Sell (Take Profit)',
              price: currentPrice,
              transaction: tradeResult,
              timestamp: new Date().toISOString(),
            });
          }

          entryPrice = null;
        } else if (shouldStopLoss(entryPrice, currentPrice, 0.2)) {
          console.log("❌ Stop Loss Triggered! Closing trade.");
          inTrade = false;

          const tradeResult = await executeTrade(0.1);
          if (tradeResult) {
            logTrade({
              action: 'Sell (Stop Loss)',
              price: currentPrice,
              transaction: tradeResult,
              timestamp: new Date().toISOString(),
            });
          }

          entryPrice = null;
        }
      }

      // 📊 Grid Trading
      await checkGridTrading(currentPrice);

      // ⚡ High-Frequency Trading (HFT)
      await highFrequencyTrade(currentPrice);

    } catch (error) {
      console.error("🚨 Error in trading loop:", error.message);
    }
  }, 2000); // ตรวจสอบทุก 2 วินาที
}

async function checkGridTrading(currentPrice) {
  for (const level of gridLevels) {
    if (currentPrice <= level && !gridTrades[level]) {
      console.log(`🟢 Buying at grid level: ${level}`);
      gridTrades[level] = true;

      const tradeResult = await executeTrade(0.1);
      if (tradeResult) {
        logTrade({
          action: 'Buy (Grid)',
          price: level,
          transaction: tradeResult,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (currentPrice > level + 0.2 && gridTrades[level]) {
      console.log(`🔴 Selling at grid level: ${level + 0.2}`);
      gridTrades[level] = false;

      const tradeResult = await executeTrade(0.1);
      if (tradeResult) {
        logTrade({
          action: 'Sell (Grid)',
          price: level + 0.2,
          transaction: tradeResult,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}

async function highFrequencyTrade(currentPrice) {
  if (!lastPrice) {
    lastPrice = currentPrice;
    return;
  }

  const priceDifference = Math.abs(currentPrice - lastPrice);

  if (priceDifference >= 0.01) {
    console.log(`⚡ Quick trade detected (Diff: ${priceDifference.toFixed(4)})`);

    const tradeResult = await executeTrade(0.05); // เทรด 0.05 SOL
    if (tradeResult) {
      logTrade({
        action: 'Quick Trade (HFT)',
        price: currentPrice,
        transaction: tradeResult,
        timestamp: new Date().toISOString(),
      });
    }

    lastPrice = currentPrice;
  }
}

startBot();
