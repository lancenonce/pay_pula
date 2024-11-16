import React, { useState, useEffect } from "react";
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
import FactoryAbi from "../contract/Factory.json";



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
        process.env.ALCHEMY_SEPOLIA_URL,
      PulaAddress: "0xE3Bc06f1A17E59519B3F6CA5a95D2C5124A6D8fC",
      biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_KEY_SEPOLIA,
      explorerUrl: "https://sepolia.etherscan.io/tx/",
      chain: sepolia,
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/11155111/" + process.env.BICONOMY_PAYMASTER_KEY_SEPOLIA,
      paymasterUrl:
        "https://paymaster.biconomy.io/api/v1/11155111/" + process.env.BICONOMY_PAYMASTER_KEY_SEPOLIA,
    },
    {
      chainNo: 1,
      chainId: 80002,
      name: "Polygon Amoy",
      providerUrl: "https://rpc-amoy.polygon.technology/",
      PulaAddress: "0xfeec89eC2afD503FF359487967D02285f7DaA9aD",
      biconomyPaymasterApiKey: "",
      explorerUrl: "https://www.oklink.com/amoy/tx/",
      chain: polygonAmoy,
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/80002/",
      paymasterUrl:
        "https://paymaster.biconomy.io/api/v1/80002/",
    },
    {
      chainNo: 2,
      chainId: 534353,
      name: "Scroll Sepolia",
      providerUrl: process.env.ALCHEMY_SCROLL_URL,
      PulaAddress: "0xYourContractAddressHere",
      biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_KEY_SCROLL,
      explorerUrl: "https://sepolia.scroll.io/tx/",
      chain: scrollSepolia,
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/" + process.env.BICONOMY_PAYMASTER_KEY_SCROLL,
      paymasterUrl:
        "https://paymaster.biconomy.io/api/v1/" + process.env.BICONOMY_PAYMASTER_KEY_SCROLL,
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
        contractAddress: chains[chainSelected].PulaAddress,
        functionSelector: "transfer(address,uint256)",
        rules: [],
        interval: {
          validUntil: 0,
          validAfter: 1000,
        },
        valueLimit: BigInt(100000000000),
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

    const stablecoinContractAddress = chains[chainSelected].PulaAddress; // Use the actual stablecoin contract address

    const minTx = {
      to: stablecoinContractAddress,
      data: encodeFunctionData({
        abi: PulaABI.abi,
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

    // Fetch the updated balance after the transaction
    fetchBalance();
  };

  const mintTokens = async (address: string) => {
    const toastId = toast("Minting Tokens", { autoClose: false });

    const emulatedUsersSmartAccount = await createSessionSmartAccountClient(
      {
        //@ts-ignore
        accountAddress: address,
        bundlerUrl: chains[chainSelected].bundlerUrl,
        paymasterUrl: chains[chainSelected].paymasterUrl,
        chainId: chains[chainSelected].chainId,
      },
      address
    );

    const stablecoinContractAddress = chains[chainSelected].PulaAddress; // Use the actual stablecoin contract address

    const minTx = {
      to: stablecoinContractAddress,
      data: encodeFunctionData({
        abi: PulaABI.abi,
        functionName: "mint",
        args: [address, ethers.utils.parseUnits("50", 18)],
      }),
    };

    const params = await getSingleSessionTxParams(
      // @ts-ignore
      address,
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

  const factoryAddress = "0x137DAB9C2e03402CDaC6e6Af89a0b78d4BCAb956";

  const createSmartAccount = async (signer: ethers.Signer) => {
    const factory = new ethers.Contract(factoryAddress, FactoryAbi.abi, signer);
    const tx = await factory.createSmartAccount(await signer.getAddress());
    const receipt = await tx.wait();
    const event = receipt.events.find(
      (event: any) => event.event === "SmartAccountCreated"
    );
    return event.args.account;
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

      const smartAccountAddress = await createSmartAccount(signer);
      setSmartAccountAddress(smartAccountAddress);

      const smartWallet = await createSmartAccountClient({
        signer: signer,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundler: bundler,
        rpcUrl: chains[chainSelected].providerUrl,
        chainId: chains[chainSelected].chainId,
      });

      setSmartAccount(smartWallet);

      // Mint 50 tokens to the new smart account
      await mintTokens(smartAccountAddress);

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