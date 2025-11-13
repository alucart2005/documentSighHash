"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import {
  ANVIL_RPC_URL,
  ANVIL_PRIVATE_KEYS,
  CONTRACT_ADDRESS,
  FILE_HASH_STORAGE_ABI,
  normalizePrivateKey,
} from "@/lib/contract";

interface WalletContextType {
  provider: ethers.JsonRpcProvider | null;
  wallets: ethers.Wallet[];
  currentWallet: ethers.Wallet | null;
  currentWalletIndex: number;
  contract: ethers.Contract | null;
  isConnected: boolean;
  selectWallet: (index: number) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [wallets, setWallets] = useState<ethers.Wallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<ethers.Wallet | null>(
    null
  );
  const [currentWalletIndex, setCurrentWalletIndex] = useState<number>(0);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    try {
      // Crear provider conectado a Anvil
      const jsonRpcProvider = new ethers.JsonRpcProvider(ANVIL_RPC_URL);

      // Verificar que la conexión funciona haciendo una llamada de prueba
      try {
        const blockNumber = await jsonRpcProvider.getBlockNumber();
        console.log("Connected to Anvil. Block number:", blockNumber);
      } catch (connectionError) {
        throw new Error(
          `No se pudo conectar a Anvil en ${ANVIL_RPC_URL}. ` +
            `Asegúrate de que Anvil esté corriendo. Error: ${connectionError}`
        );
      }

      setProvider(jsonRpcProvider);

      // Obtener las claves privadas directamente de Anvil usando impersonateAccount
      // O usar las claves privadas estándar de Anvil
      // Por ahora, usaremos las claves privadas del array pero con validación mejorada

      // Crear las 10 wallets de prueba con validación
      const walletList: ethers.Wallet[] = [];
      for (let i = 0; i < ANVIL_PRIVATE_KEYS.length; i++) {
        try {
          // Normalizar y validar la clave privada
          const normalizedKey = normalizePrivateKey(ANVIL_PRIVATE_KEYS[i]);

          // Convertir a BigInt para validar que esté en el rango válido de secp256k1
          // El rango válido es: 1 <= privateKey < 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
          try {
            const keyBigInt = BigInt(normalizedKey);
            const maxKey = BigInt(
              "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"
            );
            if (keyBigInt === BigInt(0) || keyBigInt >= maxKey) {
              throw new Error(
                `Clave privada fuera del rango válido para secp256k1`
              );
            }
          } catch (bigIntError) {
            console.warn(
              `Advertencia validando clave privada ${i + 1}:`,
              bigIntError
            );
          }

          // Crear wallet usando el constructor estándar de ethers.js v6
          // Verificar que la clave esté en el formato correcto
          if (!ethers.isHexString(normalizedKey, 32)) {
            throw new Error(
              `Clave privada no es un string hex válido de 32 bytes: ${normalizedKey}`
            );
          }

          // En ethers.js v6, podemos pasar la clave como string o como Uint8Array
          // Intentar primero como string, y si falla, convertir a bytes
          let wallet: ethers.Wallet;
          try {
            wallet = new ethers.Wallet(normalizedKey, jsonRpcProvider);
          } catch (stringError: any) {
            // Si falla como string, intentar como bytes
            try {
              const keyBytes = ethers.getBytes(normalizedKey);
              wallet = new ethers.Wallet(keyBytes, jsonRpcProvider);
            } catch (bytesError: any) {
              throw new Error(
                `No se pudo crear wallet con ningún formato. ` +
                  `String error: ${stringError?.message}. ` +
                  `Bytes error: ${bytesError?.message}`
              );
            }
          }

          // Verificar que la wallet se creó correctamente obteniendo su dirección
          const address = wallet.address;
          if (!address || address.length !== 42) {
            throw new Error(`Dirección de wallet inválida: ${address}`);
          }

          walletList.push(wallet);
          console.log(`✓ Wallet ${i + 1} creada: ${address}`);
        } catch (error: any) {
          console.error(`✗ Error creando wallet ${i + 1}:`, error);
          console.error(`  Clave privada: ${ANVIL_PRIVATE_KEYS[i]}`);
          throw new Error(
            `Error creando wallet ${i + 1}. ` +
              `Clave privada: ${ANVIL_PRIVATE_KEYS[i]}. ` +
              `Error: ${error?.message || String(error)}`
          );
        }
      }

      if (walletList.length === 0) {
        throw new Error("No se pudo crear ninguna wallet");
      }

      console.log(`✓ ${walletList.length} wallets creadas exitosamente`);
      setWallets(walletList);

      // Seleccionar la primera wallet por defecto
      const defaultWallet = walletList[0];
      setCurrentWallet(defaultWallet);
      setCurrentWalletIndex(0);

      // Verificar que la wallet tenga balance (opcional, solo para logging)
      try {
        const balance = await jsonRpcProvider.getBalance(defaultWallet.address);
        console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
      } catch (balanceError) {
        console.warn("Could not check wallet balance:", balanceError);
      }

      // Crear instancia del contrato
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        FILE_HASH_STORAGE_ABI,
        defaultWallet
      );
      setContract(contractInstance);

      setIsConnected(true);
    } catch (error: any) {
      console.error("Error connecting to Anvil:", error);
      const errorMessage =
        error?.message || "Error desconocido al conectar con Anvil";
      alert(
        `Error conectando a Anvil:\n\n${errorMessage}\n\n` +
          `Por favor verifica que:\n` +
          `1. Anvil esté corriendo en http://localhost:8545\n` +
          `2. No haya problemas de CORS\n` +
          `3. El puerto 8545 no esté siendo usado por otro proceso`
      );
      setIsConnected(false);
    }
  }, []);

  const selectWallet = useCallback(
    (index: number) => {
      if (index >= 0 && index < wallets.length && provider) {
        const selectedWallet = wallets[index];
        setCurrentWallet(selectedWallet);
        setCurrentWalletIndex(index);

        // Actualizar contrato con la nueva wallet
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          FILE_HASH_STORAGE_ABI,
          selectedWallet
        );
        setContract(contractInstance);
      }
    },
    [wallets, provider]
  );

  const disconnect = useCallback(() => {
    setProvider(null);
    setWallets([]);
    setCurrentWallet(null);
    setCurrentWalletIndex(0);
    setContract(null);
    setIsConnected(false);
  }, []);

  // Auto-conectar al montar el componente
  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <WalletContext.Provider
      value={{
        provider,
        wallets,
        currentWallet,
        currentWalletIndex,
        contract,
        isConnected,
        selectWallet,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
