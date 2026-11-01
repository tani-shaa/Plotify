# Plotify — Complete Technical Walkthrough

This document explains every part of Plotify in depth: what it does, how it works internally, and why each technical decision was made. It is written for a technical interview, a code review, or self-study.

---

## Table of Contents

1. [What Plotify Does](#1-what-plotify-does)
2. [System Architecture](#2-system-architecture)
3. [The Smart Contract](#3-the-smart-contract)
4. [The Blockchain Toolchain](#4-the-blockchain-toolchain)
5. [The Flask Backend](#5-the-flask-backend)
6. [Authentication and JWT](#6-authentication-and-jwt)
7. [The Blockchain Service](#7-the-blockchain-service)
8. [Document Hashing](#8-document-hashing)
9. [ML Anomaly Detection](#9-ml-anomaly-detection)
10. [The React Frontend](#10-the-react-frontend)
11. [The API Layer](#11-the-api-layer)
12. [The Landing Page Canvas](#12-the-landing-page-canvas)
13. [The Dashboard](#13-the-dashboard)
14. [Data Flow — End to End](#14-data-flow-end-to-end)
15. [The Two-Store Architecture](#15-the-two-store-architecture)
16. [Design Decisions and Trade-offs](#16-design-decisions-and-trade-offs)
17. [What Each File Does](#17-what-each-file-does)
18. [How to Explain This in an Interview](#18-how-to-explain-this-in-an-interview)

---

## 1. What Plotify Does

Plotify is a land registry platform. It lets citizens register land parcels, transfer ownership between parties, and upload supporting documents. The critical difference from a normal database application is that every registration, transfer and document hash is written to an Ethereum smart contract — making those records permanent and independently verifiable by anyone.

The problem it solves: traditional land registries store records in a central database controlled by one authority. Records can be altered, deleted or forged without any audit trail. Plotify makes the ownership history tamper-resistant by anchoring it on a blockchain that nobody — including the administrator — can retroactively modify.

---

## 2. System Architecture

```
Browser (React SPA)
        |
        | HTTP requests via Vite dev proxy
        |
Flask REST API  ←→  SQLite database
        |
        | JSON-RPC via Web3.py
        |
Hardhat Ethereum Node
        |
LandRegistry.sol (smart contract)
```

There are three distinct layers:

**Presentation layer** — React 18 single-page application. Handles all UI, routing and user interaction. Communicates with the backend exclusively through HTTP.

**Application layer** — Flask Python API. Validates requests, enforces business rules, writes to SQLite and optionally writes to the blockchain. Acts as the bridge between the browser and the chain.

**Blockchain layer** — A Solidity smart contract deployed on a local Hardhat Ethereum node. Stores the immutable record of ownership. The Flask backend is the only party that writes to it (via a private key held in `.env`).

---

## 3. The Smart Contract

**File:** `blockchain/contracts/LandRegistry.sol`

Written in Solidity 0.8.24. The contract is the core of Plotify's value proposition.

### What it stores

The contract defines three Solidity structs:

```solidity
struct Property {
    uint256 id;
    string  title;
    string  location;
    uint256 area;           // square metres
    address currentOwner;  // Ethereum wallet address
    uint256 registeredAt;  // Unix timestamp
    bool    exists;
}

struct Transfer {
    uint256 propertyId;
    address from;
    address to;
    uint256 timestamp;
    string  note;
}

struct Document {
    uint256 propertyId;
    bytes32 docHash;   // SHA-256 hash of the file, stored as 32 bytes
    uint256 timestamp;
    string  docType;
}
```

These are stored in Solidity mappings:

```solidity
mapping(uint256 => Property)   public properties;
mapping(uint256 => Transfer[]) public transferHistory;
mapping(uint256 => Document[]) public documents;
mapping(address => uint256[])  private _ownerProperties;
```

Once written, these mappings cannot be deleted or overwritten. This is what makes the records tamper-resistant.

### Access control

The contract has a single `admin` state variable set to the deployer's wallet address in the constructor:

```solidity
constructor() {
    admin = msg.sender;
}
```

A custom modifier enforces that only the admin can write:

```solidity
modifier onlyAdmin() {
    require(msg.sender == admin, "LandRegistry: caller is not admin");
    _;
}
```

All three write functions (`registerProperty`, `transferOwnership`, `addDocumentHash`) carry `onlyAdmin`. This means the Hardhat test account key stored in `.env` is the only private key that can write state. Citizens cannot write directly to the chain.

### Events

Every write function emits an event:

```solidity
event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string title, uint256 timestamp);
event OwnershipTransferred(uint256 indexed propertyId, address indexed from, address indexed to, uint256 timestamp);
event DocumentHashRecorded(uint256 indexed propertyId, bytes32 docHash, string docType, uint256 timestamp);
```

Events are stored in the transaction log and are queryable. They serve as an additional audit trail beyond the state mappings.

### Why `bytes32` for document hashes

A SHA-256 hash is always 32 bytes (256 bits). Storing it as `bytes32` is the most gas-efficient representation on Ethereum. The Flask backend converts the 64-character hex string to raw bytes before calling the contract:

```python
doc_hash_bytes = bytes.fromhex(sha256_hex)
```

---

## 4. The Blockchain Toolchain

**Directory:** `blockchain/`

### Hardhat

Hardhat is a development environment for Ethereum. It provides:

- A local Ethereum node (`npx hardhat node`) that runs entirely in memory
- A test framework using Mocha/Chai
- A deployment scripting system
- Solidity compiler integration

The configuration is in `hardhat.config.js`:

```javascript
module.exports = {
  solidity: "0.8.24",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};
```

Chain ID 31337 is Hardhat's default local chain identifier.

### The deploy script

`blockchain/scripts/deploy.js` deploys the contract and writes the result to a JSON file:

```javascript
const output = { address: contractAddress, abi: artifact.abi };
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
```

The output file is `backend/blockchain_artifacts/LandRegistry.json`. The Flask backend reads this file to know the contract address and ABI. This is the link between the Hardhat deployment and the Python backend — no hardcoded address in Python code.

### Contract tests

`blockchain/test/LandRegistry.test.js` tests the contract with Chai assertions:

- Deployment sets the correct admin
- `registerProperty` emits the correct event and increments the counter
- `getProperty` returns accurate data
- `transferOwnership` updates `currentOwner` and records the transfer in history
- `onlyAdmin` reverts when called by any other address

Run with: `npx hardhat test`

---

## 5. The Flask Backend

**Directory:** `backend/`

### Application factory

`app.py` uses Flask's application factory pattern:

```python
def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.teardown_appcontext(close_db)
    init_db(app)
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(properties_bp)
    ...
    return app
```

The factory pattern means the app object is created inside a function, which makes it testable — you can create multiple instances with different configurations without them interfering.

### Blueprints

Flask organises routes into blueprints. Each blueprint is a separate file in `routes/`:

| Blueprint | Prefix | Responsibility |
|-----------|--------|----------------|
| `auth_bp` | `/api/auth` | Register, login, get current user |
| `properties_bp` | `/api/properties` | CRUD for land parcels |
| `transfers_bp` | `/api/transfers` | Initiate, approve, reject transfers |
| `documents_bp` | `/api/documents` | Upload, hash, verify documents |
| `insights_bp` | `/api/insights` | Statistics, anomalies, chain status |

### Database

`models/database.py` contains the SQLite schema as a multi-line string and an `init_db` function that runs it on startup using `conn.executescript(SCHEMA)`. SQLite is used because it requires no installation — the database is a single file (`plotify.db`).

The schema creates four tables: `users`, `properties`, `transfers`, `documents`. Foreign key constraints are enforced with `PRAGMA foreign_keys=ON` in `extensions.py`.

### Config

`config.py` reads all configuration from environment variables via `python-dotenv`. The most important values are `BLOCKCHAIN_RPC_URL`, `CONTRACT_ADDRESS` and `ADMIN_PRIVATE_KEY`. These are never hardcoded in source — they come from `.env`.

---

## 6. Authentication and JWT

**File:** `backend/extensions.py`

### How registration works

1. Client sends `POST /api/auth/register` with `{ username, password }`.
2. Flask checks the username is not already taken.
3. Password is hashed with `werkzeug.security.generate_password_hash` (uses PBKDF2-SHA256 by default).
4. User row is inserted into SQLite.
5. A JWT is generated and returned.

### How login works

1. Client sends `POST /api/auth/login` with `{ username, password }`.
2. Flask fetches the user row.
3. `check_password_hash` compares the submitted password against the stored hash.
4. If correct, a JWT is generated and returned.

### JWT structure

The token payload:

```python
payload = {
    "sub":      str(user_id),   # subject — PyJWT 2.10+ requires string
    "username": username,
    "role":     role,           # "admin" or "user"
    "iat":      datetime.utcnow(),
    "exp":      datetime.utcnow() + timedelta(hours=24),
}
```

The token is signed with `HS256` (HMAC-SHA256) using the `SECRET_KEY` from `.env`.

### The `token_required` decorator

Every protected route uses `@token_required` from `extensions.py`. It:

1. Reads the `Authorization: Bearer <token>` header.
2. Decodes and verifies the JWT.
3. Injects the decoded payload as `current_user` into the route function.

If the token is missing, expired or invalid, it returns a 401 immediately.

### The `admin_required` decorator

Stacked on top of `token_required` for admin-only routes like anomaly detection and transfer approval:

```python
@app.route("/api/insights/anomalies")
@token_required
@admin_required
def anomalies(current_user):
    ...
```

The order matters — `token_required` runs first, then `admin_required` checks the role inside the already-decoded payload.

---

## 7. The Blockchain Service

**File:** `backend/services/blockchain.py`

This is the Python class that talks to the smart contract. It is the most technically complex part of the backend.

### Initialisation

```python
class BlockchainService:
    def __init__(self, rpc_url, contract_address, private_key):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.account = self.w3.eth.account.from_key(private_key)
        # Load ABI from the artifact file written by deploy.js
        with open(_ARTIFACT_PATH) as f:
            artifact = json.load(f)
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(contract_address),
            abi=artifact["abi"],
        )
```

`ExtraDataToPOAMiddleware` is required because Hardhat uses a proof-of-authority chain, which adds extra fields to block headers that standard Web3.py doesn't expect. Without this middleware, `eth_getBlockByNumber` calls fail.

`account.from_key(private_key)` loads the admin Ethereum account from the private key. This account signs every transaction.

### Sending a transaction

The `_send_tx` method handles the full transaction lifecycle:

```python
def _send_tx(self, fn) -> str:
    tx = fn.build_transaction({
        "from":  self.account.address,
        "nonce": self.w3.eth.get_transaction_count(self.account.address),
        "gas":   500_000,
    })
    signed = self.w3.eth.account.sign_transaction(tx, self.account.key)
    raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
    tx_hash = self.w3.eth.send_raw_transaction(raw)
    receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status != 1:
        raise RuntimeError("Transaction reverted")
    return tx_hash.hex()
```

Step by step:
1. `build_transaction` constructs the transaction object with the current nonce (to prevent replay attacks) and gas limit.
2. `sign_transaction` signs it offline with the admin private key — the key never leaves the server.
3. `send_raw_transaction` broadcasts the signed transaction to the Hardhat node.
4. `wait_for_transaction_receipt` blocks until the transaction is mined. On Hardhat, this is nearly instant (auto-mining).
5. `receipt.status != 1` means the transaction was reverted (e.g., `onlyAdmin` check failed).

The returned `tx_hash` is a 64-character hex string prefixed with `0x`. This is what gets stored in SQLite and displayed in the dashboard.

### Off-chain fallback

In `routes/properties.py`, the blockchain call is wrapped in a try/except:

```python
try:
    bc = BlockchainService.from_app(current_app)
    tx_hash, blockchain_id = bc.register_property(title, loc, int(area), wallet)
except Exception as exc:
    current_app.logger.warning("Blockchain registration failed: %s", exc)
    # Proceed with off-chain record only
```

If Hardhat is not running, the property is still saved to SQLite with `tx_hash = None`. The dashboard shows "Off-chain" in those cases. This fallback means the system never crashes just because the blockchain node is down.

---

## 8. Document Hashing

**File:** `backend/services/document_hash.py`

The process:

1. User uploads a file via `POST /api/documents/upload`.
2. Flask reads the raw bytes from the file stream.
3. `hash_bytes(data)` runs `hashlib.sha256(data).hexdigest()` — this produces a 64-character hex string that uniquely identifies the exact content of the file.
4. The file is saved to `backend/uploads/`.
5. The hash is stored in the `documents` table in SQLite.
6. Optionally, the hash is anchored on-chain by calling `bc.add_document_hash`.

To verify a document later:

1. User uploads the file again via `POST /api/documents/verify`.
2. Flask re-hashes it.
3. Compares the new hash against the stored hash (either from the database by document ID, or directly against a hash the user provides).
4. Returns `{ match: true/false, actual_hash, stored_hash }`.

If the file was modified even by a single byte — a pixel in an image, a space in a PDF — the SHA-256 hash changes completely. This is the avalanche effect of SHA-256 and is what makes it useful for integrity verification.

The `bytes32` on-chain anchor is the same hash converted from hex string to raw bytes:

```python
doc_hash_bytes = bytes.fromhex(sha256_hex)
# sha256_hex = "a3f8c2..." (64 chars)
# doc_hash_bytes = b'\xa3\xf8\xc2...' (32 bytes)
```

---

## 9. ML Anomaly Detection

**File:** `backend/services/anomaly.py`

Isolation Forest is an unsupervised machine learning algorithm that detects anomalies without needing labelled training data. It works by randomly partitioning the feature space into trees and measuring how many splits are needed to isolate each data point. Points that are easy to isolate (few splits) are anomalous; points that require many splits are normal.

### Features used

For each property in the database, three numerical features are computed:

**`transfer_count`** — total number of approved transfers. A property transferred many times is unusual and potentially suspicious.

**`days_since_reg`** — how many days ago the property was registered. A very recently registered property that has already been transferred many times is a red flag.

**`avg_days_between`** — the average number of days between consecutive transfers. A property transferred multiple times within hours has a very low average interval, which is anomalous.

### The pipeline

```python
features = df[["transfer_count", "days_since_reg", "avg_days_between"]].values

clf = IsolationForest(
    n_estimators=100,    # 100 decision trees in the ensemble
    contamination=0.1,   # expect ~10% of properties to be anomalous
    random_state=42,     # reproducible results
)
clf.fit(features)

df["_label"] = clf.predict(features)   # -1 = anomaly, 1 = normal
df["_score"] = clf.score_samples(features)  # lower score = more anomalous
```

`contamination=0.1` means the model assumes roughly 10% of properties are anomalous. This threshold determines the decision boundary.

### The seeded anomalies

`seed.py` deliberately creates two anomalous properties:

- `Dharavi Redevelopment Plot` — transferred 5 times within a 9-hour window
- `Electronic City Plot B7` — transferred 2 times on the same day it was registered

Both properties will reliably trigger the Isolation Forest because their feature vector (high transfer count, low average interval, near-zero days since registration) is extreme compared to the other 10 normal properties.

### Why Isolation Forest specifically

The requirement was anomaly detection without labelled data — there is no training set of "definitely fraudulent" cases. Isolation Forest handles this well because it is purely unsupervised. Other alternatives like DBSCAN or One-Class SVM could work, but Isolation Forest is simpler to tune and fast on small datasets.

---

## 10. The React Frontend

**Directory:** `frontend/src/`

### Application shell

`App.jsx` defines all routes. Protected routes are wrapped in two components:

```jsx
function RequireAuth({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
}

function DashboardShell({ children }) {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <TopBar />
                <div>{children}</div>
            </div>
        </div>
    );
}
```

`RequireAuth` reads the user from `AuthContext`. If there is no authenticated user, it redirects to `/login` immediately. `DashboardShell` renders the persistent navigation around each page.

### Auth context

`context/AuthContext.jsx` manages authentication state for the entire application. It:

- Stores the user object in React state, initialised from `localStorage` so the session survives page refresh.
- Exposes `signIn`, `signUp` and `signOut` functions.
- Computes `isAdmin` as `user?.role === "admin"`.

When `signIn` is called:
1. It calls the Flask login endpoint.
2. Saves the JWT token to `localStorage.setItem("token", ...)`.
3. Saves the user object to `localStorage.setItem("user", ...)`.
4. Updates React state.

When `signOut` is called:
1. Removes both items from localStorage.
2. Sets user to null — React re-renders and `RequireAuth` redirects.

### Design system

`index.css` defines all CSS custom properties (variables), component classes and utility classes in one file. This ensures consistency:

```css
:root {
    --forest:    #173F35;
    --green:     #287A68;
    --sage:      #8DA99B;
    --soft-sage: #E9EFE7;
    --ivory:     #F8F7F2;
}
```

Every page imports this file once via `main.jsx`. Components use `var(--forest)` rather than hardcoded hex values, so the palette can be changed in one place.

---

## 11. The API Layer

**File:** `frontend/src/services/api.js`

All HTTP communication goes through a single Axios instance:

```javascript
const api = axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
});
```

### JWT interceptor

The request interceptor automatically attaches the token to every outgoing request:

```javascript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

This means no page or component has to manually set the `Authorization` header — it happens transparently for every API call.

### 401 handler

The response interceptor handles expired or invalid tokens globally:

```javascript
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");
        if (err.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setTimeout(() => { window.location.href = "/login"; }, 100);
        }
        return Promise.reject(err);
    }
);
```

The 100ms delay before redirecting gives React time to settle its state updates. Auth endpoints are excluded because a failed login legitimately returns 401 and should not trigger a redirect.

### Vite proxy

In development, Vite forwards all `/api` requests to Flask:

```javascript
// vite.config.js
server: {
    proxy: {
        "/api": { target: "http://localhost:5000", changeOrigin: true }
    }
}
```

This eliminates CORS issues during development. In production, the same behaviour would be achieved by serving the React build through Nginx with a proxy pass directive.

---

## 12. The Landing Page Canvas

**File:** `frontend/src/pages/Landing.jsx`

The landing page hero uses an HTML `<canvas>` element rendered by the `BlockchainCanvas` React component.

### Node types

Nodes are split into two types at initialisation:

```javascript
nodes.current = Array.from({ length: COUNT }, (_, i) => ({
    x:    Math.random() * W,
    y:    Math.random() * H,
    vx:   (Math.random() - 0.5) * 0.28,  // horizontal velocity
    vy:   (Math.random() - 0.5) * 0.28,  // vertical velocity
    isBlock: i < 8,                        // first 8 are clickable block nodes
    blockData: i < 8 ? BLOCK_DATA[i % BLOCK_DATA.length] : null,
    lit:  Math.random() > 0.82,           // ~18% are brighter
}));
```

### Animation loop

`requestAnimationFrame` drives the loop. Each frame:

1. Update velocities — nodes near the cursor accelerate toward it at `MOUSE_FORCE = 0.01`. Velocities are capped by damping `n.vx *= 0.991`.
2. Update positions — add velocity to position, wrap edges (teleport to the opposite side instead of bouncing).
3. Draw edges — for every pair of nodes within `CONNECT_DIST = 120px`, draw a line with opacity proportional to `(1 - distance / CONNECT_DIST)`.
4. Draw the travelling tx packet — a teal dot that moves along a randomly-chosen path of block nodes, creating a visual representation of a transaction in flight.
5. Draw nodes — block nodes get a pulsing ring and a `#` symbol; regular nodes are simple circles.

### Click detection

`canvas.addEventListener("click", ...)` iterates over all block nodes and checks `Math.hypot(cx - n.x, cy - n.y) < hitRadius`. On hit, it calls `onNodeClick(n.blockData, e.clientX, e.clientY)`, which sets React state to show the `NodeTooltip` component as a fixed-positioned overlay.

### Performance

The canvas is cleared and redrawn every frame — typically 60 times per second. The `O(n²)` edge-drawing loop is the performance-critical part. With `n ≈ 60` nodes, that is ~1,800 pairs checked per frame, which is well within real-time performance limits.

---

## 13. The Dashboard

**File:** `frontend/src/pages/Dashboard.jsx`

### Data loading strategy

The dashboard makes multiple parallel API calls. Chain status is separated out because it can be slow if the node is unreachable:

```javascript
// Chain status — fetched independently, never blocks core data
getChainStatus()
    .then(r => setChain(r.data))
    .catch(() => setChain({ connected: false, error: "Unavailable" }));

// Core data — all three in parallel
Promise.all([getStats(), getProperties(), getTransfers()])
    .then(([sRes, pRes, tRes]) => {
        setStats(sRes.data);
        setProps(pRes.data);
        setTransfers(tRes.data);
    })
    .catch(err => setError("Could not load dashboard data."));
```

`Promise.all` fires three requests simultaneously and waits for all three to resolve. This is faster than sequential await calls, which would add the latency of each request together.

### Chain status panel

The `ChainPill` component calls `GET /api/insights/chain-status`. The backend performs a 1.5-second TCP socket probe to port 8545 before trying Web3 — this ensures the endpoint returns quickly when Hardhat is down rather than waiting for a full Web3 connection timeout.

### Blockchain explorer

`BlockchainExplorer` renders properties and transfers that have real `tx_hash` values. These are sorted by date and displayed as a horizontal chain of clickable block cards connected by SVG dashed arrows. Clicking a card reveals transaction details including the full copyable hash, property name and date.

### Application tracker

`AppTracker` maps the transfer status to a step index:

```javascript
const idx = { pending: 1, approved: 4, rejected: 1 }[transfer.status] ?? 0;
```

Index 4 corresponds to "On-Chain" — an approved transfer that was processed by the admin will have a blockchain tx hash, so it correctly reaches the final step.

### ML anomaly panel

`AnomalyCard` is collapsed by default and expands on click. It shows each flagged property with its three feature values (transfer count, days since registration, average interval) so an admin can understand *why* the model flagged it — not just that it was flagged.

---

## 14. Data Flow — End to End

### Registering a property

1. Citizen fills out the form on `/register-land` and submits.
2. React calls `POST /api/properties` with `{ title, location, area }`.
3. Flask validates the input.
4. Flask looks up the citizen's `wallet_address` from the `users` table.
5. If a wallet address exists and the contract is configured, Flask calls `BlockchainService.register_property(title, location, area, wallet)`.
6. `BlockchainService._send_tx` builds, signs and broadcasts a transaction to Hardhat.
7. Hardhat mines the transaction (instant on local node). The `LandRegistry.registerProperty` function runs, stores the `Property` struct and emits `PropertyRegistered`.
8. The tx hash is returned to Flask.
9. Flask inserts a row into the SQLite `properties` table with the tx hash and blockchain ID.
10. Flask returns `201 Created` with the new property data.
11. React navigates to the dashboard and shows the new property.

### Approving a transfer

1. Citizen submits `POST /api/transfers` requesting to transfer a property.
2. Flask creates a `pending` row in the `transfers` table and sets the property status to `pending_transfer`.
3. Admin logs in, sees the pending transfer in the dashboard, clicks Approve.
4. React calls `PUT /api/transfers/:id/approve`.
5. Flask verifies the caller is admin.
6. Flask looks up the from and to wallet addresses.
7. Flask calls `BlockchainService.transfer_ownership(contract_id, from_wallet, to_wallet, note)`.
8. The smart contract verifies `from` is the current owner, updates `currentOwner`, pushes to `transferHistory`, and emits `OwnershipTransferred`.
9. Flask updates the SQLite transfer status to `approved`, sets the tx hash, and updates the property owner.
10. Both stores are now consistent: SQLite has the updated owner, and the chain has the immutable transfer record.

### Verifying a document

1. User uploads a file to `POST /api/documents/verify` along with either a document ID or an expected hash.
2. Flask re-hashes the uploaded file bytes.
3. If a document ID was provided, Flask fetches the stored hash from SQLite. If a raw hash was provided, it is used directly.
4. Flask compares the two hashes.
5. Returns `{ match: true/false, actual_hash, stored_hash }`.
6. The dashboard shows a green "Document is authentic" or red "Hash mismatch" result.

---

## 15. The Two-Store Architecture

A common interview question: "Why do you have both SQLite and a blockchain? Why not use only the blockchain?"

**Why not blockchain only:**

- Querying a blockchain is slow and expensive for complex searches (find all properties in Mumbai owned by this user, sorted by date).
- Blockchains do not support full-text search, joins, or aggregation natively.
- Reading from a smart contract requires knowing the exact key. There is no `SELECT * WHERE location LIKE '%Mumbai%'`.

**Why not SQLite only:**

- A database is mutable. An admin can update or delete records. There is no way to prove that a record has not been altered.
- There is no independent audit trail. If someone changes the owner of a property in the database, it looks exactly the same as the original registration.

**The combined approach:**

- SQLite handles everything that needs to be fast, searchable and relational: user accounts, property lists, document metadata, transfer history queries.
- The blockchain handles everything that needs to be permanent and independently verifiable: the proof that a specific property was registered at a specific time by a specific wallet, and the complete immutable chain of ownership changes.

The chain-status panel in the dashboard makes this visible: every property row shows either a green "On-chain" indicator with a tx hash, or a grey "Off-chain" label. Users can see at a glance which records have blockchain proof and which do not.

---

## 16. Design Decisions and Trade-offs

### Centralised admin key

Only the admin wallet can write to the contract. This makes the system centralised by design. A citizen cannot directly register their own land on the blockchain — they submit a request, an admin reviews it, and only the admin's wallet signs the blockchain transaction.

This is appropriate for a government land registry. The authority reviewing and approving registrations is the government office, not the citizen. The blockchain is used as an immutable audit log of what the authority approved, not as a trustless peer-to-peer system.

The trade-off: if the admin key is compromised, an attacker can write arbitrary data to the contract. This is why real deployments would use a multi-sig wallet requiring multiple independent approvals.

### Local Hardhat node, not a public testnet

The contract runs on a private local chain. Transaction hashes are real Ethereum hashes but are not verifiable on any public explorer. Deploying to Sepolia or Polygon Amoy would make every hash publicly verifiable on Etherscan.

The technical change required: add a network configuration to `hardhat.config.js` with RPC URL and private key for the testnet, run `npx hardhat run scripts/deploy.js --network sepolia`, and update `.env` with the new contract address and RPC URL.

### JWT expiry

Tokens expire after 24 hours (configurable in `.env`). There is no refresh token mechanism. When a token expires, the response interceptor in `api.js` redirects to `/login`. This is a simplification — production applications would implement refresh tokens to avoid forcing re-login mid-session.

### Document storage on local disk

Uploaded files are stored in `backend/uploads/`. This works locally but does not scale. The natural next step is IPFS (InterPlanetary File System), where the file's content address (CID) is deterministic from its content — similar to the SHA-256 hash approach already used, but distributed. The CID would then be stored on-chain instead of a hash.

---

## 17. What Each File Does

```
plotify/
├── README.md                        Project overview and setup instructions
├── WALKTHROUGH.md                   This file

├── backend/
│   ├── app.py                       Flask application factory, blueprint registration
│   ├── config.py                    Reads all config from .env file
│   ├── extensions.py                Shared helpers: get_db, token_required, admin_required
│   ├── seed.py                      Populates demo data including anomalous properties
│   ├── requirements.txt             Python dependencies
│   ├── .env.example                 Template for environment variables
│   │
│   ├── models/
│   │   └── database.py              SQLite schema (CREATE TABLE statements), init_db
│   │
│   ├── routes/
│   │   ├── auth.py                  Register, login, get current user
│   │   ├── properties.py            List, create, get, update land parcels
│   │   ├── transfers.py             Request, approve, reject ownership transfers
│   │   ├── documents.py             Upload files, compute SHA-256, verify integrity
│   │   └── insights.py              Platform stats, Isolation Forest anomalies, chain status
│   │
│   ├── services/
│   │   ├── blockchain.py            Web3.py wrapper — signs and sends Ethereum transactions
│   │   ├── document_hash.py         SHA-256 hashing utilities
│   │   └── anomaly.py               Isolation Forest ML pipeline
│   │
│   └── blockchain_artifacts/
│       └── LandRegistry.json        Contract ABI + deployed address (auto-generated by deploy.js)

├── blockchain/
│   ├── hardhat.config.js            Solidity version, network config, path config
│   ├── package.json                 Hardhat toolbox dependency, npm scripts
│   │
│   ├── contracts/
│   │   └── LandRegistry.sol         The smart contract — all on-chain state and logic
│   │
│   ├── scripts/
│   │   └── deploy.js                Deploys contract and writes ABI+address to backend/
│   │
│   └── test/
│       └── LandRegistry.test.js     Chai/Hardhat tests for the contract

└── frontend/
    ├── vite.config.js               Dev server config, /api proxy to Flask
    ├── package.json                 React, Vite, React Router, Axios dependencies
    ├── index.html                   HTML entry point
    │
    └── src/
        ├── main.jsx                 React root, wraps App in AuthProvider, BrowserRouter
        ├── App.jsx                  All routes, RequireAuth guard, DashboardShell
        ├── index.css                Design system: CSS variables, component classes
        │
        ├── context/
        │   └── AuthContext.jsx      Authentication state, signIn/signUp/signOut
        │
        ├── services/
        │   └── api.js               Axios instance, JWT interceptor, 401 redirect, all API calls
        │
        ├── components/
        │   ├── Layout/
        │   │   ├── Sidebar.jsx      Navigation panel (role-aware: admin vs citizen links)
        │   │   └── TopBar.jsx       Page title, search bar, notifications, user dropdown
        │   └── UI/
        │       └── Skeleton.jsx     Loading skeleton component
        │
        └── pages/
            ├── Landing.jsx          Dark immersive page with interactive blockchain canvas
            ├── Login.jsx            Split panel, one-click demo login buttons
            ├── Register.jsx         Single-form account creation
            ├── Dashboard.jsx        Main workspace (chain status, stats, explorer, anomalies)
            ├── PropertySearch.jsx   Searchable, filterable property list
            ├── PropertyDetails.jsx  Tabbed detail: info, ownership timeline, documents
            ├── RegisterProperty.jsx Form to submit a new land parcel
            ├── TransferRequests.jsx List and manage ownership transfer requests
            ├── OwnershipHistory.jsx Property-by-property transfer timeline
            ├── DocumentVerification.jsx Upload, hash and verify documents
            ├── Insights.jsx         Platform statistics and ML anomaly panel
            └── PublicVerify.jsx     Public search with no authentication required
```

---

## 18. How to Explain This in an Interview

### One-sentence version

"Plotify is a blockchain land registry where property registrations and ownership transfers are anchored on an Ethereum smart contract, making the ownership history permanent and independently verifiable, with a Flask API bridging the on-chain state to a React dashboard."

### Two-minute version

"The core idea is that traditional land registries store records in a database controlled by one authority, which can be altered. Plotify adds a second store: every time a property is registered or transferred, the Flask backend signs an Ethereum transaction using the admin wallet and calls the `LandRegistry` Solidity contract. The contract stores the ownership record permanently — no one, including the admin, can modify or delete it. The Flask backend also maintains a SQLite database for things that need to be fast and searchable, like user accounts and querying properties by location. The two stores work together: SQLite for application logic, the blockchain for the immutable audit trail. On top of that, documents are SHA-256 hashed before storage so users can verify a title deed hasn't been tampered with, and there's a scikit-learn Isolation Forest model that flags properties with unusual transfer patterns — like a property transferred five times in one day — as potentially fraudulent."

### Questions you will be asked

**"Why did you choose Isolation Forest for anomaly detection?"**
It is unsupervised, meaning it does not need labelled training data — there are no examples of confirmed fraudulent transfers to learn from. It works by measuring how easy it is to isolate a data point from all others. A property with 5 transfers in one day is very easy to isolate from normal properties; a property transferred once in 3 years is not. This makes it a natural fit for the fraud detection use case.

**"What is the trust model? Can the admin commit fraud?"**
Yes — the admin controls the only key that can write to the contract. This is a deliberate centralisation for a government registry context. The blockchain provides an immutable log of what the admin approved, but it does not prevent a corrupt admin from approving a fraudulent transfer. Mitigation would require multi-sig governance, time-locked upgrades, or a community validator mechanism — all legitimate extensions of this project.

**"Why does the blockchain fall back to off-chain?"**
The blockchain is an optional enhancement, not a critical dependency. If the Hardhat node is not running when a property is registered, the application still works — the property is stored in SQLite with `tx_hash = NULL`. This makes development and testing easier. In production on a testnet, the node would always be available and the fallback would rarely trigger.

**"How does SHA-256 document verification work?"**
SHA-256 is a one-way cryptographic hash function. Given any file, it produces a unique 64-character string. If the file is changed by even a single bit, the hash changes completely — this is called the avalanche effect. We store the hash when a document is uploaded. When someone wants to verify the document later, they upload it again, we re-hash it, and compare. If the hashes match, the file is identical to the original. If they differ, the file has been modified.
