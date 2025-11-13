"use client";

import WalletSelector from "@/components/WalletSelector";
import FileUpload from "@/components/FileUpload";
import DocumentVerifier from "@/components/DocumentVerifier";
import DocumentList from "@/components/DocumentList";
import ConnectionStatus from "@/components/ConnectionStatus";
import ContractStatus from "@/components/ContractStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-mindaro-900 dark:bg-indigo-dye-100 py-8 px-4">
      <ConnectionStatus />
      <div className="max-w-7xl mx-auto">
        {/* Header with gradient background */}
        <header className="mb-12 text-center">
          <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-emerald-500 via-keppel-500 to-verdigris-500 shadow-lg mb-6">
            <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
              FileHashStorage dApp
            </h1>
            <p className="text-lg text-emerald-50 font-medium">
              Almacena y verifica hashes de documentos en la blockchain
            </p>
          </div>
        </header>

        <ContractStatus />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <WalletSelector />
          </div>
          <div>
            <FileUpload />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <DocumentVerifier />
          </div>
          <div>
            <DocumentList />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t-2 border-emerald-200 dark:border-lapis-lazuli-700 text-center">
          <p className="text-sm text-indigo-dye-600 dark:text-keppel-300">
            Conectado a Anvil en{" "}
            <span className="font-mono bg-emerald-100 dark:bg-lapis-lazuli-800 px-2 py-1 rounded text-emerald-700 dark:text-keppel-200">
              http://localhost:8545
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}
