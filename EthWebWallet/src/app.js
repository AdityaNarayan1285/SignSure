const MAX_UINT256 = ethers.constants.MaxUint256;

const App = {
  provider: null,
  activeWallet: null,
  cancelScrypt: false,
  sending: false,

  /* ======================
        MODAL SYSTEM
     ====================== */

  modal: {
    show({ title, content, danger = false, requireConfirm = false }) {
      return new Promise(resolve => {
        $('#modal-title').text(title);
        $('#modal-content').text(content);

        const input = $('#modal-input');
        input.toggleClass('hidden', !requireConfirm);
        input.val('');

        $('#modal-confirm')
          .toggleClass('primary', !danger)
          .toggleClass('danger', danger)
          .off()
          .on('click', () => {
            if (requireConfirm && input.val() !== "CONFIRM") return;
            $('#modal-backdrop').addClass('hidden');
            resolve(true);
          });

        $('#modal-cancel')
          .off()
          .on('click', () => {
            $('#modal-backdrop').addClass('hidden');
            resolve(false);
          });

        $('#modal-backdrop').removeClass('hidden');
      });
    },

    info(title, content) {
      return this.show({ title, content });
    }
  },

  /* ======================
        WALLET SETUP
     ====================== */

  setupWallet(wallet) {
    showWallet();

    App.provider = new ethers.providers.JsonRpcProvider(
      "https://sepolia.infura.io/v3/9ace0d648c8744bdb02697d9b5c915e1"
    );

    App.activeWallet = wallet.connect(App.provider);
    $('#wallet-address').val(wallet.address);

    $('#save-keystore').off().on('click', App.exportKeystore);

    App.refreshUI();
    App.setupSendEther();
  },

  init() {
    App.initLoadKey();
    App.initMnemonic();
    App.initLoadJson();
  },

  /* ======================
        UI REFRESH
     ====================== */

  async refreshUI() {
    if (!App.activeWallet) return;

    const balance = await App.provider.getBalance(App.activeWallet.address);
    $('#wallet-balance').val(ethers.utils.formatEther(balance));

    const nonce = await App.provider.getTransactionCount(
      App.activeWallet.address,
      "pending"
    );
    $('#wallet-transaction-count').val(nonce);
  },

  /* ======================
     🔐 COMPREHENSIVE TRANSACTION SAFETY CHECKER
     Follows strict priority order from checklist
     ====================== */

  /**
   * Check if an address is a contract
   */
  async isContract(address) {
    try {
      const code = await App.provider.getCode(address);
      return code && code !== "0x";
    } catch (err) {
      console.error("Error checking if contract:", err);
      return false;
    }
  },

  /**
   * Check if contract is verified on Etherscan
   */
  async isContractVerified(address) {
    try {
      // For Sepolia testnet
      const apiUrl = `https://api-sepolia.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=YourApiKeyToken`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === "1" && data.result && data.result[0]) {
        return data.result[0].SourceCode !== "";
      }
      return false;
    } catch (err) {
      console.warn("Could not verify contract source:", err);
      return false; // Assume unverified if we can't check
    }
  },

  /**
   * Decode function selector and parameters
   */
  decodeTransaction(data) {
    if (!data || data === "0x" || data.length < 10) {
      return { selector: null, decodedFunction: "transfer", params: null };
    }

    const selector = data.slice(0, 10).toLowerCase();
    
    // ERC-20 approve(address spender, uint256 amount)
    if (selector === "0x095ea7b3") {
      try {
        const spender = "0x" + data.slice(10, 74).padStart(64, '0').slice(-40);
        const amount = ethers.BigNumber.from("0x" + data.slice(74, 138));
        return {
          selector,
          decodedFunction: "approve",
          params: { spender, amount }
        };
      } catch (err) {
        return { selector, decodedFunction: "approve", params: null };
      }
    }

    // ERC-20 transfer(address to, uint256 amount)
    if (selector === "0xa9059cbb") {
      try {
        const to = "0x" + data.slice(10, 74).padStart(64, '0').slice(-40);
        const amount = ethers.BigNumber.from("0x" + data.slice(74, 138));
        return {
          selector,
          decodedFunction: "transfer",
          params: { to, amount }
        };
      } catch (err) {
        return { selector, decodedFunction: "transfer", params: null };
      }
    }

    // ERC-20 transferFrom(address from, address to, uint256 amount)
    if (selector === "0x23b872dd") {
      return { selector, decodedFunction: "transferFrom", params: null };
    }

    // ERC-721/1155 setApprovalForAll(address operator, bool approved)
    if (selector === "0xa22cb465") {
      try {
        const operator = "0x" + data.slice(10, 74).padStart(64, '0').slice(-40);
        const approved = data.slice(74, 138).padStart(64, '0').endsWith('1') || 
                        parseInt(data.slice(74, 138), 16) === 1;
        return {
          selector,
          decodedFunction: "setApprovalForAll",
          params: { operator, approved }
        };
      } catch (err) {
        return { selector, decodedFunction: "setApprovalForAll", params: null };
      }
    }

    // ERC-721 approve(address to, uint256 tokenId)
    if (selector === "0x095ea7b3") {
      return { selector, decodedFunction: "approve", params: null };
    }

    // Unknown function
    return { selector, decodedFunction: "unknown", params: null };
  },

  /**
   * 🔴 PRIORITY 1: Critical High-Risk Checks
   * Returns HIGH risk immediately if any condition matches
   */
  async checkPriority1_HighRisk(tx, decoded) {
    // 1️⃣ Unlimited ERC-20 Token Approval
    if (decoded.decodedFunction === "approve" && decoded.params) {
      const { amount } = decoded.params;
      
      if (amount && amount.eq(MAX_UINT256)) {
        return {
          isHighRisk: true,
          riskLevel: "HIGH",
          safetyScore: 10,
          decodedFunction: "approve",
          reasons: [
            "🚨 UNLIMITED ERC-20 APPROVAL DETECTED",
            "Approved contract can drain ALL tokens at any time",
            "This grants permanent unlimited access to your tokens",
            "Recommendation: Use a limited approval amount instead"
          ]
        };
      }
    }

    // 2️⃣ NFT Full Collection Approval
    if (decoded.decodedFunction === "setApprovalForAll" && decoded.params) {
      const { approved } = decoded.params;
      
      if (approved === true) {
        return {
          isHighRisk: true,
          riskLevel: "HIGH",
          safetyScore: 15,
          decodedFunction: "setApprovalForAll",
          reasons: [
            "🚨 NFT APPROVAL FOR ALL DETECTED",
            "ALL NFTs in your collection can be transferred without further consent",
            "Operator gets complete control over entire NFT collection",
            "Recommendation: Only approve specific token IDs if possible"
          ]
        };
      }
    }

    // 3️⃣ Simulation-Based Asset Loss (Placeholder - requires external service)
    // This would integrate with services like Tenderly, Blocknative, or custom simulation
    // For now, we'll add a hook for future implementation
    const simulationResult = await App.simulateTransaction(tx);
    if (simulationResult && simulationResult.predictsLoss) {
      return {
        isHighRisk: true,
        riskLevel: "HIGH",
        safetyScore: 5,
        decodedFunction: decoded.decodedFunction,
        reasons: [
          "🚨 SIMULATION PREDICTS ASSET LOSS",
          `Expected loss: ${simulationResult.lossDescription}`,
          "Transaction will result in immediate decrease in your balance",
          "Recommendation: DO NOT PROCEED unless you fully understand this transaction"
        ]
      };
    }

    return { isHighRisk: false };
  },

  /**
   * 🟡 PRIORITY 2: Medium-Risk (Caution) Checks
   * Accumulates warnings and reduces safety score
   */
  async checkPriority2_MediumRisk(tx, decoded) {
    let score = 70; // Base score for medium risk scenarios
    let reasons = [];
    let riskLevel = "CAUTION";

    const isContractTarget = await App.isContract(tx.to);

    // Special case: Sending ETH to contract without data
    if ((!tx.data || tx.data === "0x") && isContractTarget) {
      score = 60;
      reasons.push(
        "⚠️ Sending ETH to a smart contract address",
        "No function data provided - contract's fallback/receive function will be called",
        "Verify this is the intended recipient"
      );
      
      // Check if contract is verified
      const verified = await App.isContractVerified(tx.to);
      if (!verified) {
        score -= 15;
        reasons.push(
          "⚠️ Contract source code NOT VERIFIED on Etherscan",
          "Unable to review contract behavior"
        );
      } else {
        reasons.push("✓ Contract is verified on Etherscan");
      }
      
      return {
        isMediumRisk: true,
        riskLevel: "CAUTION",
        safetyScore: Math.max(score, 40),
        reasons
      };
    }

    // 4️⃣ Limited ERC-20 Token Approval
    if (decoded.decodedFunction === "approve" && decoded.params) {
      const { amount } = decoded.params;
      
      if (amount && !amount.eq(MAX_UINT256)) {
        score = 55;
        reasons.push(
          "⚠️ Token spending permission granted",
          `Approval amount: ${ethers.utils.formatUnits(amount, 18)} tokens`,
          "Contract can spend up to this amount of your tokens"
        );
      }
    }

    // 5️⃣ Unknown / Undecodable Contract Interaction
    if (decoded.decodedFunction === "unknown" && tx.data && tx.data !== "0x") {
      score -= 15;
      reasons.push(
        "⚠️ Unknown contract function called",
        `Function selector: ${decoded.selector}`,
        "Cannot decode or identify the contract action"
      );
      riskLevel = "CAUTION";
    }

    // 6️⃣ Unverified Contract Source Code (only if not already checked above)
    if (isContractTarget && tx.data && tx.data !== "0x") {
      const verified = await App.isContractVerified(tx.to);
      if (!verified) {
        score -= 20;
        reasons.push(
          "⚠️ Contract source code NOT VERIFIED on Etherscan",
          "Contract logic cannot be audited or reviewed",
          "Increased risk of malicious behavior"
        );
      } else {
        reasons.push("✓ Contract is verified on Etherscan");
      }
    }

    // Additional context-based warnings
    if (tx.data && tx.data !== "0x" && isContractTarget) {
      if (reasons.length === 0 || !reasons.some(r => r.includes("Contract"))) {
        reasons.push("ℹ️ Interacting with smart contract");
      }
    }

    // Check for suspiciously high gas price
    if (tx.gasPrice) {
      const gasPriceGwei = parseFloat(ethers.utils.formatUnits(tx.gasPrice, "gwei"));
      if (gasPriceGwei > 100) {
        score -= 5;
        reasons.push(
          "⚠️ Unusually high gas price",
          `Gas price: ${gasPriceGwei.toFixed(2)} gwei`
        );
      }
    }

    // Ensure score doesn't go below 40 for medium risk
    score = Math.max(score, 40);

    return {
      isMediumRisk: reasons.length > 0,
      riskLevel,
      safetyScore: score,
      reasons: reasons.length > 0 ? reasons : ["No significant warnings"]
    };
  },

  /**
   * 🟢 PRIORITY 3: Low-Risk / Safe Checks
   * Only reached if no high or medium risks found
   */
  async checkPriority3_Safe(tx, decoded) {
    // 7️⃣ Simple ETH Transfer - Check if it's to EOA or Contract
    if ((!tx.data || tx.data === "0x") && tx.to) {
      const isContractTarget = await App.isContract(tx.to);
      
      if (!isContractTarget) {
        return {
          isSafe: true,
          riskLevel: "SAFE",
          safetyScore: 98,
          decodedFunction: "transfer",
          reasons: [
            "✅ Simple ETH transfer to externally owned account (EOA)",
            "No hidden smart contract logic",
            "No token approvals or permissions",
            "Standard peer-to-peer transaction"
          ]
        };
      } else {
        // Sending ETH to contract without data - This should NOT be SAFE!
        // Return false to trigger Priority 2 checks
        return {
          isSafe: false,
          riskLevel: null, // Let Priority 2 handle this
          safetyScore: null,
          decodedFunction: decoded.decodedFunction,
          reasons: []
        };
      }
    }

    // Known safe functions
    const safeFunctions = ["transfer", "transferFrom"];
    if (safeFunctions.includes(decoded.decodedFunction)) {
      return {
        isSafe: true,
        riskLevel: "SAFE",
        safetyScore: 85,
        decodedFunction: decoded.decodedFunction,
        reasons: [
          `✅ Standard ${decoded.decodedFunction} function`,
          "Well-known and commonly used operation",
          "No unusual permissions granted"
        ]
      };
    }

    // Default safe response
    return {
      isSafe: true,
      riskLevel: "SAFE",
      safetyScore: 75,
      decodedFunction: decoded.decodedFunction,
      reasons: ["No suspicious behavior detected"]
    };
  },

  /**
   * Placeholder for transaction simulation
   * This should integrate with services like Tenderly, Blocknative, etc.
   */
  async simulateTransaction(tx) {
    // TODO: Implement actual simulation logic
    // For now, return null (no simulation available)
    return null;
    
    // Example of what a simulation service might return:
    /*
    return {
      predictsLoss: false,
      lossDescription: "0.5 ETH",
      balanceChanges: {
        eth: "-0.5",
        tokens: {}
      }
    };
    */
  },

  /**
   * 🔐 MAIN TRANSACTION ANALYSIS FUNCTION
   * Executes all checks in strict priority order
   */
  async analyzeTransactionStrict(tx) {
    try {
      // Decode the transaction
      const decoded = App.decodeTransaction(tx.data);

      // 🔴 PRIORITY 1: High-Risk Checks (OVERRIDE ALL)
      const priority1Result = await App.checkPriority1_HighRisk(tx, decoded);
      if (priority1Result.isHighRisk) {
        return priority1Result;
      }

      // 🟡 PRIORITY 2: Medium-Risk Checks (STACKABLE)
      const priority2Result = await App.checkPriority2_MediumRisk(tx, decoded);
      if (priority2Result.isMediumRisk) {
        return {
          riskLevel: priority2Result.riskLevel,
          safetyScore: priority2Result.safetyScore,
          decodedFunction: decoded.decodedFunction,
          reasons: priority2Result.reasons
        };
      }

      // 🟢 PRIORITY 3: Safe / Low-Risk Checks
      const priority3Result = await App.checkPriority3_Safe(tx, decoded);
      
      // If Priority 3 says it's not safe, go back and run Priority 2 checks
      if (!priority3Result.isSafe && priority3Result.riskLevel === null) {
        // This means it's a contract interaction that needs Priority 2 evaluation
        const priority2Recheck = await App.checkPriority2_MediumRisk(tx, decoded);
        return {
          riskLevel: priority2Recheck.riskLevel,
          safetyScore: priority2Recheck.safetyScore,
          decodedFunction: decoded.decodedFunction,
          reasons: priority2Recheck.reasons
        };
      }
      
      return {
        riskLevel: priority3Result.riskLevel,
        safetyScore: priority3Result.safetyScore,
        decodedFunction: priority3Result.decodedFunction || decoded.decodedFunction,
        reasons: priority3Result.reasons
      };

    } catch (err) {
      console.error("Error analyzing transaction:", err);
      return {
        riskLevel: "CAUTION",
        safetyScore: 50,
        decodedFunction: "unknown",
        reasons: [
          "⚠️ Error analyzing transaction",
          "Unable to complete full security analysis",
          "Proceed with extreme caution"
        ]
      };
    }
  },

  /* ======================
        ENHANCED FIREWALL UI
     ====================== */

  async firewallConfirm(result, tx) {
    // Risk level emoji and color
    const riskEmoji = {
      "SAFE": "🟢",
      "CAUTION": "🟡",
      "HIGH": "🔴"
    };

    const emoji = riskEmoji[result.riskLevel] || "⚪";

    // Format the value
    const valueStr = tx.value && !tx.value.isZero() 
      ? ethers.utils.formatEther(tx.value) + " ETH"
      : "0 ETH";

    // Format gas price
    const gasPriceStr = tx.gasPrice 
      ? ethers.utils.formatUnits(tx.gasPrice, "gwei") + " gwei"
      : "Not set";

    let content = `${emoji} Risk Level: ${result.riskLevel}
📊 Safety Score: ${result.safetyScore}/100
⚙️ Function: ${result.decodedFunction}

📍 To: ${tx.to}
💰 Amount: ${valueStr}
⛽ Gas Price: ${gasPriceStr}
🔢 Nonce: ${tx.nonce}

${result.riskLevel === "HIGH" ? "⚠️ HIGH RISK TRANSACTION DETECTED!\n" : ""}${result.reasons.map(r => r).join("\n")}
`;

    if (result.riskLevel === "HIGH") {
      content += `\n\n⚠️ Type "CONFIRM" to proceed with this HIGH RISK transaction.`;
    }

    return App.modal.show({
      title: `${emoji} Transaction Security Analysis`,
      content,
      danger: result.riskLevel === "HIGH",
      requireConfirm: result.riskLevel === "HIGH"
    });
  },

  /* ======================
        SEND ETH
     ====================== */

  setupSendEther() {
    $('#wallet-submit-send').off().on('click', async () => {
      if (App.sending || !App.activeWallet) return;
      App.sending = true;

      try {
        const to = ethers.utils.getAddress(
          $('#wallet-send-target-address').val()
        );
        const value = ethers.utils.parseEther(
          $('#wallet-send-amount').val()
        );

        const nonce = await App.provider.getTransactionCount(
          App.activeWallet.address,
          "pending"
        );

        let gasPrice = await App.provider.getGasPrice();
        gasPrice = gasPrice.mul(12).div(10); // 20% buffer

        const tx = { 
          to, 
          value, 
          nonce, 
          gasLimit: 21000, 
          gasPrice,
          data: "0x" // Explicitly set data for simple ETH transfer
        };

        // 🔐 RUN COMPREHENSIVE SECURITY ANALYSIS
        const analysis = await App.analyzeTransactionStrict(tx);
        
        // Show firewall confirmation dialog
        const allowed = await App.firewallConfirm(analysis, tx);
        if (!allowed) {
          return;
        }

        // Send transaction
        const sentTx = await App.activeWallet.sendTransaction(tx);

        await App.modal.info(
          "Transaction Sent",
          `Hash:\n${sentTx.hash}\n\nWaiting for confirmation…`
        );

        const receipt = await sentTx.wait();

        await App.modal.info(
          "Transaction Confirmed",
          `Block: ${receipt.blockNumber}
Gas Used: ${receipt.gasUsed.toString()}

Explorer:
https://sepolia.etherscan.io/tx/${sentTx.hash}`
        );

        // Clear form
        $('#wallet-send-target-address').val('');
        $('#wallet-send-amount').val('');

        App.refreshUI();
      } catch (err) {
        console.error("Transaction error:", err);
        App.modal.info("Transaction Failed", err.message || err.toString());
      } finally {
        App.sending = false;
      }
    });
  },

  /* ======================
        LOAD WALLET
     ====================== */

  initLoadKey() {
    $('#select-submit-privatekey').off().on('click', () => {
      try {
        let key = $('#select-privatekey').val().trim();
        if (!key.startsWith('0x')) key = '0x' + key;
        App.setupWallet(new ethers.Wallet(key));
      } catch (err) {
        App.modal.info("Error", "Invalid private key");
      }
    });
  },

  initMnemonic() {
    $('#select-submit-mnemonic').off().on('click', () => {
      try {
        App.setupWallet(
          ethers.Wallet.fromMnemonic(
            $('#select-mnemonic-phrase').val(),
            $('#select-mnemonic-path').val()
          )
        );
      } catch (err) {
        App.modal.info("Error", "Invalid mnemonic");
      }
    });
  },

  initLoadJson() {
    setupDropFile((json, password) => {
      showLoading("Decrypting...");
      App.cancelScrypt = false;

      ethers.Wallet.fromEncryptedJson(json, password, App.updateLoading)
        .then(App.setupWallet)
        .catch(() => {
          App.modal.info("Error", "Invalid keystore or password");
          showAccout();
        });
    });
  },

  updateLoading(p) {
    $("#loading-status").val(Math.floor(p * 100) + '%');
    return App.cancelScrypt;
  },

  exportKeystore() {
    const pwd = $('#save-keystore-file-pwd').val();
    if (!pwd) return App.modal.info("Error", "Password required");

    showLoading("Exporting...");
    App.cancelScrypt = false;

    App.activeWallet.encrypt(pwd, App.updateLoading)
      .then(json => {
        saveAs(new Blob([json]), "keystore.json");
        showWallet();
      });
  }
};

// Initialize the app
App.init();