"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { calculateFileHash, signHash } from "@/lib/utils";

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
      setStatus({
        type: "error",
        message: error?.message || "Error al almacenar el documento",
      });
      console.error(error);
    } finally {
      setLoading(false);
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
        Subir y Almacenar Documento
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Seleccionar Archivo
          </label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-500 dark:text-zinc-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900/20 dark:file:text-blue-400"
            disabled={loading}
          />
        </div>

        {file && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Archivo:</span> {file.name}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Tamaño:</span>{" "}
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {hash && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              <span className="font-medium">Hash SHA-256:</span>
            </p>
            <p className="text-xs font-mono text-zinc-900 dark:text-zinc-50 break-all">
              {hash}
            </p>
          </div>
        )}

        <button
          onClick={handleStore}
          disabled={!file || !hash || loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 
            text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {loading ? "Procesando..." : "Firmar y Almacenar en Blockchain"}
        </button>

        {status && (
          <div
            className={`p-4 rounded-lg ${
              status.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <p
              className={`text-sm ${
                status.type === "success"
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              {status.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



