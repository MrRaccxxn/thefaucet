/**
 * Amount Formatting Utilities
 * 
 * Ensures token amounts are stored and displayed cleanly without
 * unnecessary decimal places while maintaining precision when needed.
 */

/**
 * Formats a token amount to remove trailing zeros and unnecessary decimals
 * 
 * @param amount - The amount as string or number
 * @param maxDecimals - Maximum number of decimal places (default: 18)
 * @returns Formatted amount as string (e.g., "100" instead of "100.000000000000000000")
 * 
 * @example
 * formatTokenAmount("100.000000000000000000") // "100"
 * formatTokenAmount("100.5") // "100.5"
 * formatTokenAmount("100.123456789012345678") // "100.123456789012345678"
 * formatTokenAmount(1000) // "1000"
 */
export function formatTokenAmount(
  amount: string | number,
  maxDecimals: number = 18
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  // Convert to string with maximum precision
  const amountStr = numAmount.toFixed(maxDecimals);
  
  // Remove trailing zeros and unnecessary decimal point
  return amountStr.replace(/\.?0+$/, '');
}

/**
 * Validates and formats an amount for database storage
 * Ensures the amount fits within numeric(30, 18) constraints
 * 
 * @param amount - The amount to validate and format
 * @returns Formatted amount string safe for database storage
 * @throws Error if amount exceeds database limits
 */
export function formatAmountForDB(amount: string | number): string {
  const formatted = formatTokenAmount(amount);
  const numAmount = parseFloat(formatted);
  
  // Check numeric(30, 18) limits:
  // - 12 digits before decimal (30 - 18 = 12)
  // - Max: 999,999,999,999
  const MAX_AMOUNT = 999_999_999_999;
  
  if (numAmount > MAX_AMOUNT) {
    throw new Error(
      `Amount ${numAmount} exceeds database limit (max: ${MAX_AMOUNT} tokens)`
    );
  }
  
  if (numAmount < 0) {
    throw new Error(`Amount cannot be negative: ${numAmount}`);
  }
  
  return formatted;
}

/**
 * Formats amount for display to users (with limited decimals)
 * 
 * @param amount - The amount to format
 * @param maxDisplayDecimals - Maximum decimals to show (default: 4)
 * @returns Formatted amount for display
 * 
 * @example
 * formatAmountForDisplay("100.123456789") // "100.1235"
 * formatAmountForDisplay("100") // "100"
 */
export function formatAmountForDisplay(
  amount: string | number,
  maxDisplayDecimals: number = 4
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return "0";
  }
  
  // Use toFixed for display decimals, then remove trailing zeros
  const formatted = numAmount.toFixed(maxDisplayDecimals);
  return formatted.replace(/\.?0+$/, '');
}

