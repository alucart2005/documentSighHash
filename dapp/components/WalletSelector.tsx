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
      <div className="p-4 bg-verdigris-50 dark:bg-verdigris-900/20 border-2 border-verdigris-200 dark:border-verdigris-700 rounded-xl">
        <p className="text-verdigris-700 dark:text-verdigris-300 font-medium">
          Conectando a Anvil...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-emerald-200 dark:border-lapis-lazuli-700">
      <h2 className="text-2xl font-bold mb-6 text-indigo-dye dark:text-emerald-200 flex items-center gap-2">
        <span className="text-2xl">👛</span>
        Seleccionar Wallet
      </h2>
      <div className="space-y-3">
        {wallets.map((wallet, index) => (
          <button
            key={index}
            onClick={() => selectWallet(index)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left transform hover:scale-[1.02] ${
              index === currentWalletIndex
                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500 shadow-md"
                : "bg-light-green-50 dark:bg-lapis-lazuli-800 border-keppel-200 dark:border-lapis-lazuli-600 hover:bg-light-green-100 dark:hover:bg-lapis-lazuli-700 hover:border-keppel-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-indigo-dye dark:text-emerald-200">
                  Wallet {index + 1}
                </p>
                <p className="text-sm text-keppel-600 dark:text-keppel-300 font-mono">
                  {formatAddress(wallet.address)}
                </p>
              </div>
              {index === currentWalletIndex && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                  ✓ Activa
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6 p-4 bg-keppel-50 dark:bg-keppel-900/20 rounded-xl border border-keppel-200 dark:border-keppel-700">
        <p className="text-sm font-medium text-keppel-700 dark:text-keppel-300">
          Wallet actual:{" "}
          <span className="font-mono text-indigo-dye dark:text-keppel-200 font-semibold">
            {currentWallet.address}
          </span>
        </p>
      </div>
    </div>
  );
}
