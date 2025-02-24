// 🔒 เงื่อนไขการหยุดขาดทุน (Stop-Loss)
function shouldStopLoss(entryPrice, currentPrice, stopLossPercentage = 0.1) {
    const lossThreshold = entryPrice - (entryPrice * (stopLossPercentage / 100));
    return currentPrice <= lossThreshold;
  }
  
  // 💰 เงื่อนไขการทำกำไร (Take-Profit)
  function shouldTakeProfit(entryPrice, currentPrice, takeProfitPercentage = 0.3) {
    const profitThreshold = entryPrice + (entryPrice * (takeProfitPercentage / 100));
    return currentPrice >= profitThreshold;
  }
  
  module.exports = { shouldStopLoss, shouldTakeProfit };
  