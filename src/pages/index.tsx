import React, { useState, useEffect, MouseEventHandler } from "react";
import { useAccount, useBalance, UseBalanceReturnType, useConnect, useGasPrice, useWalletClient } from 'wagmi';
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
import { 
  createBicoPaymasterClient, 
  createNexusClient, 
  createNexusSessionClient, 
  toSmartSessionsValidator,
  NexusClient,
  smartSessionCreateActions,
  smartSessionUseActions,
  UnknownSigner
} from "@biconomy/sdk";
import { ethers } from "ethers";
import { encodeFunctionData, http, Hex, toHex } from "viem";
import { polygonAmoy, sepolia, scrollSepolia } from "viem/chains";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PulaABI from "../contract/Pula.json";
import { 
  SMART_SESSION_VALIDATOR, 
  validationModules,
  K1_VALIDATOR,
  MOCK_EXCHANGE 
} from "../utils/constants/addresses";
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from "dotenv";

dotenv.config();

// Function selectors as Hex type
const MINT_SELECTOR = "0x40c10f19" as const;
const TRANSFER_SELECTOR = "0xa9059cbb" as const;

export default function Home() {
  const account = useAccount();
  const { data: walletClient } = useWalletClient();
  const gasPrice = useGasPrice();

  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [nexusClient, setNexusClient] = useState<NexusClient | null>(null);
  const [chainSelected, setChainSelected] = useState<number>(0);
  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasPaymaster, setHasPaymaster] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [installedValidators, setInstalledValidators] = useState<{ name: string; isActive: boolean; address: string }[]>([]);
  const [permissionId, setPermissionId] = useState<Hex | null>(null);

  const chains = [
    {
      chainNo: 0,
      chainId: 11155111,
      name: "Ethereum Sepolia",
      providerUrl: "https://eth-sepolia.g.alchemy.com/v2/DsjHmw3Itl1eZnIdzuTT3OCdq-Pv293g",
      PulaAddress: "0xE3Bc06f1A17E59519B3F6CA5a95D2C5124A6D8fC" as Hex,
      biconomyPaymasterApiKey: "bR6yJGLlA.ca82090d-ccd2-4ca3-8fe9-65b119f42570",
      explorerUrl: "https://sepolia.etherscan.io/tx/",
      chain: sepolia,
      bundlerUrl: "https://bundler.biconomy.io/api/v2/11155111/bR6yJGLlA.ca82090d-ccd2-4ca3-8fe9-65b119f42570",
      paymasterUrl: "https://paymaster.biconomy.io/api/v1/11155111/bR6yJGLlA.ca82090d-ccd2-4ca3-8fe9-65b119f42570",
    }
  ];

  useEffect(() => {
    if (!permissionId) {
      setPermissionId(localStorage.getItem('permissionId') as Hex);
    }
  }, [account]);

  useEffect(() => {
    const initNexusClient = async () => {
      if (!walletClient) return;

      try {
        const hasPaymaster = !!chains[chainSelected].paymasterUrl;
        setHasPaymaster(hasPaymaster);

        // Create a signer that matches UnknownSigner type
        const signer: UnknownSigner = {
          signMessage: walletClient.signMessage,
          signTypedData: walletClient.signTypedData,
          getAddress: async () => walletClient.account.address as Hex,
          signTransaction: async (tx: any) => {
            return await walletClient.signTransaction(tx);
          },
          provider: walletClient.transport,
        };

        const nexusClient = await createNexusClient({
          signer,
          chain: chains[chainSelected].chain,
          index: BigInt(8),
          transport: http(chains[chainSelected].providerUrl),
          bundlerTransport: http(chains[chainSelected].bundlerUrl),
          paymaster: hasPaymaster ? createBicoPaymasterClient({
            paymasterUrl: chains[chainSelected].paymasterUrl
          }) : undefined
        });

        setNexusClient(nexusClient);
        const isDeployed = await nexusClient.account.isDeployed();
        setIsDeployed(isDeployed);
        setSmartAccountAddress(await nexusClient.account.address);
      } catch (error) {
        console.error("Error initializing Nexus client:", error);
      }
    };

    if (account.status === 'connected') {
      initNexusClient();
    }
  }, [account, walletClient, chainSelected]);

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

  const installValidator: MouseEventHandler<HTMLButtonElement> = async () => {
    setIsLoading(true);
    try {
      if (!nexusClient) return;
      
      const userOpHash = await nexusClient.installModule({
        module: {
          address: SMART_SESSION_VALIDATOR,
          initData: "0x" as Hex,
          deInitData: "0x" as Hex,
          type: "validator"
        }
      });

      const receipt = await nexusClient.waitForTransactionReceipt({ hash: userOpHash });
      console.log("Validator installed:", receipt);
    } catch (error) {
      console.error("Error installing validator:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession: MouseEventHandler<HTMLButtonElement> = async () => {
    setIsLoading(true);
    try {
      if (!nexusClient) return;

      const sessionAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_AI_AGENT_PV_KEY as Hex);
      const smartSessionValidator = toSmartSessionsValidator({
        account: nexusClient.account,
        signer: sessionAccount,
      });

      const nexusSessionClient = nexusClient.extend(
        smartSessionCreateActions(smartSessionValidator)
      );

      const createSessionsResponse = await nexusSessionClient.grantPermission({
        account: nexusClient.account,
        sessionRequestedInfo: [{
          sessionPublicKey: sessionAccount.address,
          actionPoliciesInfo: [{
            contractAddress: chains[chainSelected].PulaAddress,
            functionSelector: MINT_SELECTOR
          }, {
            contractAddress: chains[chainSelected].PulaAddress,
            functionSelector: TRANSFER_SELECTOR
          }]
        }]
      });

      const permissionId = createSessionsResponse.permissionIds[0];
      const receipt = await nexusClient.waitForTransactionReceipt({ 
        hash: createSessionsResponse.userOpHash 
      });

      setPermissionId(permissionId);
      localStorage.setItem('permissionId', permissionId);

      console.log("Session created:", receipt);
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const mintTokens: MouseEventHandler<HTMLButtonElement> = async () => {
    const toastId = toast("Minting Tokens", { autoClose: false });

    try {
      if (!nexusClient || !smartAccountAddress) {
        toast.update(toastId, {
          render: "Nexus Client not initialized",
          type: "error",
          autoClose: 5000,
        });
        return;
      }

      const mintData = encodeFunctionData({
        abi: PulaABI.abi,
        functionName: "mint",
        args: [smartAccountAddress, ethers.utils.parseUnits("50", 18)],
      }) as Hex;

      // If we have a permission ID, use session validation
      if (permissionId) {
        const sessionAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_AI_AGENT_PV_KEY as Hex);
        const smartSessionValidator = toSmartSessionsValidator({
          account: nexusClient.account,
          signer: sessionAccount,
          moduleData: {
            permissionId: permissionId,
          }
        });

        const nexusSessionClient = await createNexusSessionClient({
          chain: chains[chainSelected].chain,
          index: BigInt(8),
          paymaster: hasPaymaster ? createBicoPaymasterClient({
            paymasterUrl: chains[chainSelected].paymasterUrl
          }) : undefined,
          accountAddress: nexusClient.account.address as Hex,
          signer: sessionAccount,
          transport: http(chains[chainSelected].providerUrl),
          bundlerTransport: http(chains[chainSelected].bundlerUrl),
          module: smartSessionValidator
        });

        const useSmartSessionNexusClient = nexusSessionClient.extend(
          smartSessionUseActions(smartSessionValidator)
        );

        const userOpHash = await useSmartSessionNexusClient.usePermission({
          actions: [{
            target: chains[chainSelected].PulaAddress,
            value: BigInt(0),
            callData: mintData
          }]
        });

        const receipt = await nexusSessionClient.waitForTransactionReceipt({ hash: userOpHash });
        setTxnHash(receipt.transactionHash);
      } else {
        // Regular transaction without session
        const userOpHash = await nexusClient.sendTransaction({
          calls: [{
            to: chains[chainSelected].PulaAddress,
            data: mintData,
            value: BigInt(0)
          }]
        });

        const receipt = await nexusClient.waitForTransactionReceipt({ hash: userOpHash });
        setTxnHash(receipt.transactionHash);
      }

      toast.update(toastId, {
        render: "Minting Successful",
        type: "success",
        autoClose: 5000,
      });

      fetchBalance();
    } catch (error) {
      console.error("Error minting tokens:", error);
      toast.update(toastId, {
        render: "Minting Failed: " + (error as Error).message,
        type: "error",
        autoClose: 5000,
      });
    }
  };

  const sendStablecoins: MouseEventHandler<HTMLButtonElement> = async () => {
    const toastId = toast("Sending Stablecoins", { autoClose: false });

    try {
      if (!nexusClient || !smartAccountAddress) {
        toast.update(toastId, {
          render: "Nexus Client not initialized",
          type: "error",
          autoClose: 5000,
        });
        return;
      }

      const transferData = encodeFunctionData({
        abi: PulaABI.abi,
        functionName: "transfer",
        args: [recipientAddress, ethers.utils.parseUnits(amount, 18)],
      }) as Hex;

      // If we have a permission ID, use session validation
      if (permissionId) {
        const sessionAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_AI_AGENT_PV_KEY as Hex);
        const smartSessionValidator = toSmartSessionsValidator({
          account: nexusClient.account,
          signer: sessionAccount,
          moduleData: {
            permissionId: permissionId,
          }
        });

        const nexusSessionClient = await createNexusSessionClient({
          chain: chains[chainSelected].chain,
          index: BigInt(8),
          paymaster: hasPaymaster ? createBicoPaymasterClient({
            paymasterUrl: chains[chainSelected].paymasterUrl
          }) : undefined,
          accountAddress: nexusClient.account.address as Hex,
          signer: sessionAccount,
          transport: http(chains[chainSelected].providerUrl),
          bundlerTransport: http(chains[chainSelected].bundlerUrl),
          module: smartSessionValidator
        });

        const useSmartSessionNexusClient = nexusSessionClient.extend(
          smartSessionUseActions(smartSessionValidator)
        );

        const userOpHash = await useSmartSessionNexusClient.usePermission({
          actions: [{
            target: chains[chainSelected].PulaAddress,
            value: BigInt(0),
            callData: transferData
          }]
        });

        const receipt = await nexusSessionClient.waitForTransactionReceipt({ hash: userOpHash });
        setTxnHash(receipt.transactionHash);
      } else {
        // Regular transaction without session
        const userOpHash = await nexusClient.sendTransaction({
          calls: [{
            to: chains[chainSelected].PulaAddress,
            data: transferData,
            value: BigInt(0)
          }]
        });

        const receipt = await nexusClient.waitForTransactionReceipt({ hash: userOpHash });
        setTxnHash(receipt.transactionHash);
      }

      toast.update(toastId, {
        render: "Transfer Successful",
        type: "success",
        autoClose: 5000,
      });

      fetchBalance();
    } catch (error) {
      console.error("Error sending stablecoins:", error);
      toast.update(toastId, {
        render: "Transfer Failed: " + (error as Error).message,
        type: "error",
        autoClose: 5000,
      });
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start gap-8 p-24">
      <div className="text-[4rem] font-bold text-sky-400">PayPula</div>

      {hasPaymaster && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md text-center mb-4">
          🎉 Paymaster Active - Gas-free transactions enabled!
        </div>
      )}

      {!nexusClient ? (
        <div className="flex flex-row justify-center items-center gap-4">
          {chains.map((chain) => (
            <div
              key={chain.chainNo}
              className={`w-[10rem] h-[3rem] cursor-pointer rounded-lg flex flex-row justify-center items-center text-sky-400 ${
                chainSelected == chain.chainNo ? "bg-white" : "bg-black"
              } border-2 border-solid border-sky-400`}
              onClick={() => setChainSelected(chain.chainNo)}
            >
              {chain.name}
            </div>
          ))}
        </div>
      ) : (
        <>
          <span>Smart Account Address: {smartAccountAddress}</span>
          <span>Network: {chains[chainSelected].name}</span>
          <span>Balance: {balance} PUL</span>

          {!installedValidators.some(v => v.address.toLowerCase() === SMART_SESSION_VALIDATOR.toLowerCase()) && (
            <button
              className="w-[10rem] h-[3rem] bg-orange-500 text-white font-bold rounded-lg"
              onClick={installValidator}
            >
              Install Validator
            </button>
          )}

          {installedValidators.some(v => v.address.toLowerCase() === SMART_SESSION_VALIDATOR.toLowerCase()) && !permissionId && (
            <button
              className="w-[10rem] h-[3rem] bg-orange-500 text-white font-bold rounded-lg"
              onClick={createSession}
            >
              Create Session
            </button>
          )}

          {permissionId && (
            <button
              className="w-[10rem] h-[3rem] bg-red-500 text-white font-bold rounded-lg"
              onClick={() => {
                localStorage.removeItem('permissionId');
                setPermissionId(null);
              }}
            >
              Delete Session
            </button>
          )}

          <div className="flex flex-row justify-center items-start gap-4">
            <button
              className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
              onClick={mintTokens}
            >
              Mint Tokens
            </button>
            <button
              className="w-[10rem] h-[3rem] bg-white text-sky-400 font-bold rounded-lg"
              onClick={sendStablecoins}
            >
              Send Stablecoins
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
            {txnHash && (
              <a
                target="_blank"
                href={`${chains[chainSelected].explorerUrl + txnHash}`}
              >
                <span className="text-sky-400 font-bold underline">
                  View Transaction
                </span>
              </a>
            )}
          </div>
        </>
      )}

      {isLoading && (
        <div className="text-orange-400 animate-pulse text-center text-2xl">
          Processing... 🔥
        </div>
      )}
    </main>
  );
}
