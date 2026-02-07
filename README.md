# 🛡️ SignSure — Transaction Safety Engine for Ethereum Wallets

SignSure is a **deterministic transaction safety engine** that analyzes Ethereum transactions *before signing* to protect users from common on-chain scams such as unlimited token approvals, NFT drains, and interactions with unverified contracts.

SignSure is designed to be **simple, transparent, and wallet-agnostic**, making it ideal for browser wallets, custom wallets, and security-focused dApps.

---

## 🚨 Problem

Most users sign transactions without understanding what they actually do.

Current wallets often:

* Show raw calldata or vague warnings
* Do not clearly classify risk levels
* Allow unlimited approvals and NFT drain permissions without strong alerts

This leads to:

* Token drain scams
* NFT theft
* Loss of user trust

---

## ✅ Solution

SignSure sits **between transaction creation and signing**.

Before a transaction is signed, SignSure:

1. Decodes the transaction calldata
2. Classifies the exact on-chain action
3. Applies **deterministic, rule-based safety checks**
4. Returns a **clear risk level, safety score, and human-readable explanation**

---

## 🧠 How SignSure Works

```
Wallet / dApp
   ↓ (raw transaction)
SignSure Decoder
   ↓
Risk Rule Engine
   ↓
Safety Result
   ↓
User confirms or rejects
```

### Input

```json
{
  "to": "0x...",
  "data": "0x...",
  "value": "0"
}
```

### Output

```json
{
  "riskLevel": "SAFE | CAUTION | HIGH",
  "safetyScore": 0-100,
  "reasons": ["Human-readable explanation"],
  "decodedFunction": "approve | setApprovalForAll | transfer | unknown"
}
```

---

## 🔐 Priority Safety Checks

SignSure runs **all checks automatically** when the user clicks **“Check Transaction”**, following a strict priority order.

### 🔴 High Risk (Overrides All)

* Unlimited ERC-20 approvals (`approve(..., MAX_UINT256)`)
* NFT full collection approvals (`setApprovalForAll(true)`)
* Simulated asset loss (if simulation is available)

**Result:**

* Risk: HIGH
* Score: 0–20

---

### 🟡 Medium Risk (Caution)

* Limited ERC-20 approvals
* Unknown / undecodable contract interactions
* Unverified contract source code

**Result:**

* Risk: CAUTION
* Score: 40–70 (penalties apply)

---

### 🟢 Low Risk (Safe)

* Simple ETH transfer to an EOA with no calldata

**Result:**

* Risk: SAFE
* Score: 90–100

---

## 🧩 Wallet Integration

SignSure is designed to be easily integrated into any wallet.

### Pre-Sign Integration (Recommended)

```js
const tx = buildTransaction();
const risk = await txGuard.analyzeTransaction(tx);

if (risk.riskLevel === "HIGH") {
  showDangerModal(risk);
  return;
}

if (risk.riskLevel === "CAUTION") {
  showWarningModal(risk);
}

signAndSend(tx);
```

SignSure **never signs transactions** — it only analyzes and explains risk.

---

## 🧪 Demo Test Cases

| Scenario                 | Expected Risk |
| ------------------------ | ------------- |
| ETH transfer             | SAFE          |
| Limited token approval   | CAUTION       |
| Unlimited token approval | HIGH          |
| NFT approval for all     | HIGH          |
| Unknown contract call    | CAUTION       |

These cases are used in live demos to show real-world protection.

---

## 🏗️ Project Structure

```
/txguard-core
  ├─ decoder.js
  ├─ riskEngine.js
  ├─ scoreMapper.js
  └─ index.js

/wallet
  └─ preSignHook.js
```

SignSure logic is reusable across:

* Wallet UI
* Browser extension
* Web demo playground

---

## 🔍 Why SignSure Is Different

| Feature                    | Typical Wallets | SignSure              |
| -------------------------- | --------------- | --------------------- |
| Transaction decoding       | Partial         | Deterministic         |
| Risk levels                | Vague           | SAFE / CAUTION / HIGH |
| Safety score               | ❌               | ✅                     |
| Unlimited approval warning | Inconsistent    | Always HIGH           |
| NFT drain detection        | Weak            | Explicit              |
| Transparent reasoning      | ❌               | ✅                     |

---

## 🛠️ Tech Stack

* JavaScript / TypeScript
* Ethereum JSON-RPC
* Ethers.js
* Etherscan API (optional)
* Chain simulation (optional)

---

## 🎯 Hackathon Focus

SignSure prioritizes:

* Explainability over complexity
* Deterministic rules over AI guessing
* User protection before signing

This makes SignSure **judge-friendly, extensible, and production-relevant**.

---

## 🚀 Future Improvements

* Transaction simulation (before/after balances)
* Allowance revocation suggestions
* Reputation scoring for contracts
* Support for more protocols

---

## 👥 Team

Built during a 24-hour hackathon by a team focused on **wallet safety and user trust**.

---

## 📜 License

MIT License

---

**SignSure — Understand Before You Sign.**
