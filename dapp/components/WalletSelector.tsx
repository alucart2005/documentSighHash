"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { formatAddress } from "@/lib/utils";
import { ethers } from "ethers";

export default function WalletSelector() {
  const {
    wallets,
    currentWallet,
    currentWalletIndex,
    selectWallet,
    isConnected,
    provider,
  } = useWallet();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obtener saldo de la wallet activa
  useEffect(() => {
    const fetchBalance = async () => {
      if (!provider || !currentWallet) return;

      setIsLoadingBalance(true);
      try {
        const balanceWei = await provider.getBalance(currentWallet.address);
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(parseFloat(balanceEth).toFixed(4));
      } catch (error) {
        console.error("Error obteniendo saldo:", error);
        setBalance("Error");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (isConnected && currentWallet && provider) {
      fetchBalance();
    }
  }, [isConnected, currentWallet, provider, currentWalletIndex]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

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
    <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg border-2 border-emerald-200 dark:border-lapis-lazuli-700">
      {/* Header con título y botón de ayuda */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-emerald-100 dark:border-lapis-lazuli-700">
        <h2 className="text-2xl font-bold text-indigo-dye dark:text-emerald-200 flex items-center gap-2">
          <span className="text-2xl">👛</span>
          Wallet Activa
        </h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 rounded-lg bg-keppel-100 dark:bg-keppel-900/30 hover:bg-keppel-200 dark:hover:bg-keppel-900/50 border border-keppel-300 dark:border-keppel-700 transition-colors"
          title="Ayuda"
          aria-label="Mostrar ayuda"
        >
          <span className="text-lg">❓</span>
        </button>
      </div>

      {/* Elemento unificado: Wallet activa con dropdown integrado */}
      <div className="p-6" ref={dropdownRef}>
        <div className="relative">
          {/* Contenedor principal de la wallet activa */}
          <div
            className={`rounded-xl border-2 transition-all duration-200 ${
              isDropdownOpen
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600 shadow-lg"
                : "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500 shadow-md hover:shadow-lg"
            }`}
          >
            {/* Información de la wallet activa */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
                        Wallet {currentWalletIndex + 1}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-1">
                        <span>✓</span>
                        <span>Activa</span>
                      </span>
                    </div>
                    {/* Saldo de la cuenta al lado derecho */}
                    <div className="bg-gradient-to-r from-emerald-500 to-keppel-500 rounded-lg px-4 py-2 border border-emerald-400 dark:border-emerald-600 shadow-md">
                      <div className="flex items-baseline gap-2">
                        {isLoadingBalance ? (
                          <span className="text-sm font-bold text-white animate-pulse">
                            ...
                          </span>
                        ) : balance !== null ? (
                          <>
                            <span className="text-lg font-bold text-white">
                              {balance}
                            </span>
                            <span className="text-sm font-semibold text-emerald-100">
                              ETH
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-white">
                            -
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Dirección completa prominente */}
                  <div className="bg-white dark:bg-lapis-lazuli-800 rounded-lg p-3 border border-emerald-200 dark:border-lapis-lazuli-600">
                    <p className="text-xs font-medium text-keppel-600 dark:text-keppel-400 mb-1">
                      Dirección completa:
                    </p>
                    <p className="text-base font-mono text-indigo-dye dark:text-emerald-200 break-all select-all">
                      {currentWallet.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón para abrir/cerrar dropdown */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full mt-3 px-4 py-2.5 rounded-lg bg-white dark:bg-lapis-lazuli-800 border-2 border-emerald-300 dark:border-lapis-lazuli-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-between group"
                aria-expanded={isDropdownOpen}
                aria-label="Cambiar wallet"
              >
                <span className="font-medium text-indigo-dye dark:text-emerald-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                  {isDropdownOpen ? "Ocultar wallets" : "Cambiar wallet"}
                </span>
                <span
                  className={`text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
            </div>

            {/* Dropdown de wallets */}
            {isDropdownOpen && (
              <div className="px-5 pb-5">
                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-lapis-lazuli-600">
                  <p className="text-xs font-semibold text-keppel-600 dark:text-keppel-400 mb-2 uppercase tracking-wide">
                    Seleccionar wallet:
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {wallets.map((wallet, index) => (
                      <button
                        key={index}
                        onClick={() => handleWalletSelect(index)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          index === currentWalletIndex
                            ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-500 shadow-sm"
                            : "bg-white dark:bg-lapis-lazuli-800 border-keppel-200 dark:border-lapis-lazuli-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-300 dark:hover:border-emerald-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-indigo-dye dark:text-emerald-200">
                                Wallet {index + 1}
                              </span>
                              {index === currentWalletIndex && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                  (Actual)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-keppel-600 dark:text-keppel-300 font-mono">
                              {formatAddress(wallet.address)}
                            </p>
                          </div>
                          {index === currentWalletIndex && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg ml-2">
                              ✓
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
                    dentro del contenedor de la wallet activa
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
                  almacenamiento en la blockchain. La dirección completa está
                  visible y se puede copiar fácilmente.
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
