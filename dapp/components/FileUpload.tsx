"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { calculateFileHash, signHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/contract";

export default function FileUpload() {
  const { currentWallet, contract, isConnected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStatus(null);

    try {
      setLoading(true);
      const fileHash = await calculateFileHash(selectedFile);
      setHash(fileHash);
    } catch (error) {
      setStatus({
        type: "error",
        message: "Error calculando hash del archivo",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStore = async () => {
    if (!file || !hash || !currentWallet || !contract) {
      setStatus({ type: "error", message: "Por favor selecciona un archivo" });
      return;
    }

    // Confirmación antes de firmar y almacenar
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas firmar y almacenar este documento?\n\n` +
        `Archivo: ${file.name}\n` +
        `Hash: ${hash}\n` +
        `Wallet: ${currentWallet.address}`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setStatus(null);

      // Verificar que el contrato esté desplegado
      // En ethers.js v6, el provider está en contract.runner.provider o podemos usar currentWallet.provider
      const provider = contract.runner?.provider || currentWallet?.provider;
      if (!provider) {
        throw new Error("Provider no disponible");
      }

      // Usar CONTRACT_ADDRESS directamente en lugar de contract.target para evitar errores
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (!code || code === "0x" || code === "0x0") {
        throw new Error(
          "El contrato no está desplegado. " +
            "Por favor despliega el contrato primero usando: " +
            "forge script script/FileHashStorage.s.sol:FileHashStorageScript --rpc-url http://localhost:8545 --broadcast"
        );
      }

      // Verificar si el documento ya está almacenado antes de intentar almacenarlo
      const alreadyStored = await contract.isDocumentStored(hash);
      if (alreadyStored) {
        // Obtener información del documento existente
        try {
          const [documentHash, timestamp, signer, signature] =
            await contract.getDocumentInfo(hash);
          const storedDate = new Date(
            Number(timestamp) * 1000
          ).toLocaleString();
          throw new Error(
            `Este documento ya está almacenado en la blockchain.\n\n` +
              `Hash: ${documentHash}\n` +
              `Almacenado por: ${signer}\n` +
              `Fecha: ${storedDate}\n\n` +
              `No puedes almacenar el mismo documento dos veces.`
          );
        } catch (infoError: any) {
          // Si no podemos obtener la info, mostrar mensaje genérico
          if (!infoError.message.includes("ya está almacenado")) {
            throw new Error(
              "Este documento ya está almacenado en la blockchain. " +
                "No puedes almacenar el mismo documento dos veces."
            );
          }
          throw infoError;
        }
      }

      // Firmar el hash
      const signature = await signHash(hash, currentWallet);

      // Obtener timestamp actual
      const timestamp = Math.floor(Date.now() / 1000);

      // Almacenar en el contrato
      const tx = await contract.storeDocumentHash(hash, timestamp, signature);
      await tx.wait();

      setStatus({
        type: "success",
        message: `Documento almacenado exitosamente! TX: ${tx.hash}`,
      });

      // Limpiar formulario
      setFile(null);
      setHash("");
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      // Detectar errores específicos del contrato
      let errorMessage = "Error al almacenar el documento";

      if (error?.reason) {
        // Error revertido del contrato
        errorMessage = error.reason;
      } else if (error?.data?.message) {
        // Error con data.message
        errorMessage = error.data.message;
      } else if (error?.message) {
        // Error estándar
        errorMessage = error.message;

        // Detectar específicamente el error "document already stored"
        if (
          error.message.includes("document already stored") ||
          error.message.includes("ya está almacenado")
        ) {
          errorMessage = error.message;
        }
      }

      setStatus({
        type: "error",
        message: errorMessage,
      });
      console.error("Error almacenando documento:", error);
    } finally {
      setLoading(false);
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
    <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-emerald-200 dark:border-lapis-lazuli-700">
      <h2 className="text-2xl font-bold mb-6 text-indigo-dye dark:text-emerald-200 flex items-center gap-2">
        <span className="text-2xl">📄</span>
        Subir y Almacenar Documento
      </h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-indigo-dye-600 dark:text-keppel-300 mb-2">
            Seleccionar Archivo
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Input de archivo - Examinar */}
            <div className="flex-1 min-w-0">
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-keppel-600 dark:text-keppel-300
                  file:mr-4 file:py-2.5 file:px-5
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-emerald-500 file:text-white
                  hover:file:bg-emerald-600 file:transition-all
                  file:shadow-md hover:file:shadow-lg file:cursor-pointer
                  dark:file:bg-emerald-600 dark:hover:file:bg-emerald-700"
                disabled={loading}
              />
            </div>

            {/* Botón Firmar y Almacenar */}
            <button
              onClick={handleStore}
              disabled={!file || !hash || loading}
              className="flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-5 sm:px-6 bg-gradient-to-r from-emerald-500 to-keppel-500 hover:from-emerald-600 hover:to-keppel-600 disabled:from-indigo-dye-300 disabled:to-indigo-dye-300 
                text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:transform-none
                whitespace-nowrap text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <span>⏳</span>
                  <span className="hidden sm:inline">Procesando...</span>
                </>
              ) : (
                <>
                  <span>🔒</span>
                  <span className="hidden sm:inline">Firmar y Almacenar</span>
                  <span className="sm:hidden">Firmar</span>
                  <span className="hidden sm:inline">⛓️</span>
                </>
              )}
            </button>
          </div>
        </div>

        {file && (
          <div className="p-4 bg-light-green-50 dark:bg-keppel-900/20 rounded-xl border border-light-green-200 dark:border-keppel-700">
            <p className="text-sm text-indigo-dye-700 dark:text-keppel-200 mb-1">
              <span className="font-semibold">Archivo:</span> {file.name}
            </p>
            <p className="text-sm text-indigo-dye-600 dark:text-keppel-300">
              <span className="font-semibold">Tamaño:</span>{" "}
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {hash && (
          <div className="p-4 bg-keppel-50 dark:bg-keppel-900/20 rounded-xl border border-keppel-200 dark:border-keppel-700">
            <p className="text-sm font-semibold text-indigo-dye-700 dark:text-keppel-200 mb-2">
              Hash SHA-256:
            </p>
            <p className="text-xs font-mono text-indigo-dye dark:text-keppel-100 break-all bg-white dark:bg-lapis-lazuli-800 p-2 rounded border border-keppel-200 dark:border-keppel-700">
              {hash}
            </p>
          </div>
        )}

        {status && (
          <div
            className={`p-4 rounded-xl border-2 ${
              status.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600"
                : "bg-bondi-blue-50 dark:bg-bondi-blue-900/30 border-bondi-blue-300 dark:border-bondi-blue-600"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                status.type === "success"
                  ? "text-emerald-800 dark:text-emerald-200"
                  : "text-bondi-blue-800 dark:text-bondi-blue-200"
              }`}
            >
              {status.type === "success" ? "✓ " : "⚠ "}
              {status.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
