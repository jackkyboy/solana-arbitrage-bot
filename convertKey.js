const bs58 = require('bs58');

// 🔑 ใส่ Base58 Private Key ตรงนี้ (แทนค่าจริงของคุณ)
const base58Key = '5EGbTqJRzt58b9kKbvZnSagPMvZcK32iYvtHvzaCcBP5v74nrQUGSgxTXcUh6889umPqJCq5tGvFJspgBhDgbCj3'; // แทนที่ด้วย Private Key จริงของคุณ

try {
  const decodedKey = bs58.decode(base58Key);
  console.log('✅ Uint8Array Private Key:', Array.from(decodedKey));
} catch (error) {
  console.error('❌ Error decoding Base58 key:', error.message);
}
