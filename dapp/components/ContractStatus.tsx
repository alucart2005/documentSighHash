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
      <div className="bg-verdigris-50 dark:bg-verdigris-900/20 rounded-xl shadow-md p-4 border-2 border-verdigris-200 dark:border-verdigris-700 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-verdigris-500 rounded-full animate-pulse shadow-lg shadow-verdigris-400"></div>
          <p className="text-sm font-medium text-verdigris-700 dark:text-verdigris-300">
            Verificando estado del contrato...
          </p>
        </div>
      </div>
    );
  }

  if (!isDeployed) {
    return (
      <div className="bg-bondi-blue-50 dark:bg-bondi-blue-900/30 rounded-xl shadow-lg p-6 border-2 border-bondi-blue-300 dark:border-bondi-blue-700 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-bondi-blue-800 dark:text-bondi-blue-200 mb-3">
              Contrato No Desplegado
            </h3>
            <p className="text-sm text-bondi-blue-700 dark:text-bondi-blue-300 mb-3">
              El contrato no está desplegado en la dirección:
            </p>
            <p className="text-xs font-mono bg-bondi-blue-100 dark:bg-bondi-blue-800 p-3 rounded-lg mb-4 text-bondi-blue-900 dark:text-bondi-blue-100 border border-bondi-blue-200 dark:border-bondi-blue-700">
              {CONTRACT_ADDRESS}
            </p>
            <div className="space-y-2 text-sm text-bondi-blue-700 dark:text-bondi-blue-300">
              <p className="font-semibold">Para desplegar el contrato:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Asegúrate de que Anvil esté corriendo</li>
                <li>Ejecuta en otra terminal:</li>
              </ol>
              <code className="block bg-bondi-blue-100 dark:bg-bondi-blue-800 p-3 rounded-lg text-xs mt-2 border border-bondi-blue-200 dark:border-bondi-blue-700 font-mono">
                cd sc
                <br />
                forge script script/FileHashStorage.s.sol:FileHashStorageScript
                --rpc-url http://localhost:8545 --broadcast --private-key
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
              </code>
              <p className="mt-2">
                3. Copia la dirección del contrato desplegado
              </p>
              <p>4. Actualiza CONTRACT_ADDRESS en dapp/lib/contract.ts</p>
            </div>
            <button
              onClick={checkContract}
              className="mt-4 px-5 py-2.5 bg-bondi-blue-500 hover:bg-bondi-blue-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Verificar Nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl shadow-lg p-4 border-2 border-emerald-300 dark:border-emerald-600 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-400"></div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
          <span className="font-bold">Contrato desplegado:</span>{" "}
          <span className="font-mono bg-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded text-emerald-800 dark:text-emerald-100">
            {formatAddress(CONTRACT_ADDRESS)}
          </span>
        </p>
        <button
          onClick={checkContract}
          className="ml-auto text-xs text-emerald-600 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-100 hover:underline font-medium transition-colors"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
