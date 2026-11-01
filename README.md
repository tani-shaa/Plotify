# Plotify — Blockchain Land Registry

A full-stack land registry platform that anchors property ownership records on the Ethereum blockchain, making them permanently verifiable and tamper-resistant.

Built as a final-year engineering project. Every registration, ownership transfer and document hash is written to a Solidity smart contract deployed on a local Hardhat node, with a Flask API bridging the on-chain state to a React dashboard.

---

## Architecture

```
plotify/
├── frontend/          React 18, Vite, React Router
├── backend/           Flask, Web3.py, SQLite, JWT
└── blockchain/        Solidity 0.8.24, Hardhat, Chai
```

```
Browser (React)
     |
     | HTTP / Vite proxy
     v
Flask API  ──  SQLite (off-chain store)
     |
     | Web3.py (JSON-RPC)
     v
Hardhat Node
     |
     v
LandRegistry.sol  (on-chain truth)
```

The system maintains two stores intentionally. SQLite holds fast-query data (user accounts, search, relationships). The smart contract holds the immutable audit record (ownership history, document hashes, transfer proofs). An integrity check compares both stores and flags any divergence.

---

## Smart Contract

`blockchain/contracts/LandRegistry.sol`

Written in Solidity 0.8.24. Deployed with an `onlyAdmin` modifier so only the backend wallet can write state — this is a deliberate design choice for a government land registry, not a decentralised application. The trade-off is documented in the Design Decisions section below.

**State stored on-chain**

| Struct | Fields |
|--------|--------|
| Property | id, title, location, area (m²), currentOwner (address), registeredAt, exists |
| Transfer | propertyId, from, to, timestamp, note |
| Document | propertyId, docHash (bytes32 SHA-256), timestamp, docType |

**Events emitted**

- `PropertyRegistered(propertyId, owner, title, timestamp)`
- `OwnershipTransferred(propertyId, from, to, timestamp)`
- `DocumentHashRecorded(propertyId, docHash, docType, timestamp)`

**Functions**

| Function | Access | Description |
|----------|--------|-------------|
| `registerProperty` | onlyAdmin | Register a new land parcel with owner address |
| `transferOwnership` | onlyAdmin | Transfer ownership after off-chain approval |
| `addDocumentHash` | onlyAdmin | Anchor a SHA-256 document hash on-chain |
| `getProperty` | public view | Fetch property data by ID |
| `getTransferHistory` | public view | Full ownership chain for a property |
| `getDocuments` | public view | All document hashes for a property |
| `getPropertiesByOwner` | public view | All property IDs owned by a wallet address |
| `totalProperties` | public view | Count of registered properties |

**Contract tests** are in `blockchain/test/LandRegistry.test.js` using Hardhat and Chai. They cover deployment, `onlyAdmin` access control, property registration, ownership transfers including history, and edge cases such as transfer to zero address.

---

## Backend

`backend/` — Flask application with five route blueprints.

**Routes**

| Blueprint | Endpoints |
|-----------|-----------|
| auth | `POST /api/auth/register` `POST /api/auth/login` `GET /api/auth/me` |
| properties | `GET /api/properties` `POST /api/properties` `GET /api/properties/:id` `PUT /api/properties/:id` |
| transfers | `GET /api/transfers` `POST /api/transfers` `PUT /api/transfers/:id/approve` `PUT /api/transfers/:id/reject` `GET /api/transfers/property/:id` |
| documents | `POST /api/documents/upload` `POST /api/documents/verify` `GET /api/documents/property/:id` |
| insights | `GET /api/insights/stats` `GET /api/insights/anomalies` `GET /api/insights/chain-status` |

**Authentication** — JWT with bcrypt password hashing. All protected routes require a `Bearer` token. Non-admin users can only access their own transfers.

**Document hashing** — `backend/services/document_hash.py` computes SHA-256 hashes of uploaded files using Python's `hashlib`. Hashes are stored in SQLite and optionally anchored on-chain via `addDocumentHash`.

