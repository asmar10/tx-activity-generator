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

export function calculateTransferAmount(balance: bigint, minBalance: bigint): bigint {
  const available = balance - minBalance;
  if (available <= 0n) return 0n;

  const minTx = parseTokens('0.01');
  const maxTx = available > parseTokens('2') ? parseTokens('2') : available;

  if (maxTx < minTx) return 0n;

  return randomBigInt(minTx, maxTx);
}
