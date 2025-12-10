import { parseTokens } from './blockchain';

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomBigInt(min: bigint, max: bigint): bigint {
  if (min >= max) return min;
  const range = max - min;
  const randomValue = BigInt(Math.floor(Math.random() * Number(range)));
  return min + randomValue;
}

export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = randomInt(minMs, maxMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function pickRandom<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

export function pickRandomExcluding<T>(array: T[], exclude: T): T {
  const filtered = array.filter((item) => item !== exclude);
  if (filtered.length === 0) {
    throw new Error('No items available after exclusion');
  }
  return pickRandom(filtered);
}

/**
 * Pick a wallet using weighted random selection where lower balance = higher probability
 * Uses inverse balance weighting: weight = 1 / (balance + 1)
 * @param wallets Array of wallets with balance property
 * @param exclude Wallet to exclude from selection (typically the sender)
 * @returns Selected wallet with lower-balance wallets having higher probability
 */
export function pickWeightedByLowBalance<T extends { balance: string; address: string }>(
  wallets: T[],
  exclude: T
): T {
  const filtered = wallets.filter((w) => w.address !== exclude.address);
  if (filtered.length === 0) {
    throw new Error('No wallets available after exclusion');
  }

  // Calculate weights inversely proportional to balance
  // Lower balance = higher weight
  const weights = filtered.map((wallet) => {
    const balance = BigInt(wallet.balance);
    // Add 1e18 (1 token) to avoid division issues and ensure even 0 balance wallets get reasonable weight
    // Use inverse: 1 / (balance + 1e18)
    // To avoid floating point, we'll use a large multiplier
    const denominator = balance + BigInt(1e18);
    // Weight = 1e36 / denominator (gives us a large integer weight)
    return BigInt(1e36) / denominator;
  });

  // Calculate total weight
  const totalWeight = weights.reduce((sum, w) => sum + w, 0n);

  // Pick random value between 0 and totalWeight
  const randomValue = BigInt(Math.floor(Math.random() * Number(totalWeight)));

  // Find which wallet the random value corresponds to
  let cumulative = 0n;
  for (let i = 0; i < filtered.length; i++) {
    cumulative += weights[i];
    if (randomValue < cumulative) {
      return filtered[i];
    }
  }

  // Fallback to last wallet (shouldn't normally reach here)
  return filtered[filtered.length - 1];
}

/**
 * Calculate transfer amount as a random percentage (1-30%) of the sender's balance
 * This creates more organic and varied transaction amounts
 */
export function calculateTransferAmount(balance: bigint, minBalance: bigint): bigint {
  const available = balance - minBalance;
  if (available <= 0n) return 0n;

  // Random percentage between 1% and 30%
  const percentage = randomInt(1, 30);

  // Calculate amount based on percentage of total balance (not just available)
  const amount = (balance * BigInt(percentage)) / 100n;

  // Ensure we don't go below minimum balance
  const maxTransferable = available;
  const finalAmount = amount > maxTransferable ? maxTransferable : amount;

  // Minimum transaction amount
  const minTx = parseTokens('0.01');
  if (finalAmount < minTx) return 0n;

  return finalAmount;
}
