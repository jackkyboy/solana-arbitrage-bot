// /Users/apichet/solana-arbitrage-bot/src/config.js
// /Users/apichet/solana-arbitrage-bot/src/config.js
module.exports = {
  // 🔗 Mint Addresses ของเหรียญหลัก
  SOL_MINT: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC

  // 💰 ตั้งค่าการเทรด
  TRADE_AMOUNT: 0.1, // จำนวน SOL ที่จะเทรดในแต่ละครั้ง
  TRANSACTION_FEE: 0.000005, // ค่าธรรมเนียมการทำธุรกรรม (เฉลี่ยต่อครั้ง)
  STOP_LOSS_PERCENTAGE: 2, // หยุดการขาดทุนเมื่อขาดทุน 2%
  TAKE_PROFIT_PERCENTAGE: 5, // ขายทำกำไรเมื่อกำไร 5%

  // 🔄 ตั้งค่าเพิ่มเติม
  COOLDOWN_TIME: 5 * 60 * 1000, // Cooldown 5 นาที (ในหน่วยมิลลิวินาที)
  SLIPPAGE_TOLERANCE: 0.25, // Slippage tolerance 0.25%
  PRIORITY_FEE: 0, // Priority Fee ในหน่วย SOL

  // 🔐 การเชื่อมต่อ RPC
  RPC_URL: 'https://solana-mainnet.rpc.yourprovider.com', // ใช้ RPC endpoint ส่วนตัวเพื่อลด Latency
};
