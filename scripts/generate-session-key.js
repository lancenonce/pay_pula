const { ethers } = require('ethers');

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log('\n=== Session Key Generation ===\n');
console.log('Private Key:', wallet.privateKey);
console.log('Address:', wallet.address);
console.log('\nAdd this private key to your .env.local file as NEXT_PUBLIC_AI_AGENT_PV_KEY\n');
console.log('⚠️  WARNING: Keep this private key secure and never commit it to version control!\n');
