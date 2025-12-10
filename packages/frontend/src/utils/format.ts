/**
 * Convert wei to ETH (or VANRY)
 * Wei is 10^18, so divide by 10^18 to get ETH
 */
export function formatWeiToEth(weiString: string): string {
  if (!weiString || weiString === '0') return '0';

  try {
    // Handle large numbers by using BigInt
    const wei = BigInt(weiString);
    const eth = Number(wei) / 1e18;

    // Format based on size
    if (eth >= 1000) {
      return eth.toFixed(2);
    } else if (eth >= 1) {
      return eth.toFixed(4);
    } else {
      return eth.toFixed(6);
    }
  } catch {
    // If it's already a decimal number, just format it
    const num = parseFloat(weiString);
    if (num > 1e15) {
      // Likely in wei, convert
      return (num / 1e18).toFixed(4);
    }
    return num.toFixed(4);
  }
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Shorten an address for display
 */
export function shortenAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}
