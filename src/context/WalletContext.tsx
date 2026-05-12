"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

  // Restore connection on page load (silent, no popup)
  const restoreConnection = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        // Get accounts without prompting: eth_accounts RPC call
        const accounts = await provider.send("eth_accounts", []);
        if (accounts && accounts.length > 0) {
          // Check network – optionally switch to Sepolia
          const network = await provider.getNetwork();
          if (network.chainId !== BigInt(11155111)) {
            try {
              await (window as any).ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }],
              });
              // After switch, re‑initialize provider and signer
              const newProvider = new ethers.BrowserProvider((window as any).ethereum);
              const newSigner = await newProvider.getSigner();
              setAccount(accounts[0]);
              setSigner(newSigner);
              return;
            } catch (err) {
              console.warn("Network mismatch, please switch to Sepolia");
              setAccount(null);
              setSigner(null);
              return;
            }
          }
          const currentSigner = await provider.getSigner();
          setAccount(accounts[0]);
          setSigner(currentSigner);
        }
      } catch (error) {
        console.error("Failed to restore wallet:", error);
      }
    }
  };

  // Auto-restore on mount
  useEffect(() => {
    restoreConnection();
  }, []);

  // Listen for account/network changes in MetaMask
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          (async () => {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const newSigner = await provider.getSigner();
            setAccount(accounts[0]);
            setSigner(newSigner);
          })();
        }
      };

      const handleChainChanged = () => {
        window.location.reload(); // simple reload on network change
      };

      const ethereum = (window as any).ethereum;
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account]);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        
        // Force Sepolia
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(11155111)) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              alert("Please add Sepolia testnet to your MetaMask.");
            }
            console.error("Network switch failed:", switchError);
            return;
          }
        }

        const accounts = await provider.send("eth_requestAccounts", []);
        const updatedProvider = new ethers.BrowserProvider((window as any).ethereum);
        const currentSigner = await updatedProvider.getSigner();
        
        setAccount(accounts[0]);
        setSigner(currentSigner);
      } catch (error) {
        console.error("Connection error:", error);
      }
    } else {
      alert("Please install MetaMask!");
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