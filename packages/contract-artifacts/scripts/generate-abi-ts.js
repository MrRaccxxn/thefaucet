#!/usr/bin/env node
/**
 * Converts Foundry-compiled ABIs to TypeScript files with const assertions
 * for proper type inference in Wagmi
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACTS_DIR = path.join(__dirname, '../../contracts');
const ARTIFACTS_DIR = path.join(__dirname, '../src/abis');

// Contracts to process
const contracts = [
  { name: 'FaucetManager', path: 'FaucetManager.sol/FaucetManager.json' },
  { name: 'DevToken', path: 'DevToken.sol/DevToken.json' },
  { name: 'DevNFT', path: 'DevNFT.sol/DevNFT.json' },
];

console.log('🔄 Generating TypeScript ABI files...\n');

contracts.forEach(({ name, path: contractPath }) => {
  const fullPath = path.join(CONTRACTS_DIR, 'out', contractPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Error: ${fullPath} not found`);
    process.exit(1);
  }

  // Read the compiled contract
  const compiled = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const abi = compiled.abi;

  // Generate TypeScript content
  const tsContent = `// Auto-generated from Foundry output
// Do not edit manually - run 'pnpm sync-abis' to update

export const ${name}ABI = ${JSON.stringify(abi, null, 2)} as const;
`;

  // Write TypeScript file
  const outputPath = path.join(ARTIFACTS_DIR, `${name}.ts`);
  fs.writeFileSync(outputPath, tsContent);
  
  console.log(`  ✅ Generated ${name}.ts`);
});

// Clean up old JSON files
console.log('\n🧹 Cleaning up old JSON files...');
const jsonFiles = ['FaucetManager.json', 'DevToken.json', 'DevNFT.json'];
jsonFiles.forEach(file => {
  const filePath = path.join(ARTIFACTS_DIR, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`  🗑️  Removed ${file}`);
  }
});

console.log('\n✅ ABI TypeScript files generated successfully!');
console.log('\nNext steps:');
console.log('  1. cd packages/contract-artifacts && pnpm build');
console.log('  2. Commit the updated ABIs');

