// Mock the blockchain module before importing random
jest.mock('../../utils/blockchain', () => ({
  parseTokens: (amount: string | number) => {
    const value = parseFloat(amount.toString());
    return BigInt(Math.floor(value * 1e18));
  },
}));

import {
  randomInt,
  randomBigInt,
  randomDelay,
  pickRandom,
  pickRandomExcluding,
  calculateTransferAmount,
} from '../../utils/random';

describe('Random Utilities', () => {
  describe('randomInt', () => {
    it('should return a number within the specified range', () => {
      const min = 5;
      const max = 10;

      for (let i = 0; i < 100; i++) {
        const result = randomInt(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should return min when min equals max', () => {
      const result = randomInt(5, 5);
      expect(result).toBe(5);
    });

    it('should handle zero range', () => {
      const result = randomInt(0, 0);
      expect(result).toBe(0);
    });

    it('should handle negative numbers', () => {
      for (let i = 0; i < 50; i++) {
        const result = randomInt(-10, -5);
        expect(result).toBeGreaterThanOrEqual(-10);
        expect(result).toBeLessThanOrEqual(-5);
      }
    });

    it('should handle negative to positive range', () => {
      for (let i = 0; i < 50; i++) {
        const result = randomInt(-5, 5);
        expect(result).toBeGreaterThanOrEqual(-5);
        expect(result).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('randomBigInt', () => {
    it('should return a bigint within the specified range', () => {
      const min = 100n;
      const max = 200n;

      for (let i = 0; i < 100; i++) {
        const result = randomBigInt(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
        expect(typeof result).toBe('bigint');
      }
    });

    it('should return min when min equals max', () => {
      const result = randomBigInt(50n, 50n);
      expect(result).toBe(50n);
    });

    it('should return min when min is greater than max', () => {
      const result = randomBigInt(100n, 50n);
      expect(result).toBe(100n);
    });

    it('should handle zero', () => {
      const result = randomBigInt(0n, 0n);
      expect(result).toBe(0n);
    });

    it('should handle large bigint values', () => {
      const min = BigInt('1000000000000000000'); // 1e18
      const max = BigInt('2000000000000000000'); // 2e18

      for (let i = 0; i < 50; i++) {
        const result = randomBigInt(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
      }
    });
  });

  describe('randomDelay', () => {
    it('should resolve after a delay', async () => {
      const start = Date.now();
      await randomDelay(10, 20);
      const elapsed = Date.now() - start;

      // Allow some tolerance for timing
      expect(elapsed).toBeGreaterThanOrEqual(9);
      expect(elapsed).toBeLessThan(100); // Should not take too long
    });

    it('should return a promise', () => {
      const result = randomDelay(1, 2);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('pickRandom', () => {
    it('should return an element from the array', () => {
      const array = [1, 2, 3, 4, 5];

      for (let i = 0; i < 50; i++) {
        const result = pickRandom(array);
        expect(array).toContain(result);
      }
    });

    it('should return the only element for single-element array', () => {
      const array = ['only'];
      const result = pickRandom(array);
      expect(result).toBe('only');
    });

    it('should work with different types', () => {
      const numbers = [1, 2, 3];
      const strings = ['a', 'b', 'c'];
      const objects = [{ id: 1 }, { id: 2 }];

      expect(numbers).toContain(pickRandom(numbers));
      expect(strings).toContain(pickRandom(strings));
      expect(objects).toContain(pickRandom(objects));
    });
  });

  describe('pickRandomExcluding', () => {
    it('should return an element excluding the specified one', () => {
      const array = [1, 2, 3, 4, 5];
      const exclude = 3;

      for (let i = 0; i < 100; i++) {
        const result = pickRandomExcluding(array, exclude);
        expect(result).not.toBe(exclude);
        expect(array).toContain(result);
      }
    });

    it('should throw error when all elements are excluded', () => {
      const array = [1];
      expect(() => pickRandomExcluding(array, 1)).toThrow(
        'No items available after exclusion'
      );
    });

    it('should work when exclude is not in array', () => {
      const array = [1, 2, 3];
      const result = pickRandomExcluding(array, 99);
      expect(array).toContain(result);
    });

    it('should work with string arrays', () => {
      const array = ['a', 'b', 'c'];

      for (let i = 0; i < 50; i++) {
        const result = pickRandomExcluding(array, 'b');
        expect(result).not.toBe('b');
        expect(['a', 'c']).toContain(result);
      }
    });
  });

  describe('calculateTransferAmount', () => {
    const parseTokens = (amount: string | number) => {
      const value = parseFloat(amount.toString());
      return BigInt(Math.floor(value * 1e18));
    };

    it('should return 0 when balance equals minBalance', () => {
      const balance = parseTokens('8');
      const minBalance = parseTokens('8');

      const result = calculateTransferAmount(balance, minBalance);
      expect(result).toBe(0n);
    });

    it('should return 0 when balance is less than minBalance', () => {
      const balance = parseTokens('5');
      const minBalance = parseTokens('8');

      const result = calculateTransferAmount(balance, minBalance);
      expect(result).toBe(0n);
    });

    it('should return a value when balance exceeds minBalance', () => {
      const balance = parseTokens('10');
      const minBalance = parseTokens('8');
      const minTx = parseTokens('0.01');

      const result = calculateTransferAmount(balance, minBalance);
      expect(result).toBeGreaterThan(0n);
      expect(result).toBeGreaterThanOrEqual(minTx);
    });

    it('should cap at max transaction amount (2 tokens)', () => {
      const balance = parseTokens('100'); // Large balance
      const minBalance = parseTokens('8');
      const maxTx = parseTokens('2');

      for (let i = 0; i < 50; i++) {
        const result = calculateTransferAmount(balance, minBalance);
        expect(result).toBeLessThanOrEqual(maxTx);
      }
    });

    it('should return 0 when available is less than min tx', () => {
      const balance = parseTokens('8.005'); // Only 0.005 available
      const minBalance = parseTokens('8');

      const result = calculateTransferAmount(balance, minBalance);
      // Available (0.005) < minTx (0.01), should return 0
      expect(result).toBe(0n);
    });

    it('should return value within available range', () => {
      const balance = parseTokens('9'); // 1 token available
      const minBalance = parseTokens('8');
      const available = balance - minBalance;

      for (let i = 0; i < 50; i++) {
        const result = calculateTransferAmount(balance, minBalance);
        if (result > 0n) {
          expect(result).toBeLessThanOrEqual(available);
        }
      }
    });
  });
});
