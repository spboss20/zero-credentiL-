# ZeroPass: Decentralized Verifiable Identity Infrastructure

ZeroPass is a production-grade decentralized identity and verifiable credential platform inspired by the W3C Verifiable Credentials Data Model v2.0 and the Privado ID ecosystem. It enables authorized organizations to issue cryptographically signed credentials, allows citizens and users to hold self-sovereign proofs in a personal vault, and empowers verifiers to validate eligibility predicates using zero-knowledge selective disclosure without data surveillance.

---

## 1. Project Folder Structure

```
├── /
│   ├── index.html                   # HTML entry point with fonts & metadata
│   ├── metadata.json                # AI Studio application metadata
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json                # TypeScript bundler configuration
│   ├── vite.config.ts               # Vite configuration with Tailwind CSS plugin
│   ├── server.ts                    # Full-stack Express server with Vite middleware
│   ├── README.md                    # System documentation & runbook
│   │
│   ├── server/                      # Server-side architecture & cryptographic KMS
│   │   ├── crypto.ts                # ES256 keypair management, W3C JWS signing, & ZK predicate engine
│   │   ├── db.ts                    # Thread-safe in-memory database store with development seed data
│   │   └── routes/
│   │       ├── auth.ts              # Session management, DID accounts, & RBAC middleware
│   │       ├── credentials.ts       # W3C VC issuance, revocation registry, & raw JWT audit
│   │       ├── developer.ts         # API keys, webhooks, and audit logs
│   │       ├── digilocker.ts        # Dedicated MeitY / API Setu integration module
│   │       ├── issuers.ts           # Trusted issuer registry, schemas, & W3C DID document resolver
│   │       └── verifier.ts          # Policy registration, proof requests, & server-side verification
│   │
│   └── src/                         # Frontend client application
│       ├── App.tsx                  # Application root & React Router configuration
│       ├── main.tsx                 # React DOM mount point
│       ├── index.css                # Tailwind CSS v4 styling & typography
│       ├── types/                   # Shared TypeScript domain contracts
│       │   └── index.ts             # W3C VC, VP, DID, schema, & verification types
│       ├── services/
│       │   └── api.ts               # Typed REST API client
│       ├── context/
│       │   └── AuthContext.tsx      # Multi-role authentication & session state
│       ├── components/
│       │   ├── Navbar.tsx           # Strict Top Bar Contract with persona switcher
│       │   ├── Footer.tsx           # Architecture disclosure & standards references
│       │   ├── CredentialCard.tsx   # Visual credential with selective disclosure masking
│       │   ├── RawJwtModal.tsx      # JWS token header/payload/signature inspector & live audit
│       │   ├── QrModal.tsx          # QR code & deep link presentation generator
│       │   └── StatusIndicator.tsx  # Accessible zero-pill status indicator
│       └── pages/
│           ├── LandingPage.tsx      # Public landing page with interactive ZK demo
│           ├── HolderWallet.tsx     # Personal wallet, proof request inbox, & presentation history
│           ├── IssuerPortal.tsx     # Issuance desk, schema templates, & revocation ledger
│           ├── VerifierPortal.tsx   # Policy builder, QR generation, & cryptographic audit reports
│           ├── IssuerDirectory.tsx  # Trusted issuer registry with public JWK inspector
│           ├── DeveloperPortal.tsx  # API key creation, webhooks, and audit logs
│           ├── DigiLockerPage.tsx   # MeitY / API Setu architecture & integration specification
│           └── DocsPage.tsx         # Technical cryptographic specification & API index
```

---

## 2. Expected Backend API Endpoints

The ZeroPass frontend interfaces with the following server endpoints:

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates and returns Bearer session token |
| `POST` | `/api/auth/register` | Public | Registers a new DID account |
| `GET` | `/api/auth/me` | Bearer Token | Retrieves current active user profile and DID |
| `POST` | `/api/auth/switch-role` | Public (Dev) | Seamlessly switches between Holder, Issuer, and Verifier |
| `GET` | `/api/issuers` | Public | Returns trusted issuer directory and public JWK keys |
| `GET` | `/api/issuers/:did/did.json` | Public | Resolves W3C standard JSON-LD DID document |
| `GET` | `/api/issuers/schemas` | Public | Lists approved credential schemas (Student, Age, Scholarship, License) |
| `POST` | `/api/issuers/schemas` | Issuer / Admin | Registers a custom credential schema definition |
| `GET` | `/api/credentials` | Bearer Token | Retrieves credentials filtered by holder or issuer DID |
| `POST` | `/api/credentials` | Issuer / Admin | Cryptographically signs and issues an ES256 W3C VC |
| `POST` | `/api/credentials/:id/revoke` | Issuer / Admin | Revokes credential and records in revocation registry |
| `POST` | `/api/credentials/verify-raw` | Public | Real-time mathematical verification of any raw JWT |
| `POST` | `/api/verification-requests` | Verifier | Creates a verification policy, nonce challenge, and QR link |
| `GET` | `/api/verification-requests` | Public | Lists active proof requests |
| `POST` | `/api/verifications` | Public / Holder | Submits presentation for full cryptographic audit |
| `GET` | `/api/presentations/history` | Bearer Token | Retrieves presentation receipts log |
| `GET` | `/api/developer/keys` | Bearer Token | Lists API keys with masked prefixes |
| `POST` | `/api/developer/keys` | Bearer Token | Creates new secret API key (shown once) |
| `DELETE` | `/api/developer/keys/:id` | Bearer Token | Revokes API key |
| `GET` | `/api/developer/logs` | Bearer Token | Live API audit requests log |
| `GET` | `/api/digilocker/status` | Public | Returns official MeitY checklist and provider status |
| `POST` | `/api/digilocker/validate-schema` | Public | Validates DigiLocker Pull URI taxonomy |
| `GET` | `/api/health` | Public | System health check and uptime monitor |

---

## 3. Frontend Features That Require a Backend

To ensure strict zero-trust cryptographic guarantees:
1. **ES256 Private Key Signing:** Private keys are maintained server-side in secure memory (or Cloud KMS). The browser never holds issuer signing authority.
2. **Cryptographic Verification Pipeline:** Verification of signatures, revocation status, expiration dates, and nonces occurs entirely on the server. The client never fabricates a "Verified" status.
3. **Revocation Registry:** Live check against the revocation registry to ensure invalidated credentials cannot be reused.
4. **Zero-Knowledge Predicate Arithmetic:** The server validates predicates (e.g., date of birth arithmetic against the server clock, or income limits) without exposing raw values to the verifier.
5. **API Key Generation & Hashing:** Secret keys are generated with secure random bytes, hashed via SHA-256 before storage, and never exposed in browser code.
6. **DigiLocker / API Setu Gateway:** Government gateway integration requires static server IP whitelisting and mutual TLS (mTLS) certificates that cannot execute in client browsers.

---

## 4. Local Installation & Development

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Installation
```bash
# 1. Clone repository and install dependencies
npm install

# 2. Start the development server (runs full-stack Express + Vite on port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

### Building for Production
```bash
# Build the client bundle with Vite
npm run build

# Start production server
npm run start
```