**Blockchain service** — `backend/services/blockchain.py` wraps Web3.py. It reads the contract ABI and address from `blockchain_artifacts/LandRegistry.json` (written by the deploy script) and exposes `register_property`, `transfer_ownership` and `record_document_hash`. Property registration silently falls back to off-chain only if the Hardhat node is not running.

**ML anomaly detection** — `backend/services/anomaly.py` runs scikit-learn's `IsolationForest` over three features per property: transfer count, days since registration, and average days between consecutive transfers. Properties with a predicted label of -1 are flagged. Requires at least five properties in the database. Accessible only to admin accounts via `GET /api/insights/anomalies`.

---

## Frontend

`frontend/src/` — React 18 single-page application.

**Pages**

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Interactive blockchain network canvas, scroll-reveal sections |
| `/login` | Login | Split panel with one-click demo login buttons |
| `/register` | Register | Single-form citizen account creation |
| `/dashboard` | Dashboard | Main citizen/admin workspace |
| `/properties` | PropertySearch | Searchable property list |
| `/properties/:id` | PropertyDetails | Tabbed detail view: info, timeline, documents |
| `/register-land` | RegisterProperty | Submit a new land parcel |
| `/transfers` | TransferRequests | Initiate and track ownership transfers |
| `/history` | OwnershipHistory | Property-by-property transfer timeline |
| `/documents` | DocumentVerification | Upload, hash and verify documents |
| `/insights` | Insights | Platform stats and ML anomaly panel |
| `/verify` | PublicVerify | Public search — no login required |

**Dashboard features**

- Chain status pill — live connection state, block number and contract address
- Stat cards — clickable, navigate to the relevant page
- Application tracker — 5-step visual progress bar driven by real transfer status
- Blockchain explorer — horizontal block chain showing real tx hashes, clickable to inspect
- ML anomaly panel — collapsed by default, expands with per-property explanation
- Transfer table — filter chips (All / Pending / Approved / Rejected)
- Property portfolio — search, on-chain status per row, click to open detail

**Landing page**

An interactive canvas renders a blockchain network. Larger nodes represent real transaction types (Registration, Transfer, Document Anchor). A teal packet travels between nodes simulating a live transaction. Clicking a node reveals a glass tooltip with block ID, hash, gas and timestamp. Mouse proximity attracts nearby nodes.

**Typography**

- Space Grotesk — display headings
- Manrope — section headings and card titles
- Inter — body text, forms, tables

**Design palette**

| Token | Hex |
|-------|-----|
| Forest | #173F35 |
| Green | #287A68 |
| Sage | #8DA99B |
| Soft Sage | #E9EFE7 |
| Ivory | #F8F7F2 |
| White | #FFFFFF |

---

## Demo Accounts

Three accounts are pre-seeded by `backend/seed.py`:

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Admin | admin | admin123 | Full platform access, anomaly detection, transfer approval |
| Citizen | arjun_sharma | demo1234 | 6 properties, transfer history |
| Citizen | priya_mehta | demo1234 | 4 properties |

The seeded data includes two anomalous properties (`Dharavi Redevelopment Plot` and `Electronic City Plot B7`) with 5 and 2 rapid transfers respectively, designed to trigger the Isolation Forest model.

---

## Local Setup

**Requirements**

- Node.js 18+
- Python 3.10+
- npm

**1. Clone**

```bash
git clone https://github.com/tani-shaa/Plotify.git
cd Plotify/plotify
```

**2. Blockchain**

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat node          # keep this terminal open
```

Open a second terminal:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
# Outputs: LandRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**3. Backend**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set CONTRACT_ADDRESS to the address printed above
python seed.py            # populate demo data
python app.py             # runs on http://localhost:5000
```

**4. Frontend**

```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:5173
```

The Vite dev server proxies all `/api` requests to the Flask backend automatically.

**5. Open**

Navigate to `http://localhost:5173` and use one of the demo accounts above, or click the one-click demo buttons on the login page.

---

## Running the Contract Tests

```bash
cd blockchain
npx hardhat test
```

