import { ethers } from 'ethers';

export interface MockTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasUsed: bigint;
  status: 'pending' | 'success' | 'failed';
}

export interface MockTransactionReceipt {
  transactionHash: string;
  status: number;
  gasUsed: bigint;
}

export class MockBlockchain {
  private balances: Map<string, bigint> = new Map();
  private transactions: Map<string, MockTransaction> = new Map();
  private txDelay: number = 500;
  private failureRate: number = 0;
  private networkDelay: number = 0;
  private nonces: Map<string, number> = new Map();

  constructor() {
    console.log('MockBlockchain initialized');
  }

  setBalance(address: string, balance: bigint): void {
    this.balances.set(address.toLowerCase(), balance);
  }

  async getBalance(address: string): Promise<bigint> {
    await this.simulateDelay();
    return this.balances.get(address.toLowerCase()) || 0n;
  }

  async sendTransaction(
    from: string,
    to: string,
    value: bigint
  ): Promise<{ hash: string; wait: () => Promise<MockTransactionReceipt> }> {
    await this.simulateDelay();

    const fromAddr = from.toLowerCase();
    const toAddr = to.toLowerCase();
    const fromBalance = this.balances.get(fromAddr) || 0n;

    // Simulate gas cost
    const gasCost = ethers.parseEther('0.001');
    const totalCost = value + gasCost;

    if (fromBalance < totalCost) {
      throw new Error('insufficient funds for gas + value');
    }

    // Generate transaction hash
    const hash = `0x${Buffer.from(
      `${fromAddr}${toAddr}${value.toString()}${Date.now()}`
    )
      .toString('hex')
      .slice(0, 64)}`;

    // Create pending transaction
    const tx: MockTransaction = {
      hash,
      from: fromAddr,
      to: toAddr,
      value,
      gasUsed: 21000n,
      status: 'pending',
    };

    this.transactions.set(hash, tx);

    return {
      hash,
      wait: async (): Promise<MockTransactionReceipt> => {
        await this.simulateTransactionProcessing();

        // Check for random failure
        if (Math.random() < this.failureRate) {
          tx.status = 'failed';
          this.transactions.set(hash, tx);
          return {
            transactionHash: hash,
            status: 0,
            gasUsed: tx.gasUsed,
          };
        }

        // Process transaction
        this.balances.set(fromAddr, fromBalance - totalCost);
        const toBalance = this.balances.get(toAddr) || 0n;
        this.balances.set(toAddr, toBalance + value);

        tx.status = 'success';
        this.transactions.set(hash, tx);

        return {
          transactionHash: hash,
          status: 1,
          gasUsed: tx.gasUsed,
        };
      },
    };
  }

  getTransaction(hash: string): MockTransaction | undefined {
    return this.transactions.get(hash);
  }

  getAllBalances(): Map<string, bigint> {
    return new Map(this.balances);
  }

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
    console.log(`Failure rate set to ${(this.failureRate * 100).toFixed(1)}%`);
  }

  setTransactionDelay(ms: number): void {
    this.txDelay = ms;
    console.log(`Transaction delay set to ${ms}ms`);
  }

  setNetworkDelay(ms: number): void {
    this.networkDelay = ms;
    console.log(`Network delay set to ${ms}ms`);
  }

  private async simulateDelay(): Promise<void> {
    if (this.networkDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.networkDelay));
    }
  }

  private async simulateTransactionProcessing(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.txDelay));
  }

  reset(): void {
    this.balances.clear();
    this.transactions.clear();
    this.nonces.clear();
    console.log('MockBlockchain reset');
  }

  // Initialize with test wallets
  initializeTestWallets(count: number = 100, initialBalance: bigint = ethers.parseEther('10')): string[] {
    const addresses: string[] = [];

    for (let i = 0; i < count; i++) {
      const wallet = ethers.Wallet.createRandom();
      this.setBalance(wallet.address, initialBalance);
      addresses.push(wallet.address);
    }

    console.log(`Initialized ${count} test wallets with ${ethers.formatEther(initialBalance)} tokens each`);
    return addresses;
  }

  // Get stats
  getStats(): {
    totalWallets: number;
    totalTransactions: number;
    successfulTx: number;
    failedTx: number;
    totalVolume: string;
  } {
    let successfulTx = 0;
    let failedTx = 0;
    let totalVolume = 0n;

    for (const tx of this.transactions.values()) {
      if (tx.status === 'success') {
        successfulTx++;
        totalVolume += tx.value;
      } else if (tx.status === 'failed') {
        failedTx++;
      }
    }

    return {
      totalWallets: this.balances.size,
      totalTransactions: this.transactions.size,
      successfulTx,
      failedTx,
      totalVolume: ethers.formatEther(totalVolume),
    };
  }
}

export const mockBlockchain = new MockBlockchain();
