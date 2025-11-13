"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { calculateFileHash, formatAddress, formatTimestamp } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/contract";

export default function DocumentVerifier() {
  const { contract, isConnected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    documentInfo: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setVerificationResult(null);
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

  const handleVerify = async () => {
    if (!hash || !contract) {
      setStatus({
        type: "error",
        message: "Por favor selecciona un archivo primero",
      });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      // Verificar que el contrato esté desplegado
      // En ethers.js v6, el provider está en contract.runner.provider
      const provider = contract.runner?.provider;
      if (!provider) {
        throw new Error(
          "Provider no disponible. Asegúrate de estar conectado a Anvil."
        );
      }

      // Usar CONTRACT_ADDRESS directamente en lugar de contract.target para evitar errores
      // Verificar si el contrato tiene código
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (!code || code === "0x" || code === "0x0") {
        throw new Error(
          "El contrato no está desplegado en la dirección especificada. " +
            "Por favor despliega el contrato primero usando: " +
            "forge script script/FileHashStorage.s.sol:FileHashStorageScript --rpc-url http://localhost:8545 --broadcast"
        );
      }

      // Verificar si el documento existe
      let exists: boolean;
      try {
        exists = await contract.isDocumentStored(hash);
      } catch (callError: any) {
        // Si el error es BAD_DATA con value="0x", el contrato no está desplegado
        if (
          callError?.code === "BAD_DATA" ||
          callError?.message?.includes("could not decode result data")
        ) {
          throw new Error(
            "El contrato no está desplegado o la dirección es incorrecta. " +
              `Dirección actual: ${CONTRACT_ADDRESS}. ` +
              "Por favor verifica que el contrato esté desplegado y actualiza CONTRACT_ADDRESS en lib/contract.ts"
          );
        }
        throw callError;
      }

      if (!exists) {
        setStatus({
          type: "error",
          message: "El documento no está almacenado en la blockchain",
        });
        setVerificationResult(null);
        return;
      }

      // Obtener información del documento
      const [documentHash, timestamp, signer, signature] =
        await contract.getDocumentInfo(hash);

      // Verificar la firma
      const isValid = await contract.verifyDocument(hash, signer, signature);

      setVerificationResult({
        isValid,
        documentInfo: {
          hash: documentHash,
          timestamp,
          signer,
          signature,
        },
      });

      setStatus({
        type: isValid ? "success" : "error",
        message: isValid
          ? "✓ Documento verificado correctamente"
          : "✗ La verificación del documento falló",
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Error al verificar el documento",
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
        Verificar Documento
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Seleccionar Archivo para Verificar
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-500 dark:text-zinc-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100
              dark:file:bg-green-900/20 dark:file:text-green-400"
            disabled={loading}
          />
        </div>

        {file && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Archivo:</span> {file.name}
            </p>
            {hash && (
              <p className="text-xs font-mono text-zinc-900 dark:text-zinc-50 break-all mt-2">
                <span className="font-medium">Hash:</span> {hash}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={!hash || loading}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 
            text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {loading ? "Verificando..." : "Verificar Documento"}
        </button>

        {verificationResult && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
            <div
              className={`p-3 rounded-lg ${
                verificationResult.isValid
                  ? "bg-green-100 dark:bg-green-900/20"
                  : "bg-red-100 dark:bg-red-900/20"
              }`}
            >
              <p
                className={`font-semibold ${
                  verificationResult.isValid
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {verificationResult.isValid ? "✓ Válido" : "✗ Inválido"}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">Hash:</span>{" "}
                <span className="font-mono text-zinc-900 dark:text-zinc-50">
                  {verificationResult.documentInfo.hash}
                </span>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">Timestamp:</span>{" "}
                <span className="text-zinc-900 dark:text-zinc-50">
                  {formatTimestamp(verificationResult.documentInfo.timestamp)}
                </span>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">Signer:</span>{" "}
                <span className="font-mono text-zinc-900 dark:text-zinc-50">
                  {formatAddress(verificationResult.documentInfo.signer)}
                </span>
              </p>
            </div>
          </div>
        )}

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
