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
