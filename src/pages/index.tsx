import React, { useState, useEffect } from "react";

declare global {
  interface Window {
    ethereum: any;
  }
}
import {
  PaymasterMode,
  createSmartAccountClient,
  createSession,
  Policy,
  createSessionKeyEOA,
  BiconomySmartAccountV2,
  createSessionSmartAccountClient,
  getSingleSessionTxParams,
  createBundler,
} from "@biconomy/account";
import { ethers } from "ethers";
import { encodeFunctionData } from "viem";
import { polygonAmoy, sepolia, scrollSepolia } from "viem/chains";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PulaABI from "../contract/Pula.json";
import dotenv from "dotenv";

dotenv.config();

const withSponsorship = {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
};

export default function Home() {
  const [smartAccount, setSmartAccount] =
    useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );
  const [chainSelected, setChainSelected] = useState<number>(0);
  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");

  const chains = [
    {
      chainNo: 0,
      chainId: 11155111,
      name: "Ethereum Sepolia",
      providerUrl:
        "https://eth-sepolia.g.alchemy.com/v2/DsjHmw3Itl1eZnIdzuTT3OCdq-Pv293g",
      PulaAddress: "0xE3Bc06f1A17E59519B3F6CA5a95D2C5124A6D8fC",
      biconomyPaymasterApiKey: "bR6yJGLlA.ca82090d-ccd2-4ca3-8fe9-65b119f42570",
      explorerUrl: "https://sepolia.etherscan.io/tx/",
      chain: sepolia,
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/11155111/bR6yJGLlA.ca82090d-ccd2-4ca3-8fe9-65b119f42570",
      paymasterUrl:
        "https://paymaster.biconomy.io/api/v1/11155111/bR6yJGLlA.ca82090d-ccd2-4ca3-8fe9-65b119f42570",
    },
    {
      chainNo: 1,
      chainId: 80002,
      name: "Polygon Amoy",
      providerUrl: "https://rpc-amoy.polygon.technology/",
      PulaAddress: "0xfeec89eC2afD503FF359487967D02285f7DaA9aD",
      biconomyPaymasterApiKey: "TVDdBH-yz.5040805f-d795-4078-9fd1-b668b8817642",
      explorerUrl: "https://www.oklink.com/amoy/tx/",
      chain: polygonAmoy,
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/80002/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
      paymasterUrl:
        "https://paymaster.biconomy.io/api/v1/80002/TVDdBH-yz.5040805f-d795-4078-9fd1-b668b8817642",
    },
    {
      chainNo: 2,
      chainId: 534353,
      name: "Scroll Sepolia",
      providerUrl: process.env.ALCHEMY_SCROLL_URL,
      PulaAddress: "0x7c0E4d8cAb5A6C0d24Bc79980779fEF3FDAD4474",
      biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_KEY_SCROLL,
      explorerUrl: "https://sepolia.scroll.io/tx/",
      chain: scrollSepolia,
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/534353/" +
        process.env.BICONOMY_PAYMASTER_KEY_SCROLL,
      paymasterUrl:
        "https://paymaster.biconomy.io/api/v1/534353/" +
        process.env.BICONOMY_PAYMASTER_KEY_SCROLL,
    },
  ];

  console.log(chains);

  const createSessionWithSponsorship = async () => {
    const toastId = toast("Creating Session", { autoClose: false });

    if (!smartAccount) {
      toast.update(toastId, {
        render: "Smart Account not initialized",
        type: "error",
        autoClose: 5000,
      });
      return;
    }

    try {
      const { sessionKeyAddress, sessionStorageClient } =
        await createSessionKeyEOA(smartAccount, chains[chainSelected].chain);

      const policy: Policy[] = [
        {
          sessionKeyAddress,
          contractAddress: chains[chainSelected].PulaAddress as `0x${string}`,
          functionSelector: "transfer(address,uint256)",
          rules: [],
          interval: {
            validUntil: 0,
            validAfter: 10,
          },
          valueLimit: BigInt(100000000000),
        },
      ];

      const { wait, session } = await createSession(
        smartAccount,
        policy,
        sessionStorageClient,
        withSponsorship
      );

      const {
        receipt: { transactionHash },
        success,
      } = await wait();

      console.log(success, transactionHash);

      toast.update(toastId, {
        render: "Session Creation Successful",
        type: "success",
        autoClose: 5000,
      });
    } catch (error) {
      console.error("Error creating session with sponsorship:", error);
      toast.update(toastId, {
        render: "Session Creation Failed",
        type: "error",
        autoClose: 5000,
      });
    }
  };

  const sendStablecoins = async () => {
    const toastId = toast("Sending Stablecoins", { autoClose: false });

    try {
      const emulatedUsersSmartAccount = await createSessionSmartAccountClient(
        {
          accountAddress: smartAccountAddress as `0x${string}`,
          bundlerUrl: chains[chainSelected].bundlerUrl,
          paymasterUrl: chains[chainSelected].paymasterUrl,
          chainId: chains[chainSelected].chainId,
        },
        smartAccountAddress as `0x${string}`
      );

      const stablecoinContractAddress = chains[chainSelected].PulaAddress;

      const minTx = {
        to: stablecoinContractAddress,
        data: encodeFunctionData({
          abi: PulaABI.abi,
          functionName: "transfer",
          args: [recipientAddress, ethers.utils.parseUnits(amount, 18)],
        }),
      };

      console.log("Estimating gas for transaction:", minTx);

      const params = await getSingleSessionTxParams(
        smartAccountAddress as `0x${string}`,
        chains[chainSelected].chain,
        0
      );

      const { wait } = await emulatedUsersSmartAccount.sendTransaction(minTx, {
        ...params,
        ...withSponsorship,
      });

      const {
        receipt: { transactionHash },
        success,
      } = await wait();

      setTxnHash(transactionHash);

      toast.update(toastId, {
        render: success ? "Transfer Successful" : "Transfer Failed",
        type: success ? "success" : "error",
        autoClose: 5000,
      });

      // Fetch the updated balance after the transaction
      fetchBalance();
    } catch (error) {
      console.error("Error sending stablecoins:", error);
      toast.update(toastId, {
        render: "Transfer Failed",
        type: "error",
        autoClose: 5000,
      });
    }
  };

  const mintTokens = async () => {
    const toastId = toast("Minting Tokens", { autoClose: false });

    try {
      if (!smartAccountAddress) {
        toast.update(toastId, {
          render: "Smart Account not initialized",
          type: "error",
          autoClose: 5000,
        });
        return;
      }

      const emulatedUsersSmartAccount = await createSessionSmartAccountClient(
        {
          accountAddress: smartAccountAddress as `0x${string}`,
          bundlerUrl: chains[chainSelected].bundlerUrl,
          paymasterUrl: chains[chainSelected].paymasterUrl,
          chainId: chains[chainSelected].chainId,
        },
        smartAccountAddress as `0x${string}`
      );

      const stablecoinContractAddress = chains[chainSelected].PulaAddress;

      const minTx = {
        to: stablecoinContractAddress,
        data: encodeFunctionData({
          abi: PulaABI.abi,
          functionName: "mint",
          args: [smartAccountAddress, ethers.utils.parseUnits("50", 18)],
        }),
      };

      const params = await getSingleSessionTxParams(
        smartAccountAddress as `0x${string}`,
        chains[chainSelected].chain,
        0
      );

      const { wait } = await emulatedUsersSmartAccount.sendTransaction(minTx, {
        ...params,
        ...withSponsorship,
      });

      const {
        receipt: { transactionHash },
        success,
      } = await wait();

      setTxnHash(transactionHash);

      toast.update(toastId, {
        render: success ? "Minting Successful" : "Minting Failed",
        type: success ? "success" : "error",
        autoClose: 5000,
      });

      // Fetch the updated balance after minting
      fetchBalance();
    } catch (error) {
      console.error("Error minting tokens:", error);
      toast.update(toastId, {
        render: "Minting Failed",
        type: "error",
        autoClose: 5000,
      });
    }
  };

  const fetchBalance = async () => {
    if (!smartAccountAddress) return;

    const provider = new ethers.providers.JsonRpcProvider(
      chains[chainSelected].providerUrl
    );
    const contract = new ethers.Contract(
      chains[chainSelected].PulaAddress,
      PulaABI.abi,
      provider
    );

    const balance = await contract.balanceOf(smartAccountAddress);
    setBalance(ethers.utils.formatUnits(balance, 18));
  };

  const connect = async () => {
    try {
      let provider;
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
      } else {
        provider = new ethers.providers.JsonRpcProvider(
          process.env.ALCHEMY_SEPOLIA_URL
        );
      }
      const signer = provider.getSigner();

      const config = {
        biconomyPaymasterApiKey: chains[chainSelected].biconomyPaymasterApiKey,
        bundlerUrl: chains[chainSelected].bundlerUrl,
      };

      const bundler = await createBundler({
        bundlerUrl: config.bundlerUrl,
        userOpReceiptMaxDurationIntervals: {
          [chains[chainSelected].chainId]: 120000,
        },
        userOpReceiptIntervals: {
          [chains[chainSelected].chainId]: 3000,
        },
      });

      const smartWallet = await createSmartAccountClient({
        signer: signer,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundler: bundler,
        rpcUrl: chains[chainSelected].providerUrl,
        chainId: chains[chainSelected].chainId,
      });

      setSmartAccount(smartWallet);
      setSmartAccountAddress(await smartWallet.getAddress());

      // Fetch the balance after connecting
      fetchBalance();
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (smartAccountAddress) {
      fetchBalance();
    }
  }, [smartAccountAddress, chainSelected]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start gap-8 p-24">
      <div className="text-[4rem] font-bold text-sky-400">PayPula</div>

      {!smartAccount && (
        <>
          <div className="flex flex-row justify-center items-center gap-4">
            {chains.map((chain) => {
              return (
                <div
                  key={chain.chainNo}
                  className={`w-[10rem] h-[3rem] cursor-pointer rounded-lg flex flex-row justify-center items-center text-sky-400 ${
                    chainSelected == chain.chainNo ? "bg-white" : "bg-black"
                  } border-2 border-solid border-sky-400`}
                  onClick={() => {
                    setChainSelected(chain.chainNo);
                  }}
                >
                  {chain.name}
                </div>
              );
            })}
          </div>
          <button
            className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
            onClick={connect}
          >
            EOA Sign in
          </button>
        </>
      )}

      {smartAccount && (
        <>
          <span>Smart Account Address</span>
          <span>{smartAccountAddress}</span>
          <span>Network: {chains[chainSelected].name}</span>
          <span>Balance: {balance} PUL</span>
          <div className="flex flex-row justify-center items-start gap-4">
            <button
              className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
              onClick={createSessionWithSponsorship}
            >
              Create Session
            </button>
            <button
              className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
              onClick={mintTokens}
            >
              Mint Tokens
            </button>
          </div>
          <div className="flex flex-col justify-center items-center gap-4">
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-[20rem] h-[3rem] p-2 border-2 border-solid border-sky-400 rounded-lg text-black"
            />
            <input
              type="text"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-[20rem] h-[3rem] p-2 border-2 border-solid border-sky-400 rounded-lg text-black"
            />
            <button
              className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
              onClick={sendStablecoins}
            >
              Send Stablecoins
            </button>
            <span>
              {txnHash && (
                <a
                  target="_blank"
                  href={`${chains[chainSelected].explorerUrl + txnHash}`}
                >
                  <span className="text-sky-400 font-bold underline">
                    Txn Hash
                  </span>
                </a>
              )}
            </span>
          </div>
        </>
      )}
    </main>
  );
}
