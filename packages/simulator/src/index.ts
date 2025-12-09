import { ethers } from 'ethers';
import { MockBlockchain } from './mock-blockchain';

async function runSimulation(): Promise<void> {
  console.log('=== TX Activity Generator Simulator ===\n');

  const blockchain = new MockBlockchain();

  // Initialize test wallets
  console.log('Initializing 100 test wallets...');
  const addresses = blockchain.initializeTestWallets(100, ethers.parseEther('10'));

  console.log('\nRunning simulation with:');
  console.log('- 100 wallets');
  console.log('- 10 VANRY initial balance each');
  console.log('- 500ms transaction delay');
  console.log('- 5% failure rate\n');

  blockchain.setFailureRate(0.05);
  blockchain.setTransactionDelay(500);

  // Run simulation loop
  const iterations = 20;
  console.log(`Executing ${iterations} random transactions...\n`);

  for (let i = 0; i < iterations; i++) {
    // Pick random sender and receiver
    const senderIdx = Math.floor(Math.random() * addresses.length);
    let receiverIdx = Math.floor(Math.random() * addresses.length);
    while (receiverIdx === senderIdx) {
      receiverIdx = Math.floor(Math.random() * addresses.length);
    }

    const sender = addresses[senderIdx];
    const receiver = addresses[receiverIdx];

    // Get sender balance
    const senderBalance = await blockchain.getBalance(sender);
    const minBalance = ethers.parseEther('8');

    if (senderBalance <= minBalance) {
      console.log(`[${i + 1}] Skipped - Sender ${senderIdx} has insufficient balance`);
      continue;
    }

    // Calculate transfer amount
    const available = senderBalance - minBalance;
    const maxTx = available > ethers.parseEther('2') ? ethers.parseEther('2') : available;
    const amount = BigInt(Math.floor(Math.random() * Number(maxTx))) + ethers.parseEther('0.01');

    try {
      const tx = await blockchain.sendTransaction(sender, receiver, amount);
      console.log(`[${i + 1}] TX ${tx.hash.slice(0, 10)}... | ${senderIdx} -> ${receiverIdx} | ${ethers.formatEther(amount)} VANRY`);

      const receipt = await tx.wait();
      const status = receipt.status === 1 ? '✓ SUCCESS' : '✗ FAILED';
      console.log(`      ${status}`);
    } catch (error: any) {
      console.log(`[${i + 1}] ERROR: ${error.message}`);
    }

    // Small delay between transactions
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Print final stats
  console.log('\n=== Simulation Complete ===\n');
  const stats = blockchain.getStats();
  console.log('Statistics:');
  console.log(`  Total Wallets: ${stats.totalWallets}`);
  console.log(`  Total Transactions: ${stats.totalTransactions}`);
  console.log(`  Successful: ${stats.successfulTx}`);
  console.log(`  Failed: ${stats.failedTx}`);
  console.log(`  Total Volume: ${stats.totalVolume} VANRY`);

  // Print sample balances
  console.log('\nSample wallet balances:');
  for (let i = 0; i < 5; i++) {
    const balance = await blockchain.getBalance(addresses[i]);
    console.log(`  Wallet ${i}: ${ethers.formatEther(balance)} VANRY`);
  }
}

runSimulation().catch(console.error);

export { MockBlockchain } from './mock-blockchain';
