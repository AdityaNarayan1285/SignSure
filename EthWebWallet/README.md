```markdown
# Ethereum Web Wallet Code

## Installation

### Method 1

If using cloned code, simply run:

```bash
npm install

```

To install dependencies.

### Method 2

If building the project from scratch, use the following methods:

```bash
npm init
npm install lite-server

```

Install openzeppelin-solidity:

```bash
npm install openzeppelin-solidity

```

## Deployment

I am using **Geth** as the node here, but you can also use **Ganache**. Please note that network configuration and accounts must be consistent between the deployment and the web page.

Unlock the account when deploying:

```javascript
personal.unlockAccount(eth.accounts[0],"");

```

Migrate:

```bash
truffle migrate

```

## Start Web Service

Since the provider uses a local Geth node, you need to start Geth first:

```bash
geth --datadir testNet --dev --rpc --rpccorsdomain "http://localhost:3000" console

```

Of course, the provider can also be modified in `app.js` according to your requirements. Reference documentation: https://docs.ethers.io/ethers.js/html/api-providers.html

Start the web program:

```bash
npm run dev

```

```

```
