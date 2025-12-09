# TX Activity Generator

Transaction activity generator for Vanar Chain (VANRY). Generates random transactions between 100 wallets with a Neo Brutalist dashboard for monitoring and control.

## Features

- **100 Wallet Management**: Generate and manage 100 HD wallets with encrypted private keys
- **Continuous Transactions**: Random token transfers between wallets with configurable delays
- **Balance Protection**: Maintains minimum 8 token balance per wallet
- **Multi-Instance Support**: Run up to 10 concurrent transaction workers
- **Master Wallet Funding**: Manual and automatic funding from master wallet
- **Real-time Dashboard**: Neo Brutalist UI with live updates via Socket.IO
- **Simulator Mode**: Test without real transactions

## Tech Stack

**Backend**: Node.js, Express, TypeScript, MongoDB, Socket.IO, ethers.js v6
**Frontend**: React, TypeScript, Tailwind CSS, Zustand, React Query, Vite
**Database**: MongoDB with Mongoose

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Docker)
- Vanar Chain RPC access

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `MONGODB_URI`: MongoDB connection string
- `VANAR_RPC_URL`: Vanar Chain RPC endpoint
- `MASTER_PRIVATE_KEY`: Master wallet private key (for funding)
- `WALLET_ENCRYPTION_KEY`: 32-character encryption key

### 3. Start MongoDB

Using Docker:
```bash
docker-compose up -d
```

### 4. Generate Wallets (One-time)

```bash
npm run generate-wallets
```

### 5. Start Backend

```bash
npm run dev
```

### 6. Start Frontend (new terminal)

```bash
npm run dev:frontend
```

### 7. Access Dashboard

Open http://localhost:5173

## Project Structure

```
tx-activity-generator/
├── packages/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── config/       # Environment configuration
│   │   │   ├── database/     # MongoDB connection & models
│   │   │   ├── services/     # Business logic
│   │   │   ├── workers/      # Transaction & auto-fund workers
│   │   │   ├── controllers/  # API controllers
│   │   │   ├── routes/       # Express routes
│   │   │   ├── socket/       # Socket.IO handlers
│   │   │   └── utils/        # Utilities
│   │   └── package.json
│   │
│   ├── frontend/         # React dashboard
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── services/     # API & Socket services
│   │   │   ├── store/        # Zustand state
│   │   │   └── styles/       # Tailwind CSS
│   │   └── package.json
│   │
│   └── simulator/        # Mock blockchain for testing
│       └── src/
│
├── .env.example
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Instances
- `GET /api/instances` - List running instances
- `POST /api/instances/start` - Start new instance
- `POST /api/instances/stop/:id` - Stop instance
- `POST /api/instances/set-count` - Set target instance count
- `POST /api/instances/stop-all` - Stop all instances

### Wallets
- `GET /api/wallets` - List all wallets
- `POST /api/wallets/generate` - Generate 100 wallets
- `GET /api/wallets/stats` - Wallet statistics
- `POST /api/wallets/refresh` - Refresh balances

### Funding
- `GET /api/funding/master-balance` - Master wallet balance
- `POST /api/funding/distribute` - Distribute tokens
- `POST /api/funding/auto/enable` - Enable auto-funding
- `POST /api/funding/auto/disable` - Disable auto-funding
- `GET /api/funding/auto/status` - Auto-funding status

### Stats
- `GET /api/stats/live` - Real-time statistics
- `GET /api/stats/history` - Historical data
- `GET /api/stats/transactions` - Recent transactions

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MIN_WALLET_BALANCE` | Minimum balance to maintain | 8 |
| `MAX_TX_AMOUNT` | Maximum transaction amount | 2 |
| `TX_DELAY_MIN` | Minimum delay between TX (ms) | 3000 |
| `TX_DELAY_MAX` | Maximum delay between TX (ms) | 5000 |
| `MAX_INSTANCES` | Maximum concurrent workers | 10 |
| `AUTO_FUND_THRESHOLD` | % of wallets below threshold | 0.3 |
| `AUTO_FUND_MIN_BALANCE` | Threshold balance | 5 |

## Simulator

Run the mock blockchain simulator for testing:

```bash
npm run simulate
```

## Vanar Chain

- **Chain ID**: 2040
- **Symbol**: VANRY
- **RPC**: https://rpc.vanarchain.com
- **Explorer**: https://explorer.vanarchain.com

