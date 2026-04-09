"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  account: string | null;
  signer: ethers.JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  signer: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        
        // --- NEW: FORCE METAMASK TO SWITCH TO SEPOLIA ---
        const sepoliaChainIdHex = '0xaa36a7'; 
        const network = await provider.getNetwork();
        
        // If the user is NOT on Sepolia (Chain ID 11155111)
        if (network.chainId !== BigInt(11155111)) {
            console.log("Switching MetaMask to Sepolia...");
            try {
                await (window as any).ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: sepoliaChainIdHex }],
                });
            } catch (switchError: any) {
                // This error code means Sepolia hasn't been added to their MetaMask yet
                if (switchError.code === 4902) {
                    alert("Please add the Sepolia Testnet to your MetaMask networks!");
                }
                console.error("Failed to switch network:", switchError);
                return; // Stop the connection if they refuse to switch
            }
        }
        // ------------------------------------------------

        // Request account access
        const accounts = await provider.send("eth_requestAccounts", []);
        
        // IMPORTANT: Re-initialize the provider after the network switch!
        const updatedProvider = new ethers.BrowserProvider((window as any).ethereum);
        const currentSigner = await updatedProvider.getSigner();
        
        setAccount(accounts[0]);
        setSigner(currentSigner);
      } catch (error) {
        console.error("User denied account access or error occurred:", error);
      }
    } else {
      alert("Please install MetaMask to use this feature!");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
  };

  return (
    <WalletContext.Provider value={{ account, signer, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);