Tests cover: deployment and admin assignment, property registration and event emission, counter increment, `getProperty` data integrity, `onlyAdmin` revert on unauthorised callers, ownership transfer and event, transfer history recording, and edge cases.

---

## Project Structure

```
plotify/
├── backend/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── properties.py
│   │   ├── transfers.py
│   │   ├── documents.py
│   │   └── insights.py
│   ├── services/
│   │   ├── blockchain.py        Web3.py contract bridge
│   │   ├── document_hash.py     SHA-256 hashing
│   │   └── anomaly.py           Isolation Forest ML
│   ├── models/
│   │   └── database.py          SQLite schema and seeding
│   ├── blockchain_artifacts/
│   │   └── LandRegistry.json    ABI + deployed address (auto-generated)
│   ├── app.py
│   ├── config.py
│   ├── extensions.py
│   ├── seed.py
│   ├── requirements.txt
│   └── .env.example
├── blockchain/
│   ├── contracts/
│   │   └── LandRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── LandRegistry.test.js
│   └── hardhat.config.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout/
    │   │   │   ├── Sidebar.jsx
    │   │   │   └── TopBar.jsx
    │   │   └── UI/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx
    │   │   ├── PropertyDetails.jsx
    │   │   ├── RegisterProperty.jsx
    │   │   ├── TransferRequests.jsx
    │   │   ├── DocumentVerification.jsx
    │   │   ├── OwnershipHistory.jsx
    │   │   ├── Insights.jsx
    │   │   └── PublicVerify.jsx
    │   ├── services/
    │   │   └── api.js            Axios instance with JWT interceptor
    │   ├── App.jsx
    │   └── index.css             Design system and CSS tokens
    ├── vite.config.js
    └── package.json
```

---

## Design Decisions and Limitations

**Centralised admin key**

Only the admin Ethereum wallet can call `registerProperty` and `transferOwnership` on the smart contract. This is intentional for a government land registry context where a central authority validates ownership before writing to the blockchain. It means the system is not trustless — the admin key holder has full write access. A future version could introduce multi-sig approval or an upgradeable proxy pattern.

**Hardhat local network**

The contract runs on a local Hardhat node, not a public testnet. All transaction hashes in the demo are real Ethereum transactions on a private chain. Deploying to Sepolia or Polygon Amoy would make every hash publicly verifiable on Etherscan and is the logical next step.

**SQLite for persistence**

SQLite is used for simplicity. The backend performs no database migration system. A production deployment would use PostgreSQL with Alembic migrations.

**Off-chain fallback**

If the Hardhat node is not running when a property is registered, the backend stores the record in SQLite without a blockchain transaction. The dashboard shows an "Off-chain" label in those cases so the distinction is always visible to the user.

**SHA-256 document integrity**

Document hashes are computed server-side in Python before the file is saved. The hash is stored in SQLite and optionally anchored on-chain. The verify endpoint re-hashes the uploaded file and compares it against the stored hash. This proves the file has not changed since upload but does not prove the hash was computed correctly at upload time — that trust boundary is the backend server.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contract | Solidity 0.8.24 |
| Blockchain tooling | Hardhat 2.22, Chai, Ethers.js |
| Backend | Python 3, Flask, Web3.py, SQLite |
| Authentication | JWT (PyJWT), bcrypt (Werkzeug) |
| ML | scikit-learn (IsolationForest), pandas |
| Frontend | React 18, Vite 5, React Router 6 |
| HTTP client | Axios |
| Fonts | Space Grotesk, Manrope, Inter (Google Fonts) |

---

## Resume Context

This project demonstrates end-to-end integration of a blockchain smart contract into a real application:

- A Solidity contract with access control, event emission and on-chain data structures
- A Python service layer that signs and submits Ethereum transactions using Web3.py
- A two-store architecture where an off-chain database and an on-chain contract serve different roles
- An unsupervised ML model (Isolation Forest) applied to real application data
- A React frontend that visualises live chain state and makes blockchain concepts accessible to non-technical users
