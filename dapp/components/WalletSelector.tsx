"use client";

import { useState } from "react";
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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (!isConnected || !currentWallet) {
    return (
      <div className="p-4 bg-verdigris-50 dark:bg-verdigris-900/20 border-2 border-verdigris-200 dark:border-verdigris-700 rounded-xl">
        <p className="text-verdigris-700 dark:text-verdigris-300 font-medium">
          Conectando a Anvil...
        </p>
      </div>
    );
  }

  const handleWalletSelect = (index: number) => {
    selectWallet(index);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-emerald-200 dark:border-lapis-lazuli-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-indigo-dye dark:text-emerald-200 flex items-center gap-2">
          <span className="text-2xl">👛</span>
          Wallet Activa
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-lg bg-keppel-100 dark:bg-keppel-900/30 hover:bg-keppel-200 dark:hover:bg-keppel-900/50 border border-keppel-300 dark:border-keppel-700 transition-colors"
            title="Ayuda"
            aria-label="Mostrar ayuda"
          >
            <span className="text-lg">❓</span>
          </button>
        </div>
      </div>

      {/* Wallet activa - Vista compacta */}
      <div className="mb-4">
        <div className="p-4 rounded-xl border-2 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-indigo-dye dark:text-emerald-200">
                Wallet {currentWalletIndex + 1}
              </p>
              <p className="text-sm text-keppel-600 dark:text-keppel-300 font-mono">
                {formatAddress(currentWallet.address)}
              </p>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              ✓ Activa
            </span>
          </div>
        </div>
      </div>

      {/* Dropdown para cambiar wallet */}
      <div className="relative mb-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full p-3 rounded-xl border-2 bg-light-green-50 dark:bg-lapis-lazuli-800 border-keppel-200 dark:border-lapis-lazuli-600 hover:bg-light-green-100 dark:hover:bg-lapis-lazuli-700 hover:border-keppel-300 transition-all text-left flex items-center justify-between"
        >
          <span className="font-medium text-indigo-dye dark:text-emerald-200">
            {isDropdownOpen ? "Ocultar wallets" : "Cambiar wallet"}
          </span>
          <span className="text-keppel-600 dark:text-keppel-300">
            {isDropdownOpen ? "▲" : "▼"}
          </span>
        </button>

        {isDropdownOpen && (
          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto rounded-xl border-2 border-keppel-200 dark:border-lapis-lazuli-600 bg-white dark:bg-lapis-lazuli-800 p-2">
            {wallets.map((wallet, index) => (
              <button
                key={index}
                onClick={() => handleWalletSelect(index)}
                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                  index === currentWalletIndex
                    ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500 shadow-md"
                    : "bg-light-green-50 dark:bg-lapis-lazuli-700 border-keppel-200 dark:border-lapis-lazuli-500 hover:bg-light-green-100 dark:hover:bg-lapis-lazuli-600 hover:border-keppel-300"
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
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Información de la wallet actual */}
      <div className="p-4 bg-keppel-50 dark:bg-keppel-900/20 rounded-xl border border-keppel-200 dark:border-keppel-700">
        <p className="text-sm font-medium text-keppel-700 dark:text-keppel-300">
          Dirección completa:{" "}
          <span className="font-mono text-indigo-dye dark:text-keppel-200 font-semibold break-all">
            {currentWallet.address}
          </span>
        </p>
      </div>

      {/* Modal de ayuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-2xl max-w-2xl w-full p-6 border-2 border-emerald-200 dark:border-lapis-lazuli-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-indigo-dye dark:text-emerald-200">
                💡 Ayuda: Cambiar de Wallet
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 rounded-lg hover:bg-keppel-100 dark:hover:bg-keppel-900/30 transition-colors"
                aria-label="Cerrar ayuda"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="space-y-4 text-keppel-700 dark:text-keppel-300">
              <div>
                <h4 className="font-semibold text-indigo-dye dark:text-emerald-200 mb-2">
                  ¿Cómo cambiar de wallet?
                </h4>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    Haz clic en el botón{" "}
                    <span className="font-mono bg-keppel-100 dark:bg-keppel-900/30 px-2 py-1 rounded">
                      "Cambiar wallet"
                    </span>{" "}
                    debajo de la wallet activa
                  </li>
                  <li>
                    Se desplegará un menú con todas las wallets disponibles (10
                    wallets de prueba de Anvil)
                  </li>
                  <li>
                    Selecciona la wallet que deseas usar haciendo clic en ella
                  </li>
                  <li>
                    La wallet seleccionada se marcará con un{" "}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓
                    </span>{" "}
                    y se convertirá en la wallet activa
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-indigo-dye dark:text-emerald-200 mb-2">
                  ¿Qué son estas wallets?
                </h4>
                <p className="ml-2">
                  Estas son las 10 wallets de prueba que Anvil genera por
                  defecto. Cada una tiene un balance inicial de 10,000 ETH para
                  realizar transacciones de prueba en tu blockchain local.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-indigo-dye dark:text-emerald-200 mb-2">
                  ¿Por qué cambiar de wallet?
                </h4>
                <p className="ml-2">
                  Puedes cambiar de wallet para probar diferentes escenarios,
                  como firmar documentos con diferentes identidades o simular
                  múltiples usuarios en tu aplicación descentralizada.
                </p>
              </div>

              <div className="pt-4 border-t border-keppel-200 dark:border-keppel-700">
                <p className="text-sm text-keppel-600 dark:text-keppel-400">
                  💡 <strong>Tip:</strong> La wallet activa se usa
                  automáticamente para todas las operaciones de firma y
                  almacenamiento en la blockchain.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
