import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';
import { chains } from './schema';
import { eq } from 'drizzle-orm';
import chainConfig from './config/chains.json';

const client = postgres(env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function seedChains() {
  try {
    console.log('Seeding chain data...');
    
    for (const chainData of chainConfig) {
      // Use the first RPC URL as primary, others as fallbacks
      const primaryRpcUrl = chainData.rpc[0];
      
      if (!primaryRpcUrl) {
        console.warn(`⚠️ No RPC URL found for chain ${chainData.name}, skipping...`);
        continue;
      }
      
      const dbChainData = {
        name: chainData.name,
        chainId: chainData.chainId,
        nativeSymbol: chainData.nativeCurrency.symbol,
        rpcUrl: primaryRpcUrl,
        blockExplorerUrl: chainData.explorers[0]?.url || '',
        isActive: chainData.isActive
      };

      // Check if chain already exists
      const existing = await db
        .select()
        .from(chains)
        .where(eq(chains.chainId, chainData.chainId))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(chains).values(dbChainData);
        console.log(`✅ Added chain: ${chainData.name} (${chainData.chainId})`);
      } else {
        // Update existing chain with latest data
        await db
          .update(chains)
          .set({
            name: dbChainData.name,
            nativeSymbol: dbChainData.nativeSymbol,
            rpcUrl: dbChainData.rpcUrl,
            blockExplorerUrl: dbChainData.blockExplorerUrl,
            isActive: dbChainData.isActive
          })
          .where(eq(chains.chainId, chainData.chainId));
        console.log(`🔄 Updated chain: ${chainData.name} (${chainData.chainId})`);
      }
    }
    
    console.log('✅ Chain seeding completed');
  } catch (error) {
    console.error('❌ Chain seeding failed:', error);
  } finally {
    await client.end();
  }
}


if (require.main === module) {
  seedChains();
}

export { seedChains };