import { getDeploymentAddresses } from '../src/index';

console.log('Testing deployment loading...');
const deployment = getDeploymentAddresses('lisk-sepolia');
console.log('Deployment addresses:', deployment);

if (deployment) {
  console.log('✅ Deployment loaded successfully');
  console.log('FaucetManager:', deployment.faucetManager);
  console.log('DevNFT:', deployment.devNFT);
} else {
  console.log('❌ Failed to load deployment');
}
