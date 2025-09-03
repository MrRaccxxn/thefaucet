"use client";

import { useState, useEffect } from 'react';
import { ABIS, getDeploymentAddresses } from '@thefaucet/contracts';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// Default NFT images for testnets
const DEFAULT_NFT_IMAGES: Record<string, string> = {
  'ethereum': 'https://raw.githubusercontent.com/ethereum/ethereum-org-website/dev/public/images/eth-diamond-purple.png',
  'polygon': 'https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/matic.svg',
  'bsc': 'https://raw.githubusercontent.com/binance-chain/docs-site/master/docs/img/binance-chain.png',
  'lisk': 'https://raw.githubusercontent.com/LiskHQ/lisk-docs/main/static/img/logo.svg',
  'default': 'https://via.placeholder.com/500x500/6366F1/FFFFFF?text=NFT'
};