## License

MIT

---

## Original Project Specification

The following is the original prompt/specification used to build this project:

<details>
<summary>Click to expand full specification</summary>

### Tech Stack

**Backend**
- Runtime: Node.js with TypeScript
- Framework: Express.js
- Real-time: Socket.IO (for live dashboard updates)
- Database: MongoDB with Mongoose
- Blockchain: ethers.js v6
- Process Management: Node.js child_process (fork)

**Frontend**
- Framework: React with TypeScript
- Styling: Tailwind CSS (Neo Brutalist theme)
- State: React Query + Zustand
- Real-time: Socket.IO Client
- Build: Vite

### Directory Structure

```
tx-activity-generator/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── index.ts              # Environment & app config
│   │   │   ├── database/
│   │   │   │   ├── connection.ts         # MongoDB connection
│   │   │   │   └── models/
│   │   │   │       ├── wallet.model.ts   # Wallet schema
│   │   │   │       ├── transaction.model.ts
│   │   │   │       └── stats.model.ts
│   │   │   ├── services/
│   │   │   │   ├── wallet.service.ts     # Wallet CRUD operations
│   │   │   │   ├── funding.service.ts    # Master wallet funding logic
│   │   │   │   ├── transaction.service.ts # Transaction generation
│   │   │   │   ├── instance.service.ts   # Instance management
│   │   │   │   └── stats.service.ts      # Statistics tracking
│   │   │   ├── workers/
│   │   │   │   ├── transaction.worker.ts # Child process worker
│   │   │   │   └── auto-fund.worker.ts   # Auto-funding worker
│   │   │   ├── controllers/
│   │   │   │   ├── wallet.controller.ts
│   │   │   │   ├── funding.controller.ts
│   │   │   │   ├── instance.controller.ts
│   │   │   │   └── stats.controller.ts
│   │   │   ├── routes/
│   │   │   │   └── index.ts              # API routes
│   │   │   ├── utils/
│   │   │   │   ├── blockchain.ts         # Ethers provider setup
│   │   │   │   ├── random.ts             # Random helpers
│   │   │   │   └── logger.ts             # Logging utility
│   │   │   ├── socket/
│   │   │   │   └── index.ts              # Socket.IO handlers
│   │   │   └── index.ts                  # App entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/                   # Brutalist UI components
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── InstanceManager/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── simulator/
│       ├── src/
│       │   ├── mock-blockchain.ts        # Mock chain for testing
│       │   └── index.ts
│       └── package.json
│
├── .env.example
├── docker-compose.yml                    # MongoDB setup
├── package.json                          # Workspace root
└── README.md
```

### Database Schema

**Wallets Collection**
```json
{
  "_id": "ObjectId",
  "address": "string",           // Public address
  "privateKey": "string",        // Encrypted private key
  "index": "number",             // Wallet index (0-99)
  "balance": "string",           // Current balance (wei string)
  "lastActive": "Date",
  "totalTxSent": "number",
  "totalTxReceived": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Transactions Collection**
```json
{
  "_id": "ObjectId",
  "txHash": "string",
  "from": "string",
  "to": "string",
  "amount": "string",            // Wei string
  "gasUsed": "string",
  "status": "pending | success | failed",
  "instanceId": "string",        // Which instance executed this
  "error": "string",
  "createdAt": "Date"
}
```

**Stats Collection**
```json
{
  "_id": "ObjectId",
  "date": "Date",                // Daily aggregation
  "totalTransactions": "number",
  "successfulTx": "number",
  "failedTx": "number",
  "totalVolume": "string",       // Wei string
  "avgGasUsed": "string",
  "instancesRun": "number"
}
```

### Core Features Implementation

#### 1. Wallet Generation (One-time Setup)

Command: `npm run generate-wallets`

Steps:
1. Generate 100 HD wallets using ethers.js
2. Encrypt private keys before storage
3. Store in MongoDB with index 0-99
4. Display summary of generated addresses

#### 2. Transaction Worker (Child Process)

Each instance runs as a separate Node.js child process:

```
Loop:
  1. Fetch all wallets with balance > minThreshold (8 tokens)
  2. Randomly select sender from eligible wallets
  3. Randomly select receiver (different from sender)
  4. Calculate random amount (keeping sender balance >= 8)
  5. Execute transaction
  6. Log result to MongoDB
  7. Emit stats via IPC to parent
  8. Wait random 3-5 seconds
  9. Repeat
