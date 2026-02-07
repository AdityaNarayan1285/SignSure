App = {
  provider: null,
  activeWallet: null,
  cancelScrypt: false,
  sending: false,

  /* ======================
        SETUP WALLET
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
    try {
      const balance = await App.provider.getBalance(App.activeWallet.address);
      $('#wallet-balance').val(ethers.utils.formatEther(balance));

      const nonce = await App.provider.getTransactionCount(
        App.activeWallet.address,
        "pending"
      );
      $('#wallet-transaction-count').val(nonce);
    } catch (e) {
      console.error(e);
    }
  },

  /* ======================
        FIREWALL ANALYSIS
     ====================== */

  analyzeTransaction(tx) {
    const risk = {
      level: "SAFE",
      title: "Low risk transaction",
      reasons: [],
      explanation: []
    };

    // ETH transfer
    if (!tx.data || tx.data === "0x") {
      if (tx.value.gt(ethers.utils.parseEther("0.5"))) {
        risk.level = "WARNING";
        risk.title = "Large ETH transfer";
        risk.reasons.push("High value transfer");
        risk.explanation.push(
          "You are sending a large amount of ETH. Double-check the recipient address."
        );
      } else {
        risk.explanation.push(
          "Standard ETH transfer with no contract interaction."
        );
      }
      return risk;
    }

    // Contract interaction
    risk.level = "WARNING";
    risk.title = "Smart contract interaction";
    risk.explanation.push(
      "This transaction interacts with a smart contract."
    );

    const selector = tx.data.slice(0, 10);

    if (selector === "0xa9059cbb") {
      risk.reasons.push("ERC-20 token transfer");
      risk.explanation.push(
        "You are transferring tokens via a smart contract."
      );
    }

    if (selector === "0x095ea7b3") {
      risk.level = "DANGER";
      risk.title = "Token approval detected";
      risk.reasons.push("Approval function call");
      risk.explanation.push(
        "This transaction allows another address to spend your tokens."
      );
      risk.explanation.push(
        "Unlimited approvals can drain your wallet."
      );
    }

    return risk;
  },

  /* ======================
        FIREWALL CONFIRM UI
     ====================== */

  async firewallConfirm(risk, tx) {
    let msg = `🔥 TRANSACTION FIREWALL 🔥\n\n`;

    msg += `Risk Level: ${risk.level}\n`;
    msg += `${risk.title}\n\n`;

    msg += `Transaction Details:\n`;
    msg += `To: ${tx.to}\n`;
    msg += `Amount: ${ethers.utils.formatEther(tx.value)} ETH\n`;
    msg += `Gas Price: ${ethers.utils.formatUnits(tx.gasPrice, "gwei")} gwei\n`;
    msg += `Nonce: ${tx.nonce}\n\n`;

    if (risk.explanation.length) {
      msg += `What this means:\n`;
      risk.explanation.forEach(e => msg += `• ${e}\n`);
      msg += `\n`;
    }

    if (risk.level === "DANGER") {
      msg += `⚠️ HIGH RISK ACTION ⚠️\n`;
      msg += `Type CONFIRM to continue:\n`;

      const input = prompt(msg);
      return input === "CONFIRM";
    }

    return confirm(msg + "Proceed?");
  },

  /* ======================
        SEND ETH
     ====================== */

  setupSendEther() {
    $('#wallet-submit-send').off().on('click', async () => {
      if (App.sending) return;
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
        gasPrice = gasPrice.mul(12).div(10); // +20%

        const tx = {
          to,
          value,
          nonce,
          gasLimit: 21000,
          gasPrice
        };

        const risk = App.analyzeTransaction(tx);
        const allowed = await App.firewallConfirm(risk, tx);
        if (!allowed) {
          App.sending = false;
          return;
        }

        const sentTx = await App.activeWallet.sendTransaction(tx);

        alert(
          `📤 Transaction submitted\n\nHash:\n${sentTx.hash}\n\nWaiting for confirmation…`
        );

        const receipt = await sentTx.wait();

        alert(
          `✅ Transaction confirmed\n\nBlock: ${receipt.blockNumber}\nGas Used: ${receipt.gasUsed.toString()}\n\nExplorer:\nhttps://sepolia.etherscan.io/tx/${sentTx.hash}`
        );

        App.refreshUI();

      } catch (err) {
        App.showTxError(err);
      } finally {
        App.sending = false;
      }
    });
  },

  /* ======================
        ERROR HANDLER
     ====================== */

  showTxError(err) {
    console.error(err);

    if (err.message.includes("replacement fee too low")) {
      alert(
`❌ Pending transaction exists

Reason:
A previous transaction with the same nonce is still pending.

Fix:
Wait for it to confirm or increase gas.`
      );
      return;
    }

    if (err.message.includes("nonce")) {
      alert(
`❌ Nonce mismatch

Reason:
You already sent a transaction that is not mined yet.

Fix:
Wait a few seconds and retry.`
      );
      return;
    }

    if (err.message.includes("insufficient funds")) {
      alert(
`❌ Insufficient ETH

You need ETH for:
• Transaction value
• Gas fees`
      );
      return;
    }

    alert(`❌ Transaction failed\n\n${err.message}`);
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
      } catch {
        alert("Invalid private key");
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
      } catch {
        alert("Invalid mnemonic");
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
          alert("Wrong password or invalid keystore");
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
    if (!pwd) return alert("Password required");

    showLoading("Exporting...");
    App.cancelScrypt = false;

    App.activeWallet.encrypt(pwd, App.updateLoading)
      .then(json => {
        saveAs(new Blob([json]), "keystore.json");
        showWallet();
      });
  }
};

App.init();
