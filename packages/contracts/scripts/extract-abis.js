#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const contracts = [
  { name: 'FaucetManager', path: 'out/FaucetManager.sol/FaucetManager.json' },
  { name: 'DevToken', path: 'out/DevToken.sol/DevToken.json' },
  { name: 'DevNFT', path: 'out/DevNFT.sol/DevNFT.json' }
];

const abisDir = path.join(__dirname, '..', 'src', 'abis');

// Create abis directory if it doesn't exist
if (!fs.existsSync(abisDir)) {
  fs.mkdirSync(abisDir, { recursive: true });
}

contracts.forEach(({ name, path: contractPath }) => {
  const sourcePath = path.join(__dirname, '..', contractPath);
  const targetPath = path.join(abisDir, `${name}.json`);
  
  if (fs.existsSync(sourcePath)) {
    const contractData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const abiData = { abi: contractData.abi };
    fs.writeFileSync(targetPath, JSON.stringify(abiData));
    console.log(`✓ Extracted ABI for ${name}`);
  } else {
    console.error(`✗ Could not find ${sourcePath}`);
  }
});

console.log('ABI extraction complete!');