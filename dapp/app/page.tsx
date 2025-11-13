"use client";

import WalletSelector from "@/components/WalletSelector";
import FileUpload from "@/components/FileUpload";
import DocumentVerifier from "@/components/DocumentVerifier";
import DocumentList from "@/components/DocumentList";
import ConnectionStatus from "@/components/ConnectionStatus";
import ContractStatus from "@/components/ContractStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <ConnectionStatus />
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            FileHashStorage dApp
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Almacena y verifica hashes de documentos en la blockchain
          </p>
        </header>

        <ContractStatus />

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

        <footer className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Conectado a Anvil en{" "}
            <span className="font-mono">http://localhost:8545</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
