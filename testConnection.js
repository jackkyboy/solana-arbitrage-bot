const { getTokenPrice, getLiquidity } = require('./src/dexAPI');

// 🧪 ทดสอบการดึงข้อมูลจาก DEX API
async function testConnection(tokenAddress) {
  try {
    console.log('🚀 Testing connection to DEX API...');

    const price = await getTokenPrice(tokenAddress);
    const liquidity = await getLiquidity(tokenAddress);

    if (price && liquidity) {
      console.log(`✅ Connection Successful!`);
      console.log(`💰 Current Price of Token: ${price} USD`);
      console.log(`💧 Liquidity: ${liquidity}`);
    } else {
      console.log('❌ Connection Failed! No data received.');
    }
  } catch (error) {
    console.error('🚨 Connection Error:', error.message);
  }
}

// ⚡ ทดสอบด้วย Token Address จริง
const tokenAddress = 'So11111111111111111111111111111111111111112'; // ใส่ Token Address จริง
testConnection(tokenAddress);
