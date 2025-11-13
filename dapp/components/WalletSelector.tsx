"use client";

import { useWallet } from "@/contexts/WalletContext";
import { formatAddress } from "@/lib/utils";

export default function WalletSelector() {
  const {
    wallets,
    currentWallet,
    currentWalletIndex,
    selectWallet,
    isConnected,
  } = useWallet();

  if (!isConnected || !currentWallet) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Conectando a Anvil...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
        Seleccionar Wallet
      </h2>
      <div className="space-y-2">
        {wallets.map((wallet, index) => (
          <button
            key={index}
            onClick={() => selectWallet(index)}
            className={`w-full p-3 rounded-lg border transition-colors text-left ${
              index === currentWalletIndex
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500"
                : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  Wallet {index + 1}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formatAddress(wallet.address)}
                </p>
              </div>
              {index === currentWalletIndex && (
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  ✓ Activa
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Wallet actual:{" "}
          <span className="font-mono text-zinc-900 dark:text-zinc-50">
            {currentWallet.address}
          </span>
        </p>
      </div>
    </div>
  );
}



