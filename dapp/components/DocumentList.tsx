"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { formatAddress, formatTimestamp, isValidHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/contract";
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

  const loadDocument = useCallback(
    async (hash: string) => {
      if (!contract) return null;

      // Validar hash antes de hacer cualquier llamada
      if (!hash || !isValidHash(hash)) {
        console.warn("Hash inválido:", hash);
        return null;
      }

      try {
        // Verificar que el contrato esté desplegado
        // En ethers.js v6, el provider está en contract.runner.provider
        const contractProvider = contract.runner?.provider || provider;
        if (contractProvider) {
          // Usar CONTRACT_ADDRESS directamente en lugar de contract.target
          const code = await contractProvider.getCode(CONTRACT_ADDRESS);
          if (!code || code === "0x" || code === "0x0") {
            console.warn("Contrato no desplegado en", CONTRACT_ADDRESS);
            return null;
          }
        }

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
      } catch (error: any) {
        // Ignorar errores BAD_DATA (contrato no desplegado)
        if (
          error?.code === "BAD_DATA" ||
          error?.message?.includes("could not decode result data")
        ) {
          console.warn(
            "Contrato no desplegado o error de decodificación:",
            error
          );
          return null;
        }
        console.error("Error loading document:", error);
        return null;
      }
    },
    [contract, provider]
  );

  // Escuchar eventos de nuevos documentos
  useEffect(() => {
    if (!contract || !provider) return;

    const filter = contract.filters.DocumentStored();

    // En ethers.js v6, los eventos pueden venir en diferentes formatos
    // Necesitamos manejar tanto el formato de argumentos directos como el formato de evento completo
    const handleNewDocument = (...args: any[]) => {
      try {
        // Si el primer argumento es un objeto con 'args', es un evento completo
        let hash: string;
        if (args[0] && typeof args[0] === "object" && args[0].args) {
          // Formato de evento completo: extraer args
          const eventArgs = args[0].args;
          hash = eventArgs[0]; // Primer argumento es el hash
          const signer = eventArgs[1];
          const timestamp = eventArgs[2];
          console.log("Nuevo documento almacenado (evento completo):", {
            hash,
            signer,
            timestamp,
          });
        } else {
          // Formato de argumentos directos
          hash = args[0];
          const signer = args[1];
          const timestamp = args[2];
          console.log("Nuevo documento almacenado (argumentos directos):", {
            hash,
            signer,
            timestamp,
          });
        }

        // Validar hash antes de cargar
        if (hash && isValidHash(hash)) {
          loadDocument(hash);
        } else {
          console.warn("Hash inválido recibido del evento:", hash);
        }
      } catch (error) {
        console.error("Error procesando evento DocumentStored:", error);
      }
    };

    contract.on(filter, handleNewDocument);

    return () => {
      contract.off(filter, handleNewDocument);
    };
  }, [contract, provider, loadDocument]);

  const handleSearch = async () => {
    if (!searchHash.trim() || !contract) return;

    const trimmedHash = searchHash.trim();

    // Validar formato del hash antes de hacer la búsqueda
    if (!isValidHash(trimmedHash)) {
      alert(
        "Hash inválido. Por favor ingresa un hash válido en formato hexadecimal (0x + 64 caracteres).\n\n" +
          `Ejemplo: 0x61dd80061de1c2c91755198a43173949493499f1dbadcb6319653640d51092b7`
      );
      setSearchHash("");
      return;
    }

    setLoading(true);
    try {
      // Verificar que el contrato esté desplegado
      // En ethers.js v6, el provider está en contract.runner.provider
      const contractProvider = contract.runner?.provider || provider;
      if (contractProvider) {
        // Usar CONTRACT_ADDRESS directamente en lugar de contract.target
        const code = await contractProvider.getCode(CONTRACT_ADDRESS);
        if (!code || code === "0x" || code === "0x0") {
          alert(
            "El contrato no está desplegado. " +
              "Por favor despliega el contrato primero usando: " +
              "forge script script/FileHashStorage.s.sol:FileHashStorageScript --rpc-url http://localhost:8545 --broadcast"
          );
          return;
        }
      }

      const doc = await loadDocument(trimmedHash);
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
    } catch (error: any) {
      console.error("Error searching document:", error);
      if (
        error?.code === "BAD_DATA" ||
        error?.message?.includes("could not decode result data")
      ) {
        alert(
          "El contrato no está desplegado o la dirección es incorrecta. " +
            "Por favor verifica el deployment del contrato."
        );
      } else {
        alert(
          `Error al buscar el documento: ${
            error?.message || "Error desconocido"
          }`
        );
      }
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