```

#### 3. Balance Protection Logic

```javascript
// Minimum balance to maintain
const MIN_BALANCE = parseEther("8");
const MAX_BALANCE = parseEther("10");

// Calculate max transferable amount
function getMaxTransferAmount(balance) {
  const available = balance - MIN_BALANCE;
  if (available <= 0n) return 0n;

  // Random amount between 0.01 and available
  const minTx = parseEther("0.01");
  const maxTx = available > parseEther("2") ? parseEther("2") : available;

  return randomBigInt(minTx, maxTx);
}
```

#### 4. Instance Manager

```javascript
// Parent process manages child processes
class InstanceManager {
  private instances: Map<string, ChildProcess>;

  async setInstanceCount(count: number): Promise<void>;
  async startInstance(): Promise<string>;
  async stopInstance(id: string): Promise<void>;
  async stopAll(): Promise<void>;
  getRunningCount(): number;
  getInstanceStats(): InstanceStats[];
}
```

#### 5. Master Wallet Funding

**Manual Funding**

API: `POST /api/funding/distribute`

```json
{
  "totalAmount": "1000",       // Total tokens to distribute
  "mode": "equal | random"     // Distribution mode
}
```

Logic:
- Equal: 1000 / 100 = 10 tokens each
- Random: Random amounts ensuring all get at least 5 tokens

**Auto Funding**

Worker runs every 60 seconds:
1. Count wallets with balance < 5 tokens
2. If count >= 30 (30% of 100):
   a. Check master wallet has >= 1000 tokens
   b. Calculate distribution (prioritize low balance wallets)
   c. Execute funding transactions
   d. Log funding event

#### 6. Error Handling Strategy

```javascript
enum TxError {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  NONCE_TOO_LOW = 'NONCE_TOO_LOW',
  TX_UNDERPRICED = 'TX_UNDERPRICED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT'
}

const retryStrategy = {
  INSUFFICIENT_BALANCE: { retry: false, action: 'skip_wallet' },
  GAS_ESTIMATION_FAILED: { retry: true, maxRetries: 3, delay: 1000 },
  NONCE_TOO_LOW: { retry: true, maxRetries: 1, action: 'refresh_nonce' },
  TX_UNDERPRICED: { retry: true, action: 'increase_gas' },
  NETWORK_ERROR: { retry: true, maxRetries: 5, delay: 2000 },
  TIMEOUT: { retry: true, maxRetries: 3, delay: 3000 }
};
```

### API Endpoints

**Instances**
- `GET /api/instances` - List all running instances
- `POST /api/instances/start` - Start new instance
- `POST /api/instances/stop/:id` - Stop specific instance
- `POST /api/instances/set-count` - Set target instance count
- `POST /api/instances/stop-all` - Stop all instances

**Wallets**
- `GET /api/wallets` - List all wallets with balances
- `POST /api/wallets/generate` - Generate 100 wallets (one-time)
- `GET /api/wallets/stats` - Wallet statistics

**Funding**
- `GET /api/funding/master-balance` - Master wallet balance
- `POST /api/funding/distribute` - Manual distribution
- `POST /api/funding/auto/enable` - Enable auto-funding
- `POST /api/funding/auto/disable` - Disable auto-funding
- `GET /api/funding/auto/status` - Auto-funding status

**Stats**
- `GET /api/stats/live` - Real-time statistics
- `GET /api/stats/history` - Historical data
- `GET /api/stats/transactions` - Recent transactions

**Simulator**
- `POST /api/simulator/start` - Start simulation mode
- `POST /api/simulator/stop` - Stop simulation
- `GET /api/simulator/status` - Simulation status

### Dashboard UI (Neo Brutalist Design)

**Design Principles**
- Bold borders: 3-4px solid black borders
- Harsh shadows: 4-8px offset box shadows
- High contrast: Black, white, with accent colors (yellow, cyan, magenta)
- Chunky buttons: Large, obvious interactive elements
- Raw typography: Bold, uppercase headers
- No rounded corners: Sharp, geometric shapes

**Main Sections**

1. **Header Bar**
   - Logo/Title (bold, uppercase)
   - Connection status indicator
   - Master wallet balance display

2. **Instance Control Panel**
```
┌─────────────────────────────────────────┐
│ INSTANCES                        [+][-] │
├─────────────────────────────────────────┤
│  Running: 5 / Target: 5                 │
│                                         │
│  [████████████████████░░░░] 5 Active    │
│                                         │
│  [ SET COUNT: [___] ] [ STOP ALL ]      │
└─────────────────────────────────────────┘
```

3. **Funding Panel**
```
┌─────────────────────────────────────────┐
│ FUNDING                                 │
├─────────────────────────────────────────┤
│  Master Balance: 10,000 VANRY           │
│                                         │
│  Amount: [________]                     │
│  Mode: [● EQUAL] [○ RANDOM]             │
│                                         │
│  [ DISTRIBUTE NOW ]                     │
│                                         │
│  ─────────────────────────              │
│  Auto-Fund: [ON/OFF]                    │
│  Threshold: 30% wallets < 5 tokens      │
│  Fund Amount: 1000 VANRY                │
└─────────────────────────────────────────┘
```

4. **Stats Panel**
```
┌─────────────────────────────────────────┐
│ STATISTICS                              │
├─────────────────────────────────────────┤
│  Total TX: 15,432     Success: 99.2%    │
│  Today TX: 1,234      Failed: 12        │
│  Volume: 45,678 VANRY                   │
│                                         │
│  [Live Transaction Feed]                │
│  > 0x1234...→ 0x5678... 2.5 VANRY ✓     │
│  > 0xabcd...→ 0xef01... 1.8 VANRY ✓     │
│  > 0x9876...→ 0x5432... 0.9 VANRY ✓     │
└─────────────────────────────────────────┘
```

5. **Wallet Grid**
```
┌─────────────────────────────────────────┐
│ WALLETS (100)           [REFRESH]       │
├─────────────────────────────────────────┤
│ ┌────┐┌────┐┌────┐┌────┐┌────┐         │
│ │ 01 ││ 02 ││ 03 ││ 04 ││ 05 │  ...    │
│ │9.2 ││8.1 ││10.0││8.5 ││9.8 │         │
│ │ ✓  ││ ✓  ││ ✓  ││ ✓  ││ ✓  │         │
│ └────┘└────┘└────┘└────┘└────┘         │
│                                         │
│ Legend: [■ Healthy] [■ Low] [■ Empty]   │
└─────────────────────────────────────────┘
```

### Simulator Mode

The simulator provides a mock environment to test everything without using real tokens:

```javascript
class MockBlockchain {
  private balances: Map<string, bigint>;
  private txDelay: number = 500;

