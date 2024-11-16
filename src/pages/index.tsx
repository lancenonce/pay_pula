import React, { useState } from "react";
import {
  PaymasterMode,
  createSmartAccountClient,
  createSession,
  Rule,
  Policy,
  createSessionKeyEOA,
  BiconomySmartAccountV2,
  createSessionSmartAccountClient,
  getSingleSessionTxParams,
  createBundler,
} from "@biconomy/account";
import { contractABI } from "../contract/contractABI";
import { ethers } from "ethers";
import { encodeFunctionData } from "viem";
import { polygonAmoy, sepolia } from "viem/chains";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [smartAccount, setSmartAccount] =
    useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );
  const [chainSelected, setChainSelected] = useState<number>(0);
  const [count, setCount] = useState<string | null>(null);
  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const chains = [
    {
      chainNo: 0,
      chainId: 11155111,
      name: "Ethereum Sepolia",
      providerUrl: "https://eth-sepolia.public.blastapi.io",
      incrementCountContractAdd: "0xd9ea570eF1378D7B52887cE0342721E164062f5f",
      biconomyPaymasterApiKey: "gJdVIBMSe.f6cc87ea-e351-449d-9736-c04c6fab56a2",
      explorerUrl: "https://sepolia.etherscan.io/tx/",
      chain: sepolia,
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
      paymasterUrl:
        "https://paymaster.biconomy.io/api/v1/11155111/gJdVIBMSe.f6cc87ea-e351-449d-9736-c04c6fab56a2",
    },
    {
      chainNo: 1,
      chainId: 80002,
      name: "Polygon Amoy",
      providerUrl: "https://rpc-amoy.polygon.technology/",
      incrementCountContractAdd: "0xfeec89eC2afD503FF359487967D02285f7DaA9aD",
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
      providerUrl: "https://sepolia-rpc.scroll.io",
      incrementCountContractAdd: "0xYourContractAddressHere",
      biconomyPaymasterApiKey: "YourBiconomyPaymasterApiKeyHere",
      explorerUrl: "https://sepolia.scroll.io/tx/",
      chain: "scrollSepolia", // Replace with actual chain object if available
      bundlerUrl: "https://bundler.biconomy.io/api/v2/534353/YourBundlerApiKeyHere",
      paymasterUrl: "https://paymaster.biconomy.io/api/v1/534353/YourPaymasterApiKeyHere",
    },
  ];

  const withSponsorship = {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED },
  };

  const createSessionWithSponsorship = async () => {
    const toastId = toast("Creating Session", { autoClose: false });

    const { sessionKeyAddress, sessionStorageClient } =
      await createSessionKeyEOA(
        //@ts-ignore
        smartAccount,
        chains[chainSelected].chain
      );

    const policy: Policy[] = [
      {
        sessionKeyAddress,
        //@ts-ignore
        contractAddress: chains[chainSelected].incrementCountContractAdd,
        functionSelector: "increment()",
        rules: [],
        interval: {
          validUntil: 0,
          validAfter: 0,
        },
        valueLimit: BigInt(0),
      },
    ];

    const { wait, session } = await createSession(
      //@ts-ignore
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
  };

  const incrementCount = async () => {
    const toastId = toast("Incrementing Count", { autoClose: false });

    const emulatedUsersSmartAccount = await createSessionSmartAccountClient(
      {
        //@ts-ignore
        accountAddress: smartAccountAddress,
        bundlerUrl: chains[chainSelected].bundlerUrl,
        paymasterUrl: chains[chainSelected].paymasterUrl,
        chainId: chains[chainSelected].chainId,
      },
      smartAccountAddress
    );

    const minTx = {
      to: chains[chainSelected].incrementCountContractAdd,
      data: encodeFunctionData({
        abi: contractABI,
        functionName: "increment",
        args: [],
      }),
    };

    const params = await getSingleSessionTxParams(
      // @ts-ignore
      smartAccountAddress,
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
      render: "Session Creation Successful",
      type: "success",
      autoClose: 5000,
    });
  };

  const getCountId = async () => {
    const toastId = toast("Getting Count", { autoClose: false });
    const contractAddress = chains[chainSelected].incrementCountContractAdd;
    const provider = new ethers.providers.JsonRpcProvider(
      chains[chainSelected].providerUrl
    );
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );
    const countId = await contractInstance.getCount();
    setCount(countId.toString());
    toast.update(toastId, {
      render: "Successful",
      type: "success",
      autoClose: 5000,
    });
  };

  const sendStablecoins = async () => {
    const toastId = toast("Sending Stablecoins", { autoClose: false });

    const emulatedUsersSmartAccount = await createSessionSmartAccountClient(
      {
        //@ts-ignore
        accountAddress: smartAccountAddress,
        bundlerUrl: chains[chainSelected].bundlerUrl,
        paymasterUrl: chains[chainSelected].paymasterUrl,
        chainId: chains[chainSelected].chainId,
      },
      smartAccountAddress
    );

    const stablecoinContractAddress = "0xYourStablecoinContractAddress"; // Replace with actual stablecoin contract address
    const stablecoinABI = [
      // Replace with actual stablecoin ABI
      "function transfer(address to, uint256 amount) public returns (bool)",
    ];

    const minTx = {
      to: stablecoinContractAddress,
      data: encodeFunctionData({
        abi: stablecoinABI,
        functionName: "transfer",
        args: [recipientAddress, ethers.utils.parseUnits(amount, 18)],
      }),
    };

    const params = await getSingleSessionTxParams(
      // @ts-ignore
      smartAccountAddress,
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
  };

  const connect = async () => {
    const ethereum = (window as any).ethereum;
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      await provider.send("eth_requestAccounts", []);
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
      const saAddress = await smartWallet.getAddress();
      setSmartAccountAddress(saAddress);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start gap-8 p-24">
      <div className="text-[4rem] font-bold text-sky-400">
        PayPula
      </div>

      {!smartAccount && (
        <>
          <div className="flex flex-row justify-center items-center gap-4">
            {chains.map((chain) => {
              return (
                <div
                  key={chain.chainNo}
                  className={`w-[10rem] h-[3rem] cursor-pointer rounded-lg flex flex-row justify-center items-center text-sky-400 ${
                    chainSelected == chain.chainNo
                      ? "bg-white"
                      : "bg-black"
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
          <div className="flex flex-row justify-center items-start gap-4">
            <button
              className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
              onClick={createSessionWithSponsorship}
            >
              Create Session
            </button>
            <div className="flex flex-col justify-start items-center gap-2">
              <button
                className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
                onClick={incrementCount}
              >
                Increment Count
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
          </div>
          <div className="flex flex-row justify-center items-center gap-4">
            <button
              className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
              onClick={getCountId}
            >
              Get Count Value
            </button>
            <span>{count}</span>
          </div>
          <div className="flex flex-col justify-center items-center gap-4">
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-[20rem] h-[3rem] p-2 border-2 border-solid border-sky-400 rounded-lg"
            />
            <input
              type="text"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-[20rem] h-[3rem] p-2 border-2 border-solid border-sky-400 rounded-lg"
            />
            <button
              className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
              onClick={sendStablecoins}
            >
              Send Stablecoins
            </button>
          </div>
        </>
      )}
    </main>
  );
}