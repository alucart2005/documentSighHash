"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { formatAddress, formatTimestamp } from "@/lib/utils";
import { ethers } from "ethers";

interface DocumentInfo {
  hash: string;
  timestamp: bigint;
  signer: string;
  signature: string;
}

export default function DocumentList() {
  const { contract, provider, isConnected } = useWallet();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHash, setSearchHash] = useState("");

  // Escuchar eventos de nuevos documentos
  useEffect(() => {
    if (!contract || !provider) return;

    const filter = contract.filters.DocumentStored();

    const handleNewDocument = (
      hash: string,
      signer: string,
      timestamp: bigint
    ) => {
      console.log("Nuevo documento almacenado:", { hash, signer, timestamp });
      // Recargar documentos cuando se almacena uno nuevo
      loadDocument(hash);
    };

    contract.on(filter, handleNewDocument);

    return () => {
      contract.off(filter, handleNewDocument);
    };
  }, [contract, provider]);

  const loadDocument = async (hash: string) => {
    if (!contract) return;

    try {
      const exists = await contract.isDocumentStored(hash);
      if (!exists) {
        return null;
      }

      const [documentHash, timestamp, signer, signature] =
        await contract.getDocumentInfo(hash);

      return {
        hash: documentHash,
        timestamp,
        signer,
        signature,
      };
    } catch (error) {
      console.error("Error loading document:", error);
      return null;
    }
  };

  const handleSearch = async () => {
    if (!searchHash.trim() || !contract) return;

    setLoading(true);
    try {
      const doc = await loadDocument(searchHash.trim());
      if (doc) {
        // Verificar si ya existe en la lista
        const exists = documents.some(
          (d) => d.hash.toLowerCase() === doc.hash.toLowerCase()
        );
        if (!exists) {
          setDocuments([doc, ...documents]);
        }
      } else {
        alert("Documento no encontrado");
      }
    } catch (error) {
      console.error("Error searching document:", error);
      alert("Error al buscar el documento");
    } finally {
      setLoading(false);
      setSearchHash("");
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">
          Conectando a Anvil...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
        Documentos en Blockchain
      </h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            placeholder="Buscar por hash (0x...)"
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg
              bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchHash.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400
              text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Buscar
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
            <p>No hay documentos cargados.</p>
            <p className="text-sm mt-2">
              Busca un documento por su hash para comenzar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <div className="space-y-2 text-sm">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">Hash:</span>{" "}
                    <span className="font-mono text-zinc-900 dark:text-zinc-50 break-all">
                      {doc.hash}
                    </span>
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">Signer:</span>{" "}
                    <span className="font-mono text-zinc-900 dark:text-zinc-50">
                      {formatAddress(doc.signer)}
                    </span>
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">Timestamp:</span>{" "}
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {formatTimestamp(doc.timestamp)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



