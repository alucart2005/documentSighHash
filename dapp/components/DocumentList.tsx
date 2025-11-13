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
      <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-verdigris-200 dark:border-lapis-lazuli-700">
        <p className="text-verdigris-700 dark:text-verdigris-300 font-medium">
          Conectando a Anvil...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-cerulean-200 dark:border-lapis-lazuli-700">
      <h2 className="text-2xl font-bold mb-6 text-indigo-dye dark:text-cerulean-200 flex items-center gap-2">
        <span className="text-2xl">📚</span>
        Documentos en Blockchain
      </h2>

      <div className="space-y-5">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            placeholder="Buscar por hash (0x...)"
            className="flex-1 px-4 py-3 border-2 border-cerulean-200 dark:border-lapis-lazuli-600 rounded-xl
              bg-white dark:bg-lapis-lazuli-800 text-indigo-dye dark:text-cerulean-100
              focus:outline-none focus:ring-2 focus:ring-cerulean-400 focus:border-cerulean-400
              transition-all"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchHash.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cerulean-500 to-lapis-lazuli-500 hover:from-cerulean-600 hover:to-lapis-lazuli-600 disabled:from-indigo-dye-300 disabled:to-indigo-dye-300
              text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
          >
            {loading ? "⏳" : "🔍"} Buscar
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="p-10 text-center bg-light-green-50 dark:bg-keppel-900/20 rounded-xl border-2 border-light-green-200 dark:border-keppel-700">
            <p className="text-indigo-dye-600 dark:text-keppel-300 font-medium mb-2">
              No hay documentos cargados.
            </p>
            <p className="text-sm text-indigo-dye-500 dark:text-keppel-400">
              Busca un documento por su hash para comenzar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="p-5 bg-gradient-to-br from-light-green-50 to-keppel-50 dark:from-keppel-900/20 dark:to-lapis-lazuli-800 rounded-xl border-2 border-light-green-200 dark:border-keppel-700 shadow-md hover:shadow-lg transition-all"
              >
                <div className="space-y-3 text-sm">
                  <p className="text-indigo-dye-700 dark:text-keppel-200">
                    <span className="font-bold">Hash:</span>{" "}
                    <span className="font-mono text-indigo-dye dark:text-keppel-100 break-all bg-white dark:bg-lapis-lazuli-800 px-2 py-1 rounded border border-keppel-200 dark:border-keppel-700">
                      {doc.hash}
                    </span>
                  </p>
                  <p className="text-indigo-dye-700 dark:text-keppel-200">
                    <span className="font-bold">Signer:</span>{" "}
                    <span className="font-mono text-indigo-dye dark:text-keppel-100">
                      {formatAddress(doc.signer)}
                    </span>
                  </p>
                  <p className="text-indigo-dye-700 dark:text-keppel-200">
                    <span className="font-bold">Timestamp:</span>{" "}
                    <span className="text-indigo-dye dark:text-keppel-100">
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
