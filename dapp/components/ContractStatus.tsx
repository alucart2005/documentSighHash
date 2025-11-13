"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import { formatAddress } from "@/lib/utils";

export default function ContractStatus() {
  const { provider, contract, isConnected } = useWallet();
  const [isDeployed, setIsDeployed] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkContract = async () => {
    if (!provider || !contract) return;

    setChecking(true);
    try {
      // En ethers.js v6, podemos usar provider directamente o contract.runner.provider
      const contractProvider = contract.runner?.provider || provider;
      const code = await contractProvider.getCode(CONTRACT_ADDRESS);
      setIsDeployed(code !== "0x" && code !== "0x0" && code.length > 2);
    } catch (error) {
      console.error("Error checking contract:", error);
      setIsDeployed(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isConnected && provider && contract) {
      checkContract();
    }
  }, [isConnected, provider, contract]);

  if (!isConnected) {
    return null;
  }

  if (isDeployed === null || checking) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-4 border border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Verificando estado del contrato...
          </p>
        </div>
      </div>
    );
  }

  if (!isDeployed) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-800 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 text-red-600 dark:text-red-400">⚠️</div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Contrato No Desplegado
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              El contrato no está desplegado en la dirección:
            </p>
            <p className="text-xs font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded mb-3 text-red-900 dark:text-red-100">
              {CONTRACT_ADDRESS}
            </p>
            <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Para desplegar el contrato:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Asegúrate de que Anvil esté corriendo</li>
                <li>Ejecuta en otra terminal:</li>
              </ol>
              <code className="block bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs mt-2">
                cd sc
                <br />
                forge script script/FileHashStorage.s.sol:FileHashStorageScript
                --rpc-url http://localhost:8545 --broadcast
              </code>
              <p className="mt-2">
                3. Copia la dirección del contrato desplegado
              </p>
              <p>4. Actualiza CONTRACT_ADDRESS en dapp/lib/contract.ts</p>
            </div>
            <button
              onClick={checkContract}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
            >
              Verificar Nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-md p-4 border border-green-200 dark:border-green-800 mb-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <p className="text-sm text-green-800 dark:text-green-200">
          <span className="font-medium">Contrato desplegado:</span>{" "}
          <span className="font-mono">{formatAddress(CONTRACT_ADDRESS)}</span>
        </p>
        <button
          onClick={checkContract}
          className="ml-auto text-xs text-green-700 dark:text-green-300 hover:underline"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
