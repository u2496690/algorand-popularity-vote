import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
import { Buffer } from "buffer";
import { PeraWalletConnect } from "@perawallet/connect";

import "./App.css";

function App() {
  const [currentAccount, setCurrentAccount] = useState<string | null>();
  const [voteState1, setVoteState1] = useState("Vote");
  const [voteState2, setVoteState2] = useState("Vote");
  const [Count1, setCount1] = useState(0);
  const [Count2, setCount2] = useState(0);
  const [walletbalance, setwalletbalance] = useState<number>(0);
  const [connector, setConnector] = useState<WalletConnect>();
  const [connected, setConnected] = useState(false);

  const peraWallet = new PeraWalletConnect({
    // Default chainId is "4160"
    chainId: 416002,
    shouldShowSignTxnToast: true,
  });

  const app_address = 166202264;
  const baseServer = "https://testnet-algorand.api.purestake.io/ps2";
  const port = "";
  const token = {
    "X-API-Key": "QSiMVqlcHn1uMl22I9MXK3bKrPlQLRD64A1Ux9hZ",
  };
  const algodClient = new algosdk.Algodv2(token, baseServer, port);

  const walletConnectStatus = () => {
    return !!currentAccount;
  };

  const handleConnectWalletClick = async () => {
    peraWallet
      .connect()
      .then((newAccounts) => {
        // Setup the disconnect event listener
        peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

        setCurrentAccount(newAccounts[0]);
      })
      .catch((error) => {
        // You MUST handle the reject because once the user closes the modal, peraWallet.connect() promise will be rejected.
        // For the async/await syntax you MUST use try/catch
        if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
          // log the necessary errors
        }
      });
  };

  const handleDisconnectWalletClick = () => {
    peraWallet.disconnect();
    setCurrentAccount(null);
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!connected) {
        console.log("No connection");
        return;
      } else {
        console.log("We have connection", connector);
      }
      if (connector) {
        const { accounts } = connector;
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account);
          // await getAllRecs(); IMPORTANT FOR FUNCTIONALITY LATER
        } else {
          setCurrentAccount(undefined);
          console.log("No authorized account found");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const disconnectWallet = async () => {
    if (connector) connector.killSession();
    console.log("Killing session for wallet with address: ", currentAccount);
    setCurrentAccount(undefined);
    setConnector(undefined);
    setConnected(false);
  };

  const connectWallet = async () => {
    try {
      const bridge = "https://bridge.walletconnect.org";
      const connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });
      setConnector(connector);

      if (!connector.connected) {
        await connector.createSession();
        console.log("Creating new connector session");
      }

      connector.on("connect", (error, payload) => {
        if (error) {
          throw error;
        }
        // Get provided accounts
        const { accounts } = payload.params[0];
        console.log(
          "connector.on connect: Connected an account with address:",
          accounts[0]
        );
        setConnector(connector);
        setConnected(true);
        setCurrentAccount(accounts[0]);
      });

      connector.on("session_update", (error, payload) => {
        if (error) {
          throw error;
        }
        // Get updated accounts
        const { accounts } = payload.params[0];
        setCurrentAccount(accounts[0]);
      });

      connector.on("disconnect", (error, payload) => {
        if (error) {
          throw error;
        }
        setCurrentAccount(undefined);
        setConnected(false);
        setConnector(undefined);
      });

      if (connector.connected) {
        const { accounts } = connector;
        const account = accounts[0];
        setCurrentAccount(account);
        setConnected(true);
      }
    } catch (error) {
      console.log("something didn't work in creating connector", error);
    }
  };

  const addC1 = async () => {
    if (!currentAccount || !connector) {
      console.log("Please connect wallet");
      return;
    }
    let sender = currentAccount;
    let appArgs = [];
    appArgs.push(new Uint8Array(Buffer.from("AddC1")));
    let params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeApplicationNoOpTxn(
      sender,
      params,
      app_address,
      appArgs
    );
    let txId = txn.txID().toString();

    // time to sign . . . which we have to do with walletconnect
    const txns = [txn];
    const txnsToSign = txns.map((txn) => {
      const encodedTxn = Buffer.from(
        algosdk.encodeUnsignedTransaction(txn)
      ).toString("base64");
      return {
        txn: encodedTxn,
      };
    });
    const requestParams = [txnsToSign];
    const request = formatJsonRpcRequest("algo_signTxn", requestParams);

    setVoteState1("Sign txn in wallet");
    const result = await connector.sendCustomRequest(request);
    const decodedResult = result.map((element: any) => {
      return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
    });
    setVoteState1("Processing. . .");
    await algodClient.sendRawTransaction(decodedResult).do();
    await algosdk.waitForConfirmation(algodClient, txId, 2);
    console.log("Adding to Count1");
    let transactionResponse = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    console.log("Called app-id:", transactionResponse["txn"]["txn"]["apid"]);
    if (transactionResponse["global-state-delta"] !== undefined) {
      console.log(
        "Global State updated:",
        transactionResponse["global-state-delta"]
      );
      await getCount();
    }
    setVoteState1("Vote");
  };

  const addC2 = async () => {
    if (!currentAccount || !connector) {
      console.log("Please connect wallet");
      return;
    }

    let sender = currentAccount;
    let appArgs = [];
    appArgs.push(new Uint8Array(Buffer.from("AddC2")));
    let params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeApplicationNoOpTxn(
      sender,
      params,
      app_address,
      appArgs
    );
    let txId = txn.txID().toString();

    // time to sign . . . which we have to do with walletconnect
    const txns = [txn];
    const txnsToSign = txns.map((txn) => {
      const encodedTxn = Buffer.from(
        algosdk.encodeUnsignedTransaction(txn)
      ).toString("base64");
      return {
        txn: encodedTxn,
      };
    });
    const requestParams = [txnsToSign];
    const request = formatJsonRpcRequest("algo_signTxn", requestParams);

    setVoteState2("Sign txn in wallet");
    const result = await connector.sendCustomRequest(request);
    const decodedResult = result.map((element: any) => {
      return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
    });
    // send and await
    setVoteState2("Processing. . .");
    await algodClient.sendRawTransaction(decodedResult).do();
    await algosdk.waitForConfirmation(algodClient, txId, 2);
    let transactionResponse = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    console.log("Called app-id:", transactionResponse["txn"]["txn"]["apid"]);
    if (transactionResponse["global-state-delta"] !== undefined) {
      console.log(
        "Global State updated:",
        transactionResponse["global-state-delta"]
      );
      await getCount();
    }
    setVoteState2("Vote");
  };

  const getBalance = async () => {
    if (!currentAccount) {
      console.log("Please connect wallet");
      return;
    }
    let accountinfo = await algodClient.accountInformation(currentAccount).do();
    console.log(
      "Account Balance in Algo:",
      algosdk.microalgosToAlgos(accountinfo.amount)
    );
    setwalletbalance(algosdk.microalgosToAlgos(accountinfo.amount));
  };

  const getCount = async () => {
    let applicationInfoResponse = await algodClient
      .getApplicationByID(app_address)
      .do();
    let globalState = [];
    globalState = applicationInfoResponse["params"]["global-state"];
    console.log("Count1: ", globalState[0]["value"]["uint"]);
    setCount1(globalState[0]["value"]["uint"]);
    console.log("Count2: ", globalState[1]["value"]["uint"]);
    setCount2(globalState[1]["value"]["uint"]);
  };

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        // Setup the disconnect event listener
        peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

        if (peraWallet.isConnected && accounts.length) {
          setCurrentAccount(accounts[0]);
        }
      })
      .catch((error) => {
        console.log(error);
      });

    checkIfWalletIsConnected();
    getCount();
    setVoteState1("Vote");
    setVoteState2("Vote");
    getBalance();
    console.log("currentAccount:", currentAccount);
  }, [currentAccount]);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">🤪 Yooooo!</div>
        <div className="bio">
          Antony here, I hope you're enjoying the tutorial. I'm trying to settle
          a debate with friends. Vote for the better music genre. Ensure your
          wallet is set to the testnet.
        </div>
        <div className="bio">Rules: Unlimited voting, get to clicking!</div>

        {!currentAccount && (
          <button className="walletButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && (
          <>
            {walletbalance <= 0.01 && (
              <>
                <div className="bio">
                  You don't have enough testalgo in your wallet to vote. Follow
                  the link below to the test Algo faucet, fund your account,
                  then reload this page!
                </div>
                <a
                  href="https://bank.testnet.algorand.network/"
                  target="_blank"
                >
                  <div className="faucetlink">Test Algo Faucet</div>
                </a>
              </>
            )}
            {walletbalance > 0.01 && (
              <>
                <div className="songs-container">
                  <div className="row align-items-center">
                    <div className="col">
                      <div className="song-card">
                        <div className="title">EDM</div>
                        <div className="count">{Count1}</div>
                        <button className="mathButton" onClick={addC1}>
                          {voteState1}
                        </button>
                      </div>
                    </div>
                    <div className="col align-itmes-center">
                      <div className="song-card">
                        <div className="title">Country</div>
                        <div className="count">{Count2}</div>
                        <button className="mathButton" onClick={addC2}>
                          {voteState2}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            <button
              className="disconnectwalletButton"
              onClick={disconnectWallet}
            >
              Disconnect Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
