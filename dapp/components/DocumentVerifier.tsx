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
      <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-verdigris-200 dark:border-lapis-lazuli-700">
        <p className="text-verdigris-700 dark:text-verdigris-300 font-medium">
          Conectando a Anvil...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-verdigris-200 dark:border-lapis-lazuli-700">
      <h2 className="text-2xl font-bold mb-6 text-indigo-dye dark:text-verdigris-200 flex items-center gap-2">
        <span className="text-2xl">🔍</span>
        Verificar Documento
      </h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-indigo-dye-600 dark:text-verdigris-300 mb-2">
            Seleccionar Archivo para Verificar
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-keppel-600 dark:text-verdigris-300
              file:mr-4 file:py-2.5 file:px-5
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-verdigris-500 file:text-white
              hover:file:bg-verdigris-600 file:transition-all
              file:shadow-md hover:file:shadow-lg file:cursor-pointer
              dark:file:bg-verdigris-600 dark:hover:file:bg-verdigris-700"
            disabled={loading}
          />
        </div>

        {file && (
          <div className="p-4 bg-verdigris-50 dark:bg-verdigris-900/20 rounded-xl border border-verdigris-200 dark:border-verdigris-700">
            <p className="text-sm text-indigo-dye-700 dark:text-verdigris-200 mb-2">
              <span className="font-semibold">Archivo:</span> {file.name}
            </p>
            {hash && (
              <p className="text-xs font-mono text-indigo-dye dark:text-verdigris-100 break-all mt-2 bg-white dark:bg-lapis-lazuli-800 p-2 rounded border border-verdigris-200 dark:border-verdigris-700">
                <span className="font-semibold">Hash:</span> {hash}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={!hash || loading}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-verdigris-500 to-bondi-blue-500 hover:from-verdigris-600 hover:to-bondi-blue-600 disabled:from-indigo-dye-300 disabled:to-indigo-dye-300 
            text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:transform-none"
        >
          {loading ? "⏳ Verificando..." : "✓ Verificar Documento"}
        </button>

        {verificationResult && (
          <div className="p-5 bg-light-green-50 dark:bg-keppel-900/20 rounded-xl border border-light-green-200 dark:border-keppel-700 space-y-4">
            <div
              className={`p-4 rounded-xl border-2 ${
                verificationResult.isValid
                  ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600"
                  : "bg-bondi-blue-100 dark:bg-bondi-blue-900/30 border-bondi-blue-400 dark:border-bondi-blue-600"
              }`}
            >
              <p
                className={`font-bold text-lg ${
                  verificationResult.isValid
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-bondi-blue-800 dark:text-bondi-blue-200"
                }`}
              >
                {verificationResult.isValid ? "✓ Válido" : "✗ Inválido"}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-indigo-dye-700 dark:text-keppel-200">
                <span className="font-semibold">Hash:</span>{" "}
                <span className="font-mono text-indigo-dye dark:text-keppel-100 bg-white dark:bg-lapis-lazuli-800 px-2 py-1 rounded">
                  {verificationResult.documentInfo.hash}
                </span>
              </p>
              <p className="text-indigo-dye-700 dark:text-keppel-200">
                <span className="font-semibold">Timestamp:</span>{" "}
                <span className="text-indigo-dye dark:text-keppel-100">
                  {formatTimestamp(verificationResult.documentInfo.timestamp)}
                </span>
              </p>
              <p className="text-indigo-dye-700 dark:text-keppel-200">
                <span className="font-semibold">Signer:</span>{" "}
                <span className="font-mono text-indigo-dye dark:text-keppel-100">
                  {formatAddress(verificationResult.documentInfo.signer)}
                </span>
              </p>
            </div>
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
