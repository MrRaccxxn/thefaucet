//TODO: Improve this with codes instead of strings checkings

/**
 * Error handling utilities for user-facing and backend error management
 */

/**
 * Parses database errors and returns user-friendly messages
 * Logs technical details to console for backend debugging
 */
export const handleDatabaseError = (error: unknown, operation: string): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Log full technical details for backend/debugging
  console.error(`[DATABASE ERROR] Operation: ${operation}`);
  console.error('[DATABASE ERROR] Technical details:', {
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  // Check for foreign key constraint violations
  if (errorMessage.includes('violates foreign key constraint')) {
    if (errorMessage.includes('assets_chain_id_chains_chain_id_fk')) {
      console.error('[DATABASE ERROR] Missing chain configuration in database');
      return 'This network is not properly configured. Please contact support.';
    }
    
    if (errorMessage.includes('claims_user_id_users_id_fk')) {
      console.error('[DATABASE ERROR] User reference invalid');
      return 'Your session is invalid. Please sign in again.';
    }
    
    if (errorMessage.includes('claims_asset_id_assets_id_fk')) {
      console.error('[DATABASE ERROR] Asset reference invalid');
      return 'This asset is not available. Please try another asset.';
    }
    
    console.error('[DATABASE ERROR] Unknown foreign key constraint violation');
    return 'Database constraint error. Please contact support.';
  }
  
  // Check for unique constraint violations
  if (errorMessage.includes('duplicate key value violates unique constraint')) {
    console.error('[DATABASE ERROR] Duplicate entry attempted');
    return 'This operation has already been completed.';
  }
  
  // Check for connection errors
  if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
    console.error('[DATABASE ERROR] Connection failure');
    return 'Database connection error. Please try again in a moment.';
  }
  
  // Check for timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    console.error('[DATABASE ERROR] Operation timeout');
    return 'The operation took too long. Please try again.';
  }
  
  // Generic database error
  console.error('[DATABASE ERROR] Unhandled database error type');
  return 'A database error occurred. Please try again or contact support.';
};

/**
 * Parses blockchain/contract errors and returns user-friendly messages
 * Logs technical details to console for backend debugging
 */
export const handleBlockchainError = (error: unknown, operation: string): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Log full technical details for backend/debugging
  console.error(`[BLOCKCHAIN ERROR] Operation: ${operation}`);
  console.error('[BLOCKCHAIN ERROR] Technical details:', {
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  // Check for rate limiting
  if (errorMessage.includes('RateLimitExceeded') || errorMessage.includes('0xa74c1c5f')) {
    console.error('[BLOCKCHAIN ERROR] Rate limit exceeded on-chain');
    return 'Rate limit exceeded on the blockchain. Please wait and try again.';
  }
  
  // Check for insufficient balance
  if (errorMessage.includes('InsufficientBalance') || errorMessage.includes('insufficient funds')) {
    console.error('[BLOCKCHAIN ERROR] Insufficient balance in faucet wallet');
    return 'The faucet has insufficient balance. Please contact support.';
  }
  
  // Check for gas estimation failures
  if (errorMessage.includes('gas') || errorMessage.includes('estimate')) {
    console.error('[BLOCKCHAIN ERROR] Gas estimation failed');
    return 'Unable to estimate transaction cost. Please try again.';
  }
  
  // Check for network issues
  if (errorMessage.includes('network') || errorMessage.includes('provider')) {
    console.error('[BLOCKCHAIN ERROR] Network/provider issue');
    return 'Network connection error. Please check your connection and try again.';
  }
  
  // Check for contract reverts
  if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
    console.error('[BLOCKCHAIN ERROR] Contract execution reverted');
    return 'Transaction rejected by the contract. Please try again.';
  }
  
  // Generic blockchain error
  console.error('[BLOCKCHAIN ERROR] Unhandled blockchain error type');
  return 'A blockchain error occurred. Please try again or contact support.';
};

/**
 * General error handler that determines error type and routes to appropriate handler
 */
export const handleClaimError = (error: unknown, operation: string): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check if it's a database error
  if (errorMessage.includes('constraint') || 
      errorMessage.includes('duplicate key') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('column')) {
    return handleDatabaseError(error, operation);
  }
  
  // Check if it's a blockchain error
  if (errorMessage.includes('contract') ||
      errorMessage.includes('transaction') ||
      errorMessage.includes('revert') ||
      errorMessage.includes('gas') ||
      errorMessage.includes('provider')) {
    return handleBlockchainError(error, operation);
  }
  
  // Configuration errors
  if (errorMessage.includes('PRIVATE_KEY') || errorMessage.includes('not configured')) {
    console.error(`[CONFIG ERROR] ${operation}:`, errorMessage);
    return 'Faucet is not properly configured. Please contact support.';
  }
  
  // Deployment errors
  if (errorMessage.includes('not deployed') || errorMessage.includes('deployment')) {
    console.error(`[DEPLOYMENT ERROR] ${operation}:`, errorMessage);
    return 'This feature is not available on the selected network.';
  }
  
  // Generic error
  console.error(`[GENERAL ERROR] ${operation}:`, {
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  return 'An unexpected error occurred. Please try again or contact support.';
};

