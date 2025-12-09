import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        
        setProvider(provider);
        setAccount(address);
        setChainId(network.chainId);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Instala MetaMask!");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      // Detectar cambios de cuenta o red automáticamente
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || null);
        window.location.reload(); // Recargar para limpiar estados antiguos
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  return (
    <WalletContext.Provider value={{ account, provider, chainId, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};