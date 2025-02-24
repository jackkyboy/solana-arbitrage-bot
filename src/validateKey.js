const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// แทนที่ด้วย Base58 Private Key ของคุณ
const base58Key = 'PASTE_YOUR_BASE58_PRIVATE_KEY_HERE';

// ตรวจสอบอักขระที่ไม่ใช่ Base58
function validateBase58(key) {
  const invalidChars = key.split('').filter(char => !base58Alphabet.includes(char));
  if (invalidChars.length > 0) {
    console.error(`❌ Invalid characters found: ${invalidChars.join(', ')}`);
  } else {
    console.log('✅ Key is a valid Base58 string');
  }
}

validateBase58(base58Key);
