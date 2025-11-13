"use client";

import { useWallet } from "@/contexts/WalletContext";

export default function ConnectionStatus() {
  const { isConnected, connect, provider } = useWallet();

  const handleReconnect = async () => {
    await connect();
  };

  if (isConnected && provider) {
    return (
      <div className="fixed top-4 right-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Conectado a Anvil
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-md z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            No conectado a Anvil
          </p>
          <p className="text-xs text-red-700 dark:text-red-300 mb-3">
            Asegúrate de que Anvil esté corriendo en http://localhost:8545
          </p>
          <button
            onClick={handleReconnect}
            className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    </div>
  );
}


