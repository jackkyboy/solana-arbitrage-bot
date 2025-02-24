const axios = require('axios');
const { SOL_MINT, USDC_MINT, TRADE_AMOUNT, SLIPPAGE_TOLERANCE } = require('../src/config');

async function fetchPrice() {
  try {
    const response = await axios.get(
      `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=${TRADE_AMOUNT * 1e9}&slippage=${SLIPPAGE_TOLERANCE}`
    );

    if (!response.data || !response.data.outAmount) {
      console.error('❌ No price data received from Jupiter API.');
      return null;
    }

    // แปลงราคาโดยใช้ decimal ที่ถูกต้อง (USDC = 1,000,000)
    const buyPrice = 1; // 1 SOL
    const sellPrice = parseFloat(response.data.outAmount) / 1_000_000; // แปลงจาก lamports → USDC

    console.log(`💰 Buy Price (SOL): ${buyPrice}`);
    console.log(`💵 Sell Price (USDC): ${sellPrice.toFixed(2)}`);

    return { buyPrice, sellPrice };
  } catch (error) {
    console.error('❌ Failed to fetch price data:', error.response ? error.response.data : error.message);
    return null;
  }
}

module.exports = { fetchPrice };