  async sendTransaction(tx: Transaction): Promise<TxReceipt>;
  async getBalance(address: string): Promise<bigint>;

  // Simulate failures
  setFailureRate(rate: number): void;  // 0-1
  simulateNetworkDelay(ms: number): void;
}
```

Features:
- No real transactions
- Configurable failure rates
- Fast execution for testing
- Same API as real mode

### Vanar Chain Configuration

```javascript
const VANAR_CONFIG = {
  chainId: 2040,
  name: 'Vanar Mainnet',
  rpcUrl: 'https://rpc.vanarchain.com',
  symbol: 'VANRY',
  explorer: 'https://explorer.vanarchain.com'
};
```

### Environment Variables

```
# Database
MONGODB_URI=mongodb://localhost:27017/tx-generator

# Blockchain
VANAR_RPC_URL=https://rpc.vanarchain.com
MASTER_PRIVATE_KEY=0x...

# App Config
PORT=3001
NODE_ENV=development

# Authentication
DASHBOARD_PASSWORD=your-secure-password

# Encryption
WALLET_ENCRYPTION_KEY=your-32-char-secret-key

# Auto-funding
AUTO_FUND_THRESHOLD=0.3        # 30%
AUTO_FUND_MIN_BALANCE=5        # 5 tokens
AUTO_FUND_AMOUNT=1000          # 1000 tokens per cycle

# Transaction Config
MIN_WALLET_BALANCE=8           # Minimum to maintain
MAX_TX_AMOUNT=2                # Max per transaction
TX_DELAY_MIN=3000              # 3 seconds
TX_DELAY_MAX=5000              # 5 seconds
```

### Confirmed Requirements

1. **Private Key Encryption**: AES-256 encryption with secret key from .env
2. **Dashboard Authentication**: Simple password protection
3. **Transaction Logging**: 7-day retention with automatic cleanup
4. **Concurrent Instance Limit**: Maximum 10 instances

</details>
